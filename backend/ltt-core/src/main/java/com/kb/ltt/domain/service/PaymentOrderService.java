package com.kb.ltt.domain.service;

import com.kb.ltt.api.dto.*;
import com.kb.ltt.api.exception.BusinessException;
import com.kb.ltt.api.exception.OptimisticLockException;
import com.kb.ltt.api.exception.ResourceNotFoundException;
import com.kb.ltt.api.mapper.PaymentOrderMapper;
import com.kb.ltt.domain.model.ApprovalLog;
import com.kb.ltt.domain.model.PaymentOrder;
import com.kb.ltt.domain.model.PaymentOrderDetail;
import com.kb.ltt.domain.model.enums.ApprovalAction;
import com.kb.ltt.domain.model.enums.OrderStatus;
import com.kb.ltt.domain.repository.PaymentOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class PaymentOrderService {

    private final PaymentOrderRepository repository;
    private final PaymentOrderMapper mapper;

    @Transactional
    public PaymentOrderResponse create(CreatePaymentOrderRequest request, String currentUser) {
        if (repository.existsByRefNoAndIsDeletedFalse(request.getRefNo())) {
            throw new BusinessException("MSG-ERR-DUPLICATE",
                    "Da ton tai ban ghi co [So YCTT] = [" + request.getRefNo() + "]");
        }

        PaymentOrder entity = mapper.toEntity(request);
        entity.setCreatedBy(currentUser);
        entity.setStatus(OrderStatus.DRAFT);
        entity.setVersion(1);
        entity.setIsDeleted(false);

        mapDetails(request, entity, currentUser);

        PaymentOrder saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Transactional
    public PaymentOrderResponse update(Long id, Integer expectedVersion, UpdatePaymentOrderRequest request, String currentUser) {
        PaymentOrder entity = findActiveById(id);

        if (!StateMachine.canEdit(entity.getStatus())) {
            throw new BusinessException("MSG-ERR-STATUS",
                    "Giao dich dang o trang thai [" + entity.getStatus() + "], khong cho phep Sua/Xoa");
        }
        if (!entity.getCreatedBy().equals(currentUser)) {
            throw new BusinessException("MSG-ERR-MAKER", "Chi Nguoi lap goc moi duoc phep Sua/Xoa");
        }
        checkOptimisticLock(entity, expectedVersion);

        applyUpdate(request, entity, currentUser);

        PaymentOrder saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PaymentOrderResponse getById(Long id) {
        return mapper.toResponse(findActiveById(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentOrderListResponse> list(
            List<OrderStatus> statuses, String sender, String channel,
            LocalDateTime fromDate, LocalDateTime toDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate"));
        Page<PaymentOrder> result = repository.findByFilters(statuses, sender, channel, fromDate, toDate, pageable);
        return mapper.toPageResponse(
                result.getContent(), page, size, result.getTotalElements(), result.getTotalPages());
    }

    @Transactional
    public PaymentOrderResponse submit(Long id, Integer expectedVersion, String currentUser) {
        PaymentOrder entity = findActiveById(id);

        if (entity.getStatus() != OrderStatus.DRAFT && entity.getStatus() != OrderStatus.RETURNED_TO_MAKER) {
            throw new BusinessException("MSG-ERR-STATUS",
                    "Giao dich dang o trang thai [" + entity.getStatus() + "], khong cho phep Submit");
        }
        if (!entity.getCreatedBy().equals(currentUser)) {
            throw new BusinessException("MSG-ERR-MAKER", "Chi Nguoi lap goc moi duoc phep Submit");
        }
        checkOptimisticLock(entity, expectedVersion);

        StateMachine.validateTransition(entity.getStatus(), OrderStatus.READY_FOR_APPROVAL);
        OrderStatus previousStatus = entity.getStatus();

        entity.setStatus(OrderStatus.READY_FOR_APPROVAL);
        entity.setLastUpdatedBy(currentUser);

        logApproval(entity, currentUser, "MAKER", "LTT.NEW.SUBMIT",
                previousStatus.name(), OrderStatus.READY_FOR_APPROVAL.name(), null);

        PaymentOrder saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id, Integer expectedVersion, String reason, String currentUser) {
        PaymentOrder entity = findActiveById(id);

        if (!StateMachine.canDelete(entity.getStatus())) {
            throw new BusinessException("MSG-ERR-STATUS",
                    "Giao dich dang o trang thai [" + entity.getStatus() + "], khong cho phep Xoa");
        }
        if (!entity.getCreatedBy().equals(currentUser)) {
            throw new BusinessException("MSG-ERR-MAKER", "Chi Nguoi lap goc moi duoc phep Xoa");
        }
        if (reason == null || reason.length() < 10) {
            throw new BusinessException("MSG-ERR-DELETE-CFM",
                    "Vui long nhap ly do (>= 10 ky tu) va xac nhan da ra soat");
        }
        checkOptimisticLock(entity, expectedVersion);

        OrderStatus previousStatus = entity.getStatus();
        entity.setStatus(OrderStatus.DELETED);
        entity.setIsDeleted(true);
        entity.setDeletedBy(currentUser);
        entity.setDeletedDate(LocalDateTime.now());
        entity.setDeleteReason(reason);

        logApproval(entity, currentUser, "MAKER", "LTT.DELETE.CONFIRM",
                previousStatus.name(), OrderStatus.DELETED.name(), reason);

        repository.save(entity);
    }

    @Transactional
    public PaymentOrderResponse check(Long id, Integer expectedVersion, ApprovalRequest request, String currentUser) {
        PaymentOrder entity = findActiveById(id);

        OrderStatus targetStatus = StateMachine.resolveTargetStatus(ApprovalAction.CHECK, entity.getStatus());
        checkOptimisticLock(entity, expectedVersion);

        OrderStatus previousStatus = entity.getStatus();
        entity.setStatus(targetStatus);
        entity.setLastUpdatedBy(currentUser);
        entity.setCheckedBy(currentUser);
        entity.setCheckedDate(LocalDateTime.now());

        logApproval(entity, currentUser, "CHECKER", "LTT.APPROVE.CHECKER",
                previousStatus.name(), targetStatus.name(), request.getReason());

        PaymentOrder saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Transactional
    public PaymentOrderResponse approve(Long id, Integer expectedVersion, ApprovalRequest request, String currentUser) {
        PaymentOrder entity = findActiveById(id);

        OrderStatus targetStatus = StateMachine.resolveTargetStatus(ApprovalAction.APPROVE, entity.getStatus());
        checkOptimisticLock(entity, expectedVersion);

        OrderStatus previousStatus = entity.getStatus();
        entity.setStatus(targetStatus);
        entity.setLastUpdatedBy(currentUser);
        entity.setApprovedBy(currentUser);
        entity.setApprovedDate(LocalDateTime.now());

        logApproval(entity, currentUser, "APPROVER", "LTT.APPROVE.APPROVER",
                previousStatus.name(), targetStatus.name(), request.getReason());

        PaymentOrder saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Transactional
    public PaymentOrderResponse reject(Long id, Integer expectedVersion, ApprovalRequest request, String currentUser) {
        PaymentOrder entity = findActiveById(id);

        if (request.getReason() == null || request.getReason().length() < 10) {
            throw new BusinessException("MSG-ERR-REQUIRED", "Ly do tu choi phai tu 10 den 500 ky tu");
        }

        OrderStatus targetStatus = StateMachine.resolveTargetStatus(ApprovalAction.REJECT, entity.getStatus());
        checkOptimisticLock(entity, expectedVersion);

        OrderStatus previousStatus = entity.getStatus();
        entity.setStatus(targetStatus);
        entity.setLastUpdatedBy(currentUser);

        String actorRole = previousStatus == OrderStatus.READY_FOR_APPROVAL ? "CHECKER" : "APPROVER";
        logApproval(entity, currentUser, actorRole, "LTT.APPROVE.REJECT",
                previousStatus.name(), targetStatus.name(), request.getReason());

        PaymentOrder saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Transactional
    public PaymentOrderResponse returnToMaker(Long id, Integer expectedVersion, ApprovalRequest request, String currentUser) {
        PaymentOrder entity = findActiveById(id);

        if (request.getReason() == null || request.getReason().length() < 10) {
            throw new BusinessException("MSG-ERR-REQUIRED", "Ly do tra lai phai tu 10 den 500 ky tu");
        }

        OrderStatus targetStatus = StateMachine.resolveTargetStatus(ApprovalAction.RETURN, entity.getStatus());
        checkOptimisticLock(entity, expectedVersion);

        OrderStatus previousStatus = entity.getStatus();
        entity.setStatus(targetStatus);
        entity.setLastUpdatedBy(currentUser);

        String actorRole = previousStatus == OrderStatus.READY_FOR_APPROVAL ? "CHECKER" : "APPROVER";
        logApproval(entity, currentUser, actorRole, "LTT.APPROVE.RETURN",
                previousStatus.name(), targetStatus.name(), request.getReason());

        PaymentOrder saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    private PaymentOrder findActiveById(Long id) {
        return repository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentOrder", id.toString()));
    }

    private void checkOptimisticLock(PaymentOrder entity, Integer expectedVersion) {
        if (expectedVersion != null && !entity.getVersion().equals(expectedVersion)) {
            throw new OptimisticLockException();
        }
    }

    private void logApproval(PaymentOrder entity, String actor, String actorRole,
                             String action, String statusFrom, String statusTo, String note) {
        ApprovalLog log = ApprovalLog.builder()
                .paymentOrder(entity)
                .version(entity.getVersion())
                .actor(actor)
                .actorRole(actorRole)
                .action(action)
                .statusFrom(statusFrom)
                .statusTo(statusTo)
                .note(note)
                .build();
        entity.getApprovalLogs().add(log);
    }

    private void mapDetails(CreatePaymentOrderRequest request, PaymentOrder entity, String currentUser) {
        if (request.getDetails() == null) return;
        entity.getDetails().clear();
        AtomicInteger idx = new AtomicInteger(1);
        for (CreatePaymentOrderRequest.DetailLine line : request.getDetails()) {
            PaymentOrderDetail detail = PaymentOrderDetail.builder()
                    .paymentOrder(entity)
                    .lineNo(line.getLineNo() != null ? line.getLineNo() : idx.getAndIncrement())
                    .glSegment1(line.getGlSegment1())
                    .glSegment2(line.getGlSegment2())
                    .glSegment3(line.getGlSegment3())
                    .glSegment4(line.getGlSegment4())
                    .glSegment5(line.getGlSegment5())
                    .glSegment6(line.getGlSegment6())
                    .glSegment7(line.getGlSegment7())
                    .glSegment8(line.getGlSegment8())
                    .glSegment9(line.getGlSegment9())
                    .glSegment10(line.getGlSegment10())
                    .glSegment11(line.getGlSegment11())
                    .glSegment12(line.getGlSegment12())
                    .lineDescription(line.getLineDescription())
                    .lineAmount(line.getLineAmount())
                    .createdBy(currentUser)
                    .isDeleted(false)
                    .build();
            entity.getDetails().add(detail);
        }
    }

    private void applyUpdate(UpdatePaymentOrderRequest request, PaymentOrder entity, String currentUser) {
        if (request.getChannel() != null) entity.setChannel(request.getChannel());
        if (request.getTransactionType() != null) entity.setTransactionType(request.getTransactionType());
        if (request.getLnhTransactionType() != null) entity.setLnhTransactionType(request.getLnhTransactionType());
        if (request.getSender() != null) entity.setSender(request.getSender());
        if (request.getReceiver() != null) entity.setReceiver(request.getReceiver());
        if (request.getRefNo() != null) entity.setRefNo(request.getRefNo());
        if (request.getPaymentDate() != null) entity.setPaymentDate(request.getPaymentDate());
        if (request.getAmount() != null) entity.setAmount(request.getAmount());
        if (request.getCurrencyCode() != null) entity.setCurrencyCode(request.getCurrencyCode());
        if (request.getExchangeRate() != null) entity.setExchangeRate(request.getExchangeRate());
        if (request.getOriginNum() != null) entity.setOrgNum(request.getOriginNum());
        if (request.getTransactionDate() != null) entity.setTransactionDate(request.getTransactionDate());
        if (request.getExpType() != null) entity.setExpType(request.getExpType());
        if (request.getFnCode1() != null) entity.setFnCode1(request.getFnCode1());
        if (request.getFnCode2() != null) entity.setFnCode2(request.getFnCode2());
        if (request.getFnAmount() != null) entity.setFnAmount(request.getFnAmount());
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getSenderInfo() != null) {
            entity.setSenderName(request.getSenderInfo().getSenderName());
            entity.setSenderAddress(request.getSenderInfo().getSenderAddress());
            entity.setSenderGlSegment2(request.getSenderInfo().getSenderGlSegment2());
            entity.setSenderNum(request.getSenderInfo().getSenderNum());
            entity.setSenderBankCode(request.getSenderInfo().getSenderBankCode());
            entity.setSenderIdentifyId(request.getSenderInfo().getSenderIdentifyId());
            entity.setSenderIssuedDate(request.getSenderInfo().getSenderIssuedDate());
            entity.setSenderIssuedPlace(request.getSenderInfo().getSenderIssuedPlace());
            entity.setTpcpCode(request.getSenderInfo().getTpcpCode());
        }
        if (request.getReceiverInfo() != null) {
            entity.setReceiverName(request.getReceiverInfo().getReceiverName());
            entity.setReceiverAddress(request.getReceiverInfo().getReceiverAddress());
            entity.setReceiverGlSegment2(request.getReceiverInfo().getReceiverGlSegment2());
            entity.setReceiverBankName(request.getReceiverInfo().getReceiverBankName());
            entity.setReceiverBankCode(request.getReceiverInfo().getReceiverBankCode());
            entity.setReceiverIdentifyId(request.getReceiverInfo().getReceiverIdentifyId());
            entity.setReceiverIssuedDate(request.getReceiverInfo().getReceiverIssuedDate());
            entity.setReceiverIssuedPlace(request.getReceiverInfo().getReceiverIssuedPlace());
        }
        if (request.getDetails() != null) {
            entity.getDetails().clear();
            AtomicInteger idx = new AtomicInteger(1);
            for (CreatePaymentOrderRequest.DetailLine line : request.getDetails()) {
                PaymentOrderDetail detail = PaymentOrderDetail.builder()
                        .paymentOrder(entity)
                        .lineNo(line.getLineNo() != null ? line.getLineNo() : idx.getAndIncrement())
                        .glSegment1(line.getGlSegment1())
                        .glSegment2(line.getGlSegment2())
                        .glSegment3(line.getGlSegment3())
                        .glSegment4(line.getGlSegment4())
                        .glSegment5(line.getGlSegment5())
                        .glSegment6(line.getGlSegment6())
                        .glSegment7(line.getGlSegment7())
                        .glSegment8(line.getGlSegment8())
                        .glSegment9(line.getGlSegment9())
                        .glSegment10(line.getGlSegment10())
                        .glSegment11(line.getGlSegment11())
                        .glSegment12(line.getGlSegment12())
                        .lineDescription(line.getLineDescription())
                        .lineAmount(line.getLineAmount())
                        .createdBy(currentUser)
                        .isDeleted(false)
                        .build();
                entity.getDetails().add(detail);
            }
        }
        entity.setLastUpdatedBy(currentUser);
    }
}
