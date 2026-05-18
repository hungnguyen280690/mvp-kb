package com.kb.ltt.domain.service;

import com.kb.ltt.api.dto.*;
import com.kb.ltt.api.exception.BusinessException;
import com.kb.ltt.api.exception.InvalidStateTransitionException;
import com.kb.ltt.api.exception.OptimisticLockException;
import com.kb.ltt.api.exception.ResourceNotFoundException;
import com.kb.ltt.api.mapper.PaymentOrderMapper;
import com.kb.ltt.domain.model.PaymentOrder;
import com.kb.ltt.domain.model.enums.OrderStatus;
import com.kb.ltt.domain.repository.PaymentOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentOrderServiceTest {

    @Mock
    private PaymentOrderRepository repository;

    @Mock
    private PaymentOrderMapper mapper;

    @InjectMocks
    private PaymentOrderService service;

    private static final String MAKER = "maker1";
    private static final String CHECKER = "checker1";
    private static final String APPROVER = "approver1";

    private PaymentOrder buildOrder(Long id, OrderStatus status, String createdBy, Integer version) {
        PaymentOrder order = PaymentOrder.builder()
                .id(id)
                .uuid("uuid-" + id)
                .refNo("REF-" + id)
                .channel("LIEN_NGAN_HANG")
                .transactionType("TT_NOI_DIA")
                .sender("SENDER01")
                .receiver("RECEIVER01")
                .amount(new BigDecimal("1000000.00"))
                .currencyCode("VND")
                .paymentDate(LocalDate.now())
                .description("Test payment")
                .status(status)
                .version(version)
                .createdBy(createdBy)
                .isDeleted(false)
                .build();
        order.setCreatedBy(createdBy);
        return order;
    }

    private CreatePaymentOrderRequest buildCreateRequest() {
        CreatePaymentOrderRequest req = new CreatePaymentOrderRequest();
        req.setChannel("LIEN_NGAN_HANG");
        req.setTransactionType("TT_NOI_DIA");
        req.setSender("SENDER01");
        req.setReceiver("RECEIVER01");
        req.setRefNo("REF-NEW");
        req.setPaymentDate(LocalDate.now());
        req.setAmount(new BigDecimal("1000000.00"));
        req.setDescription("Test payment");

        CreatePaymentOrderRequest.DetailLine line = new CreatePaymentOrderRequest.DetailLine();
        line.setGlSegment2("1121");
        line.setGlSegment3("1234567");
        line.setLineDescription("Detail line 1");
        line.setLineAmount(new BigDecimal("1000000.00"));
        req.setDetails(List.of(line));

        CreatePaymentOrderRequest.SenderInfoDto sender = new CreatePaymentOrderRequest.SenderInfoDto();
        sender.setSenderName("Sender Name");
        sender.setSenderGlSegment2("1121");
        sender.setSenderBankCode("BANK01");
        req.setSenderInfo(sender);

        CreatePaymentOrderRequest.ReceiverInfoDto receiver = new CreatePaymentOrderRequest.ReceiverInfoDto();
        receiver.setReceiverName("Receiver Name");
        receiver.setReceiverGlSegment2("3111");
        receiver.setReceiverBankName("Bank Receiver");
        receiver.setReceiverBankCode("BANK02");
        req.setReceiverInfo(receiver);

        return req;
    }

    private ApprovalRequest buildApprovalRequest(String reason) {
        ApprovalRequest req = new ApprovalRequest();
        req.setReason(reason);
        return req;
    }

    @Nested
    class CreateTests {

        @Test
        void create_setsStatusToDraft() {
            when(repository.existsByRefNoAndIsDeletedFalse("REF-NEW")).thenReturn(false);
            when(mapper.toEntity(any(CreatePaymentOrderRequest.class))).thenAnswer(inv -> {
                PaymentOrder entity = new PaymentOrder();
                entity.setDetails(new java.util.ArrayList<>());
                return entity;
            });
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.create(buildCreateRequest(), MAKER);

            verify(repository).save(argThat(order ->
                    order.getStatus() == OrderStatus.DRAFT &&
                    order.getCreatedBy().equals(MAKER) &&
                    order.getVersion().equals(1)
            ));
        }

        @Test
        void create_rejectsDuplicateRefNo() {
            when(repository.existsByRefNoAndIsDeletedFalse("REF-NEW")).thenReturn(true);

            assertThrows(BusinessException.class, () ->
                    service.create(buildCreateRequest(), MAKER));
        }
    }

    @Nested
    class UpdateTests {

        @Test
        void update_draft_succeeds() {
            PaymentOrder order = buildOrder(1L, OrderStatus.DRAFT, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdatePaymentOrderRequest req = new UpdatePaymentOrderRequest();
            req.setDescription("Updated desc");

            service.update(1L, 1, req, MAKER);
            verify(repository).save(any());
        }

        @Test
        void update_wrongMaker_throws() {
            PaymentOrder order = buildOrder(1L, OrderStatus.DRAFT, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));

            assertThrows(BusinessException.class, () ->
                    service.update(1L, 1, new UpdatePaymentOrderRequest(), "other_user"));
        }

        @Test
        void update_approvedStatus_throws() {
            PaymentOrder order = buildOrder(1L, OrderStatus.APPROVED, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));

            assertThrows(BusinessException.class, () ->
                    service.update(1L, 1, new UpdatePaymentOrderRequest(), MAKER));
        }

        @Test
        void update_versionMismatch_throwsOptimisticLock() {
            PaymentOrder order = buildOrder(1L, OrderStatus.DRAFT, MAKER, 2);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));

            assertThrows(OptimisticLockException.class, () ->
                    service.update(1L, 1, new UpdatePaymentOrderRequest(), MAKER));
        }
    }

    @Nested
    class SubmitTests {

        @Test
        void submit_draft_toReadyForApproval() {
            PaymentOrder order = buildOrder(1L, OrderStatus.DRAFT, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.submit(1L, 1, MAKER);
            verify(repository).save(argThat(o ->
                    o.getStatus() == OrderStatus.READY_FOR_APPROVAL));
        }

        @Test
        void submit_returnedToMaker_toReadyForApproval() {
            PaymentOrder order = buildOrder(1L, OrderStatus.RETURNED_TO_MAKER, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.submit(1L, 1, MAKER);
            verify(repository).save(argThat(o ->
                    o.getStatus() == OrderStatus.READY_FOR_APPROVAL));
        }

        @Test
        void submit_wrongMaker_throws() {
            PaymentOrder order = buildOrder(1L, OrderStatus.DRAFT, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));

            assertThrows(BusinessException.class, () ->
                    service.submit(1L, 1, "other_user"));
        }

        @Test
        void submit_nonEditableStatus_throws() {
            PaymentOrder order = buildOrder(1L, OrderStatus.APPROVED, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));

            assertThrows(BusinessException.class, () ->
                    service.submit(1L, 1, MAKER));
        }
    }

    @Nested
    class DeleteTests {

        @Test
        void delete_draft_softDeletes() {
            PaymentOrder order = buildOrder(1L, OrderStatus.DRAFT, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.delete(1L, 1, "This is a valid delete reason", MAKER);
            verify(repository).save(argThat(o ->
                    o.getStatus() == OrderStatus.DELETED &&
                    Boolean.TRUE.equals(o.getIsDeleted())));
        }

        @Test
        void delete_shortReason_throws() {
            PaymentOrder order = buildOrder(1L, OrderStatus.DRAFT, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));

            assertThrows(BusinessException.class, () ->
                    service.delete(1L, 1, "short", MAKER));
        }

        @Test
        void delete_approvedStatus_throws() {
            PaymentOrder order = buildOrder(1L, OrderStatus.APPROVED, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));

            assertThrows(BusinessException.class, () ->
                    service.delete(1L, 1, "Valid reason here", MAKER));
        }
    }

    @Nested
    class CheckTests {

        @Test
        void check_readyForApproval_toPendingApprover() {
            PaymentOrder order = buildOrder(1L, OrderStatus.READY_FOR_APPROVAL, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.check(1L, 1, buildApprovalRequest("Looks good to me"), CHECKER);
            verify(repository).save(argThat(o ->
                    o.getStatus() == OrderStatus.PENDING_APPROVER &&
                    o.getCheckedBy().equals(CHECKER)));
        }

        @Test
        void check_wrongStatus_throws() {
            PaymentOrder order = buildOrder(1L, OrderStatus.DRAFT, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));

            assertThrows(InvalidStateTransitionException.class, () ->
                    service.check(1L, 1, buildApprovalRequest("OK"), CHECKER));
        }
    }

    @Nested
    class ApproveTests {

        @Test
        void approve_pendingApprover_toApproved() {
            PaymentOrder order = buildOrder(1L, OrderStatus.PENDING_APPROVER, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.approve(1L, 1, buildApprovalRequest("Approved by approver"), APPROVER);
            verify(repository).save(argThat(o ->
                    o.getStatus() == OrderStatus.APPROVED &&
                    o.getApprovedBy().equals(APPROVER)));
        }

        @Test
        void approve_wrongStatus_throws() {
            PaymentOrder order = buildOrder(1L, OrderStatus.READY_FOR_APPROVAL, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));

            assertThrows(InvalidStateTransitionException.class, () ->
                    service.approve(1L, 1, buildApprovalRequest("OK"), APPROVER));
        }
    }

    @Nested
    class RejectTests {

        @Test
        void reject_readyForApproval_toRejected() {
            PaymentOrder order = buildOrder(1L, OrderStatus.READY_FOR_APPROVAL, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.reject(1L, 1, buildApprovalRequest("Rejecting because of data errors"), CHECKER);
            verify(repository).save(argThat(o ->
                    o.getStatus() == OrderStatus.REJECTED));
        }

        @Test
        void reject_pendingApprover_toRejected() {
            PaymentOrder order = buildOrder(1L, OrderStatus.PENDING_APPROVER, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.reject(1L, 1, buildApprovalRequest("Rejecting due to compliance"), APPROVER);
            verify(repository).save(argThat(o ->
                    o.getStatus() == OrderStatus.REJECTED));
        }

        @Test
        void reject_shortReason_throws() {
            PaymentOrder order = buildOrder(1L, OrderStatus.READY_FOR_APPROVAL, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));

            assertThrows(BusinessException.class, () ->
                    service.reject(1L, 1, buildApprovalRequest("short"), CHECKER));
        }

        @Test
        void reject_wrongStatus_throws() {
            PaymentOrder order = buildOrder(1L, OrderStatus.DRAFT, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));

            assertThrows(InvalidStateTransitionException.class, () ->
                    service.reject(1L, 1, buildApprovalRequest("Reason is long enough"), CHECKER));
        }
    }

    @Nested
    class ReturnTests {

        @Test
        void returnToMaker_readyForApproval_toReturned() {
            PaymentOrder order = buildOrder(1L, OrderStatus.READY_FOR_APPROVAL, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.returnToMaker(1L, 1, buildApprovalRequest("Please fix the amount field"), CHECKER);
            verify(repository).save(argThat(o ->
                    o.getStatus() == OrderStatus.RETURNED_TO_MAKER));
        }

        @Test
        void returnToMaker_pendingApprover_toReturned() {
            PaymentOrder order = buildOrder(1L, OrderStatus.PENDING_APPROVER, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            service.returnToMaker(1L, 1, buildApprovalRequest("Return for corrections"), APPROVER);
            verify(repository).save(argThat(o ->
                    o.getStatus() == OrderStatus.RETURNED_TO_MAKER));
        }

        @Test
        void returnToMaker_wrongStatus_throws() {
            PaymentOrder order = buildOrder(1L, OrderStatus.APPROVED, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));

            assertThrows(InvalidStateTransitionException.class, () ->
                    service.returnToMaker(1L, 1, buildApprovalRequest("Reason is long enough"), CHECKER));
        }
    }

    @Nested
    class StateMachineTests {

        @Test
        void fullHappyPath_draftToApproved() {
            PaymentOrder order = buildOrder(1L, OrderStatus.DRAFT, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> {
                PaymentOrder o = inv.getArgument(0);
                return o;
            });

            service.submit(1L, 1, MAKER);
            reset(repository);

            order.setStatus(OrderStatus.READY_FOR_APPROVAL);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            service.check(1L, 1, buildApprovalRequest("Checked OK"), CHECKER);
            reset(repository);

            order.setStatus(OrderStatus.PENDING_APPROVER);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            service.approve(1L, 1, buildApprovalRequest("Approved"), APPROVER);

            verify(repository).save(argThat(o ->
                    o.getStatus() == OrderStatus.APPROVED));
        }
    }

    @Nested
    class GetTests {

        @Test
        void getById_existing_returnsResponse() {
            PaymentOrder order = buildOrder(1L, OrderStatus.DRAFT, MAKER, 1);
            when(repository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(order));
            when(mapper.toResponse(order)).thenReturn(PaymentOrderResponse.builder().id(1L).build());

            PaymentOrderResponse resp = service.getById(1L);
            assertNotNull(resp);
            assertEquals(1L, resp.getId());
        }

        @Test
        void getById_notFound_throws() {
            when(repository.findByIdAndIsDeletedFalse(999L)).thenReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> service.getById(999L));
        }
    }
}
