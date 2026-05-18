package com.kb.ltt.domain.service;

import com.kb.ltt.domain.model.*;
import com.kb.ltt.domain.port.inbound.LttService;
import com.kb.ltt.domain.port.outbound.LttRepository;
import com.kb.ltt.domain.port.outbound.AuditEventPublisher;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

class LttServiceTest {

    private LttRepository repository;
    private AuditEventPublisher auditPublisher;
    private LttService lttService;

    @BeforeEach
    void setUp() {
        repository = mock(LttRepository.class);
        auditPublisher = mock(AuditEventPublisher.class);
        lttService = new LttServiceImpl(repository, auditPublisher);
    }

    // BIZ-002: Create LTT as Draft
    @Test
    void createLtt_shouldReturnDraftWithVersion1() {
        when(repository.saveHeader(any())).thenAnswer(inv -> inv.getArgument(0));

        LttHeader header = lttService.createLtt(
            LttCreateRequest.builder()
                .channel(LttChannel.TTSP)
                .transactionType("LENH_CHUYEN_KHOAN")
                .senderCode("KBHN001")
                .receiverCode("KBHCM001")
                .refNo("YCTT-2026-00001")
                .paymentDate(LocalDate.now())
                .amount(new BigDecimal("150000000.00"))
                .currencyCode("VND")
                .description("Thanh toan hop dong")
                .details(details150M())
                .sender(sender())
                .receiver(receiver())
                .build(),
            "maker01"
        );

        assertEquals(LttStatus.DRAFT, header.getFStatus());
        assertEquals(1, header.getFVer());
        assertEquals("maker01", header.getCreatedBy());
    }

    // BIZ-009: Submit LTT -> READY_FOR_APPROVAL
    @Test
    void submitLtt_shouldTransitionToReadyForApproval() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(draft.getFId())).thenReturn(Optional.of(draft));
        when(repository.findDetailsByLttId(draft.getFId())).thenReturn(detailEntities150M());

        lttService.submitLtt(draft.getFId(), "maker01");

        verify(repository).saveHeader(argThat(ltt ->
            ltt.getFStatus() == LttStatus.READY_FOR_APPROVAL
        ));
    }

    // BIZ-001: SoD - Checker must differ from Maker
    @Test
    void checkLtt_sameUserAsMaker_shouldThrowSoDViolation() {
        LttHeader submitted = createSubmittedLtt("maker01");
        when(repository.findHeaderById(submitted.getFId())).thenReturn(Optional.of(submitted));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            lttService.checkLtt(submitted.getFId(),
                LttApprovalRequest.builder()
                    .fVer(1)
                    .action(LttApprovalRequest.ApprovalAction.APPROVE)
                    .build(),
                "maker01"
            )
        );
        assertTrue(ex.getMessage().contains("SoD"));
    }

    // BIZ-001: SoD - Checker approve success when different user
    @Test
    void checkLtt_differentUser_shouldTransitionToPendingApprover() {
        LttHeader submitted = createSubmittedLtt("maker01");
        when(repository.findHeaderById(submitted.getFId())).thenReturn(Optional.of(submitted));

        lttService.checkLtt(submitted.getFId(),
            LttApprovalRequest.builder()
                .fVer(1)
                .action(LttApprovalRequest.ApprovalAction.APPROVE)
                .build(),
            "checker01"
        );

        verify(repository).saveHeader(argThat(ltt ->
            ltt.getFStatus() == LttStatus.PENDING_APPROVER
        ));
    }

    // BIZ-001: SoD - Approver must differ from Maker
    @Test
    void approveLtt_sameUserAsMaker_shouldThrowSoDViolation() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findHeaderById(pending.getFId())).thenReturn(Optional.of(pending));

        assertThrows(IllegalStateException.class, () ->
            lttService.approveLtt(pending.getFId(),
                LttApprovalRequest.builder()
                    .fVer(1)
                    .action(LttApprovalRequest.ApprovalAction.APPROVE)
                    .note("OTP")
                    .build(),
                "maker01"
            )
        );
    }

    // BIZ-001: SoD - Approver must differ from Checker
    @Test
    void approveLtt_sameUserAsChecker_shouldThrowSoDViolation() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findHeaderById(pending.getFId())).thenReturn(Optional.of(pending));

        assertThrows(IllegalStateException.class, () ->
            lttService.approveLtt(pending.getFId(),
                LttApprovalRequest.builder()
                    .fVer(1)
                    .action(LttApprovalRequest.ApprovalAction.APPROVE)
                    .note("OTP")
                    .build(),
                "checker01"
            )
        );
    }

    // BIZ-001: Approver approve success -> APPROVED
    @Test
    void approveLtt_differentUser_shouldTransitionToApproved() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findHeaderById(pending.getFId())).thenReturn(Optional.of(pending));

        lttService.approveLtt(pending.getFId(),
            LttApprovalRequest.builder()
                .fVer(1)
                .action(LttApprovalRequest.ApprovalAction.APPROVE)
                .note("OTP confirmed")
                .build(),
            "approver01"
        );

        verify(repository).saveHeader(argThat(ltt ->
            ltt.getFStatus() == LttStatus.APPROVED
        ));
    }

    // VAL-15: Optimistic lock conflict
    @Test
    void updateLtt_wrongVersion_shouldThrowOptimisticLockConflict() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(draft.getFId())).thenReturn(Optional.of(draft));

        assertThrows(IllegalStateException.class, () ->
            lttService.updateLtt(draft.getFId(),
                LttUpdateRequest.builder().fVer(99).build(), "maker01"
            )
        );
    }

    // VAL-16: Delete reason too short
    @Test
    void deleteLtt_reasonTooShort_shouldThrowValidation() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(draft.getFId())).thenReturn(Optional.of(draft));

        assertThrows(IllegalArgumentException.class, () ->
            lttService.deleteLtt(draft.getFId(),
                LttDeleteRequest.builder()
                    .fVer(1)
                    .deleteReason("ngan")
                    .build(),
                "maker01"
            )
        );
    }

    // BIZ-003: Soft-delete
    @Test
    void deleteLtt_shouldSoftDelete() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(draft.getFId())).thenReturn(Optional.of(draft));

        lttService.deleteLtt(draft.getFId(),
            LttDeleteRequest.builder()
                .fVer(1)
                .deleteReason("Xoa do lap sai thong tin nguoi nhan")
                .build(),
            "maker01"
        );

        verify(repository).saveHeader(argThat(ltt ->
            ltt.getFStatus() == LttStatus.DELETED
        ));
    }

    // Copy creates new Draft
    @Test
    void copyLtt_shouldCreateNewDraft() {
        LttHeader approved = createApprovedLtt();
        when(repository.findHeaderById(approved.getFId())).thenReturn(Optional.of(approved));
        when(repository.findDetailsByLttId(approved.getFId())).thenReturn(List.of());
        when(repository.findSenderByLttId(approved.getFId())).thenReturn(java.util.Optional.empty());
        when(repository.findReceiverByLttId(approved.getFId())).thenReturn(java.util.Optional.empty());
        when(repository.saveHeader(any())).thenAnswer(inv -> inv.getArgument(0));

        LttHeader copy = lttService.copyLtt(approved.getFId(), "maker01");

        assertNotEquals(approved.getFId(), copy.getFId());
        assertEquals(LttStatus.DRAFT, copy.getFStatus());
        assertEquals(1, copy.getFVer());
    }

    // Helper methods

    private LttHeader createDraftLtt() {
        return LttHeader.builder()
            .fId(1L)
            .fStatus(LttStatus.DRAFT)
            .fVer(1)
            .createdBy("maker01")
            .channel(LttChannel.TTSP)
            .amount(new BigDecimal("150000000.00"))
            .build();
    }

    private LttHeader createSubmittedLtt(String maker) {
        return LttHeader.builder()
            .fId(1L)
            .fStatus(LttStatus.READY_FOR_APPROVAL)
            .fVer(1)
            .createdBy(maker)
            .build();
    }

    private LttHeader createPendingLtt(String maker, String checker) {
        return LttHeader.builder()
            .fId(1L)
            .fStatus(LttStatus.PENDING_APPROVER)
            .fVer(1)
            .createdBy(maker)
            .checkedBy(checker)
            .build();
    }

    private LttHeader createApprovedLtt() {
        return LttHeader.builder()
            .fId(1L)
            .fStatus(LttStatus.APPROVED)
            .fVer(2)
            .createdBy("maker01")
            .checkedBy("checker01")
            .approvedBy("approver01")
            .build();
    }

    private List<LttCreateRequest.LttDetailLine> details150M() {
        return List.of(LttCreateRequest.LttDetailLine.builder()
            .glSegment2("1120")
            .glSegment3("1010101")
            .glSegment5("040")
            .glSegment6("260")
            .description("Mua sam trang thiet bi")
            .amount(new BigDecimal("150000000.00"))
            .build()
        );
    }

    private LttCreateRequest.LttSenderInfo sender() {
        return LttCreateRequest.LttSenderInfo.builder()
            .senderName("KB Ha Noi")
            .senderAddress("So 1, Pham Van Dong")
            .senderGlSegment2("1120")
            .senderBankCode("KBHN001")
            .build();
    }

    private LttCreateRequest.LttReceiverInfo receiver() {
        return LttCreateRequest.LttReceiverInfo.builder()
            .receiverName("KB TP HCM")
            .receiverGlSegment2("1121")
            .receiverBankName("KB TP HCM")
            .receiverBankCode("KBHCM001")
            .build();
    }

    private List<LttDetail> detailEntities150M() {
        return List.of(LttDetail.builder()
            .lttId(1L)
            .lineNo(1)
            .glSegment2("1120")
            .glSegment3("1010101")
            .glSegment5("040")
            .glSegment6("260")
            .description("Mua sam trang thiet bi")
            .amount(new BigDecimal("150000000.00"))
            .build()
        );
    }
}
