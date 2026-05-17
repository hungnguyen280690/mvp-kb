package com.kb.lttcore.domain.service;

import com.kb.lttcore.domain.model.*;
import com.kb.lttcore.domain.port.inbound.LttService;
import com.kb.lttcore.domain.port.outbound.LttRepository;
import com.kb.lttcore.domain.port.outbound.AuditEventPublisher;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Unit tests for LTT business logic.
 * Each test maps to a business rule ID (BIZ-xxx / VAL-xxx) per Rule 1.3.
 */
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
        LttHeader header = lttService.createLtt(
            new CreateLttRequest(
                LttChannel.TTSP, "LENH_CHUYEN_KHOAN", null,
                "KBHN001", "KBHCM001", "YCTT-2026-00001",
                LocalDate.now(), new BigDecimal("150000000.00"), "VND",
                null, null, null, null, null, null, null,
                "Thanh toan hop dong", details150M(), sender(), receiver()
            ),
            "maker01"
        );

        assertNotNull(header.getFId());
        assertEquals(LttStatus.DRAFT, header.getFStatus());
        assertEquals(1, header.getFVer());
        assertEquals("maker01", header.getCreatedBy());
    }

    // BIZ-009: Submit LTT → READY_FOR_APPROVAL
    @Test
    void submitLtt_shouldTransitionToReadyForApproval() {
        LttHeader draft = createDraftLtt();
        when(repository.findById(draft.getFId())).thenReturn(draft);

        lttService.submitLtt(draft.getFId(), "maker01");

        verify(repository).save(argThat(ltt ->
            ltt.getFStatus() == LttStatus.READY_FOR_APPROVAL
        ));
    }

    // BIZ-001: SoD — Checker must differ from Maker
    @Test
    void checkLtt_sameUserAsMaker_shouldThrowSoDViolation() {
        LttHeader submitted = createSubmittedLtt("maker01");
        when(repository.findById(submitted.getFId())).thenReturn(submitted);

        SoDViolationException ex = assertThrows(SoDViolationException.class, () ->
            lttService.checkLtt(submitted.getFId(),
                new CheckRequest("APPROVE", null, null, null), "maker01"
            )
        );
        assertTrue(ex.getMessage().contains("SoD"));
    }

    // BIZ-001: SoD — Checker approve success when different user
    @Test
    void checkLtt_differentUser_shouldTransitionToPendingApprover() {
        LttHeader submitted = createSubmittedLtt("maker01");
        when(repository.findById(submitted.getFId())).thenReturn(submitted);

        lttService.checkLtt(submitted.getFId(),
            new CheckRequest("APPROVE", null, null, null), "checker01"
        );

        verify(repository).save(argThat(ltt ->
            ltt.getFStatus() == LttStatus.PENDING_APPROVER
        ));
    }

    // BIZ-001: SoD — Approver must differ from Maker and Checker
    @Test
    void approveLtt_sameUserAsMaker_shouldThrowSoDViolation() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findById(pending.getFId())).thenReturn(pending);

        assertThrows(SoDViolationException.class, () ->
            lttService.approveLtt(pending.getFId(),
                new ApproveRequest("APPROVE", null, "OTP", null, null), "maker01"
            )
        );
    }

    @Test
    void approveLtt_sameUserAsChecker_shouldThrowSoDViolation() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findById(pending.getFId())).thenReturn(pending);

        assertThrows(SoDViolationException.class, () ->
            lttService.approveLtt(pending.getFId(),
                new ApproveRequest("APPROVE", null, "OTP", null, null), "checker01"
            )
        );
    }

    // BIZ-001: Approver approve success → APPROVED
    @Test
    void approveLtt_differentUser_shouldTransitionToApproved() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findById(pending.getFId())).thenReturn(pending);

        lttService.approveLtt(pending.getFId(),
            new ApproveRequest("APPROVE", null, "OTP", "123456", null), "approver01"
        );

        verify(repository).save(argThat(ltt ->
            ltt.getFStatus() == LttStatus.APPROVED
        ));
    }

    // VAL-15: Optimistic lock conflict
    @Test
    void updateLtt_wrongVersion_shouldThrowOptimisticLockConflict() {
        LttHeader draft = createDraftLtt();
        draft.setFVer(2);
        when(repository.findById(draft.getFId())).thenReturn(draft);

        OptimisticLockConflictException ex = assertThrows(
            OptimisticLockConflictException.class, () ->
                lttService.updateLtt(draft.getFId(),
                    new UpdateLttRequest(/* ... */ 1), "maker01"  // client sends ver=1, DB has ver=2
                )
        );
    }

    // VAL-16: Delete reason too short
    @Test
    void deleteLtt_reasonTooShort_shouldThrowValidation() {
        LttHeader draft = createDraftLtt();
        when(repository.findById(draft.getFId())).thenReturn(draft);

        assertThrows(BusinessRuleViolationException.class, () ->
            lttService.deleteLtt(draft.getFId(),
                new DeleteLttRequest("ngan", true), "maker01"
            )
        );
    }

    // BIZ-004: Detail amount sum != header amount
    @Test
    void createLtt_detailSumMismatch_shouldThrowValidation() {
        assertThrows(BusinessRuleViolationException.class, () ->
            lttService.createLtt(
                new CreateLttRequest(
                    LttChannel.TTSP, "LENH_CHUYEN_KHOAN", null,
                    "KBHN001", "KBHCM001", "YCTT-2026-00001",
                    LocalDate.now(), new BigDecimal("150000000.00"), "VND",
                    null, null, null, null, null, null, null,
                    "Thanh toan", mismatchedDetails(), sender(), receiver()
                ),
                "maker01"
            )
        );
    }

    // BIZ-003: Soft-delete
    @Test
    void deleteLtt_shouldSoftDelete() {
        LttHeader draft = createDraftLtt();
        when(repository.findById(draft.getFId())).thenReturn(draft);

        lttService.deleteLtt(draft.getFId(),
            new DeleteLttRequest("Xoa do lap sai thong tin nguoi nhan", true), "maker01"
        );

        verify(repository).save(argThat(ltt ->
            ltt.getFStatus() == LttStatus.DELETED
            && ltt.getDeletedBy().equals("maker01")
            && ltt.getDeleteReason() != null
        ));
    }

    // Copy creates new Draft
    @Test
    void copyLtt_shouldCreateNewDraft() {
        LttHeader approved = createApprovedLtt();
        when(repository.findById(approved.getFId())).thenReturn(approved);

        LttHeader copy = lttService.copyLtt(approved.getFId(), "maker01");

        assertNotEquals(approved.getFId(), copy.getFId());
        assertEquals(LttStatus.DRAFT, copy.getFStatus());
        assertEquals(1, copy.getFVer());
    }

    // Helper methods
    private LttHeader createDraftLtt() {
        return LttHeader.builder()
            .fId("LTT-001")
            .fStatus(LttStatus.DRAFT)
            .fVer(1)
            .createdBy("maker01")
            .channel(LttChannel.TTSP)
            .amount(new BigDecimal("150000000.00"))
            .build();
    }

    private LttHeader createSubmittedLtt(String maker) {
        return LttHeader.builder()
            .fId("LTT-001")
            .fStatus(LttStatus.READY_FOR_APPROVAL)
            .fVer(1)
            .createdBy(maker)
            .build();
    }

    private LttHeader createPendingLtt(String maker, String checker) {
        return LttHeader.builder()
            .fId("LTT-001")
            .fStatus(LttStatus.PENDING_APPROVER)
            .fVer(1)
            .createdBy(maker)
            .checkedBy(checker)
            .build();
    }

    private LttHeader createApprovedLtt() {
        return LttHeader.builder()
            .fId("LTT-001")
            .fStatus(LttStatus.APPROVED)
            .fVer(2)
            .createdBy("maker01")
            .checkedBy("checker01")
            .approvedBy("approver01")
            .build();
    }

    private List<LttDetailRequest> details150M() {
        return List.of(new LttDetailRequest(
            "01", "1120", "1010101", null, "040", "260",
            null, null, null, null, null, null,
            "Mua sam trang thiet bi", new BigDecimal("150000000.00")
        ));
    }

    private List<LttDetailRequest> mismatchedDetails() {
        return List.of(new LttDetailRequest(
            "01", "1120", "1010101", null, "040", "260",
            null, null, null, null, null, null,
            "Mua sam", new BigDecimal("100000000.00")  // Only 100M, header says 150M
        ));
    }

    private SenderRequest sender() {
        return new SenderRequest("KB Ha Noi", "So 1, Pham Van Dong", "1120", null, "KBHN001", null, null, null, null);
    }

    private ReceiverRequest receiver() {
        return new ReceiverRequest("KB TP HCM", null, "1121", "KB TP HCM", "KBHCM001", null, null, null);
    }
}
