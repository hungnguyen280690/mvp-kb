package com.kb.ltt.domain.service;

import com.kb.ltt.domain.model.*;
import com.kb.ltt.domain.port.inbound.LttService;
import com.kb.ltt.domain.port.outbound.LttRepository;
import com.kb.ltt.domain.port.outbound.AuditEventPublisher;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.Tag;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

    // ========================================================================
    // UC-001: Tao LTT moi
    // ========================================================================

    // UC-001.1 — BIZ-002, BIZ-004, BIZ-008
    @Test
    @Tag("UC-001")
    void createLtt_shouldReturnDraftV1() {
        when(repository.saveHeader(any())).thenAnswer(inv -> inv.getArgument(0));

        LttHeader header = lttService.createLtt(validCreateRequest(), "maker01");

        assertEquals(LttStatus.DRAFT, header.getFStatus());
        assertEquals(1, header.getFVer());
        assertEquals("maker01", header.getCreatedBy());
        assertNotNull(header.getCreatedDate());
        verify(auditPublisher).publishAuditEvent(eq("LTT.NEW.SAVE"), any(), eq("maker01"), any(), eq("Draft"), any(), any());
    }

    // UC-001.2 — BIZ-004: Detail sum mismatch
    @Test
    @Tag("UC-001")
    void createLtt_detailSumMismatch_shouldThrow() {
        when(repository.saveHeader(any())).thenAnswer(inv -> inv.getArgument(0));

        LttCreateRequest req = validCreateRequest();
        req.setAmount(new BigDecimal("200000000"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> lttService.createLtt(req, "maker01"));
        assertTrue(ex.getMessage().contains("BIZ-004"));
    }

    // UC-001.3 — Rule 2.3: Duplicate idempotency key
    @Test
    @Tag("UC-001")
    void createLtt_duplicateIdempotencyKey_shouldThrow() {
        LttCreateRequest req = validCreateRequest();
        req.setIdempotencyKey("IDEM-KEY-001");
        when(repository.findHeaderByIdempotencyKey("IDEM-KEY-001"))
                .thenReturn(Optional.of(LttHeader.builder().fId(99L).build()));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> lttService.createLtt(req, "maker01"));
        assertTrue(ex.getMessage().contains("Duplicate request"));
    }

    // UC-001.4 — VAL-01: Null user ID
    @Test
    @Tag("UC-001")
    void createLtt_nullUserId_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.createLtt(validCreateRequest(), null));
        assertThrows(IllegalArgumentException.class,
                () -> lttService.createLtt(validCreateRequest(), ""));
        assertThrows(IllegalArgumentException.class,
                () -> lttService.createLtt(validCreateRequest(), "   "));
    }

    // ========================================================================
    // UC-002: Sua LTT
    // ========================================================================

    // UC-002.1 — BIZ-002, VAL-15: Correct version update
    @Test
    @Tag("UC-002")
    void updateLtt_correctVersion_shouldSucceed() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(draft));
        when(repository.saveHeader(any())).thenAnswer(inv -> inv.getArgument(0));

        LttUpdateRequest req = LttUpdateRequest.builder()
                .fVer(1)
                .amount(new BigDecimal("200000000"))
                .details(List.of(LttCreateRequest.LttDetailLine.builder()
                        .glSegment2("1120")
                        .glSegment3("1010101")
                        .description("Updated line")
                        .amount(new BigDecimal("200000000"))
                        .build()))
                .build();

        LttHeader updated = lttService.updateLtt(1L, req, "maker01");

        assertEquals(new BigDecimal("200000000"), updated.getAmount());
        assertEquals("maker01", updated.getUpdatedBy());
        verify(auditPublisher).publishAuditEvent(eq("LTT.EDIT.SAVE"), any(), eq("maker01"), any(), any(), any(), any());
    }

    // UC-002.2 — VAL-15: Optimistic lock conflict
    @Test
    @Tag("UC-002")
    void updateLtt_wrongVersion_shouldThrow() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(draft));

        assertThrows(IllegalStateException.class,
                () -> lttService.updateLtt(1L, LttUpdateRequest.builder().fVer(99).build(), "maker01"));
    }

    // UC-002.3 — VAL-13: Wrong status
    @Test
    @Tag("UC-002")
    void updateLtt_wrongStatus_shouldThrow() {
        LttHeader submitted = createSubmittedLtt("maker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(submitted));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> lttService.updateLtt(1L, LttUpdateRequest.builder().fVer(1).build(), "maker01"));
        assertTrue(ex.getMessage().contains("Cannot update"));
    }

    // UC-002.4 — VAL-14: Wrong maker
    @Test
    @Tag("UC-002")
    void updateLtt_wrongMaker_shouldThrow() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(draft));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> lttService.updateLtt(1L, LttUpdateRequest.builder().fVer(1).build(), "maker02"));
        assertTrue(ex.getMessage().contains("Only the original Maker"));
    }

    // ========================================================================
    // UC-003: Xoa LTT
    // ========================================================================

    // UC-003.1 — BIZ-003: Soft-delete success
    @Test
    @Tag("UC-003")
    void deleteLtt_shouldSoftDelete() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(draft));

        lttService.deleteLtt(1L, LttDeleteRequest.builder()
                .fVer(1)
                .deleteReason("Xoa do lap sai thong tin nguoi nhan")
                .build(), "maker01");

        verify(repository).saveHeader(argThat(ltt ->
                ltt.getFStatus() == LttStatus.DELETED
                        && "maker01".equals(ltt.getDeletedBy())
        ));
        verify(auditPublisher).publishAuditEvent(eq("LTT.DELETE.CONFIRM"), any(), eq("maker01"), any(), eq("Deleted"), any(), any());
    }

    // UC-003.2 — VAL-16: Delete reason too short
    @Test
    @Tag("UC-003")
    void deleteLtt_reasonTooShort_shouldThrow() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> lttService.deleteLtt(1L, LttDeleteRequest.builder()
                        .fVer(1).deleteReason("Ngan").build(), "maker01"));
        assertTrue(ex.getMessage().contains("at least 10 characters"));
    }

    // UC-003.3 — VAL-16: Delete reason too long
    @Test
    @Tag("UC-003")
    void deleteLtt_reasonTooLong_shouldThrow() {
        String longReason = "A".repeat(501);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> lttService.deleteLtt(1L, LttDeleteRequest.builder()
                        .fVer(1).deleteReason(longReason).build(), "maker01"));
        assertTrue(ex.getMessage().contains("500 characters"));
    }

    // UC-003.4 — VAL-14: Wrong maker
    @Test
    @Tag("UC-003")
    void deleteLtt_wrongMaker_shouldThrow() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(draft));

        assertThrows(IllegalStateException.class,
                () -> lttService.deleteLtt(1L, LttDeleteRequest.builder()
                        .fVer(1).deleteReason("Ly do xoa hop le nhan").build(), "maker02"));
    }

    // UC-003.5 — VAL-13: Wrong status for delete
    @Test
    @Tag("UC-003")
    void deleteLtt_wrongStatus_shouldThrow() {
        LttHeader approved = LttHeader.builder().fId(1L).fStatus(LttStatus.APPROVED)
                .fVer(1).createdBy("maker01").build();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(approved));

        assertThrows(IllegalStateException.class,
                () -> lttService.deleteLtt(1L, LttDeleteRequest.builder()
                        .fVer(1).deleteReason("Ly do xoa hop le nhan").build(), "maker01"));
    }

    // ========================================================================
    // UC-004: Submit LTT
    // ========================================================================

    // UC-004.1 — BIZ-009: Submit from DRAFT
    @Test
    @Tag("UC-004")
    void submitLtt_fromDraft_shouldTransition() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(draft));
        when(repository.findDetailsByLttId(1L)).thenReturn(detailEntities150M());

        lttService.submitLtt(1L, "maker01");

        verify(repository).saveHeader(argThat(ltt ->
                ltt.getFStatus() == LttStatus.READY_FOR_APPROVAL
        ));
        verify(auditPublisher).publishAuditEvent(eq("LTT.NEW.SUBMIT"), any(), eq("maker01"), any(), eq("Ready_For_Approval"), any(), any());
    }

    // UC-004.2 — VAL-13: Submit from RETURNED_TO_MAKER
    @Test
    @Tag("UC-004")
    void submitLtt_fromReturned_shouldTransition() {
        LttHeader returned = LttHeader.builder().fId(1L).fStatus(LttStatus.RETURNED_TO_MAKER)
                .fVer(2).createdBy("maker01").amount(new BigDecimal("150000000")).build();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(returned));
        when(repository.findDetailsByLttId(1L)).thenReturn(detailEntities150M());

        lttService.submitLtt(1L, "maker01");

        verify(repository).saveHeader(argThat(ltt ->
                ltt.getFStatus() == LttStatus.READY_FOR_APPROVAL
        ));
    }

    // UC-004.3 — VAL-14: Wrong maker
    @Test
    @Tag("UC-004")
    void submitLtt_wrongMaker_shouldThrow() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(draft));

        assertThrows(IllegalStateException.class,
                () -> lttService.submitLtt(1L, "maker02"));
    }

    // UC-004.4 — BIZ-004: No detail lines
    @Test
    @Tag("UC-004")
    void submitLtt_noDetails_shouldThrow() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(draft));
        when(repository.findDetailsByLttId(1L)).thenReturn(List.of());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> lttService.submitLtt(1L, "maker01"));
        assertTrue(ex.getMessage().contains("BIZ-004"));
    }

    // UC-004.5 — VAL-13: Wrong status
    @Test
    @Tag("UC-004")
    void submitLtt_wrongStatus_shouldThrow() {
        LttHeader pending = LttHeader.builder().fId(1L).fStatus(LttStatus.PENDING_APPROVER)
                .fVer(2).createdBy("maker01").build();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(pending));

        assertThrows(IllegalStateException.class,
                () -> lttService.submitLtt(1L, "maker01"));
    }

    // ========================================================================
    // UC-005: Checker kiem soat
    // ========================================================================

    // UC-005.1 — BIZ-001: Checker approve
    @Test
    @Tag("UC-005")
    void checkLtt_approve_shouldTransition() {
        LttHeader submitted = createSubmittedLtt("maker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(submitted));

        lttService.checkLtt(1L, LttApprovalRequest.builder()
                .action(LttApprovalRequest.ApprovalAction.APPROVE).build(), "checker01");

        verify(repository).saveHeader(argThat(ltt ->
                ltt.getFStatus() == LttStatus.PENDING_APPROVER
                        && "checker01".equals(ltt.getCheckedBy())
                        && ltt.getCheckedDate() != null
        ));
    }

    // UC-005.2 — BIZ-006: Checker return
    @Test
    @Tag("UC-005")
    void checkLtt_return_shouldTransition() {
        LttHeader submitted = createSubmittedLtt("maker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(submitted));

        lttService.checkLtt(1L, LttApprovalRequest.builder()
                .action(LttApprovalRequest.ApprovalAction.RETURN)
                .note("Thieu chung tu ho so, vui long bo sung day du")
                .build(), "checker01");

        verify(repository).saveHeader(argThat(ltt ->
                ltt.getFStatus() == LttStatus.RETURNED_TO_MAKER
        ));
    }

    // UC-005.3 — BIZ-006: Checker reject
    @Test
    @Tag("UC-005")
    void checkLtt_reject_shouldTransition() {
        LttHeader submitted = createSubmittedLtt("maker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(submitted));

        lttService.checkLtt(1L, LttApprovalRequest.builder()
                .action(LttApprovalRequest.ApprovalAction.REJECT)
                .note("Thong tin nguoi nhan khong dung, tu choi giao dich nay")
                .build(), "checker01");

        verify(repository).saveHeader(argThat(ltt ->
                ltt.getFStatus() == LttStatus.REJECTED
        ));
    }

    // UC-005.4 — BIZ-001: SoD violation
    @Test
    @Tag("UC-005")
    void checkLtt_sameUserAsMaker_shouldThrowSoD() {
        LttHeader submitted = createSubmittedLtt("maker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(submitted));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> lttService.checkLtt(1L, LttApprovalRequest.builder()
                        .action(LttApprovalRequest.ApprovalAction.APPROVE).build(), "maker01"));
        assertTrue(ex.getMessage().contains("SoD"));
    }

    // UC-005.5 — BIZ-006: Note too short on return
    @Test
    @Tag("UC-005")
    void checkLtt_returnNoteTooShort_shouldThrow() {
        LttHeader submitted = createSubmittedLtt("maker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(submitted));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> lttService.checkLtt(1L, LttApprovalRequest.builder()
                        .action(LttApprovalRequest.ApprovalAction.RETURN)
                        .note("Ngan").build(), "checker01"));
        assertTrue(ex.getMessage().contains("BIZ-006"));
    }

    // UC-005.6 — VAL-13: Wrong status for check
    @Test
    @Tag("UC-005")
    void checkLtt_wrongStatus_shouldThrow() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(draft));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> lttService.checkLtt(1L, LttApprovalRequest.builder()
                        .action(LttApprovalRequest.ApprovalAction.APPROVE).build(), "checker01"));
        assertTrue(ex.getMessage().contains("READY_FOR_APPROVAL"));
    }

    // ========================================================================
    // UC-006: Approver phe duyet
    // ========================================================================

    // UC-006.1 — BIZ-001, BIZ-010: Approver approve
    @Test
    @Tag("UC-006")
    void approveLtt_approve_shouldTransition() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(pending));

        lttService.approveLtt(1L, LttApprovalRequest.builder()
                .action(LttApprovalRequest.ApprovalAction.APPROVE)
                .note("OTP confirmed").build(), "approver01");

        verify(repository).saveHeader(argThat(ltt ->
                ltt.getFStatus() == LttStatus.APPROVED
                        && "approver01".equals(ltt.getApprovedBy())
                        && ltt.getApprovedDate() != null
        ));
    }

    // UC-006.2 — BIZ-006: Approver return
    @Test
    @Tag("UC-006")
    void approveLtt_return_shouldTransition() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(pending));

        lttService.approveLtt(1L, LttApprovalRequest.builder()
                .action(LttApprovalRequest.ApprovalAction.RETURN)
                .note("So tien vuot han muc cho phep, can dieu chinh lai")
                .build(), "approver01");

        verify(repository).saveHeader(argThat(ltt ->
                ltt.getFStatus() == LttStatus.RETURNED_TO_MAKER
        ));
    }

    // UC-006.3 — BIZ-006: Approver reject
    @Test
    @Tag("UC-006")
    void approveLtt_reject_shouldTransition() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(pending));

        lttService.approveLtt(1L, LttApprovalRequest.builder()
                .action(LttApprovalRequest.ApprovalAction.REJECT)
                .note("Giao dich khong hop le theo quy dinh ngan hang")
                .build(), "approver01");

        verify(repository).saveHeader(argThat(ltt ->
                ltt.getFStatus() == LttStatus.REJECTED
        ));
    }

    // UC-006.4 — BIZ-001: Approver same as Maker
    @Test
    @Tag("UC-006")
    void approveLtt_sameUserAsMaker_shouldThrowSoD() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(pending));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> lttService.approveLtt(1L, LttApprovalRequest.builder()
                        .action(LttApprovalRequest.ApprovalAction.APPROVE)
                        .note("OTP").build(), "maker01"));
        assertTrue(ex.getMessage().contains("SoD") && ex.getMessage().contains("Maker"));
    }

    // UC-006.5 — BIZ-001: Approver same as Checker
    @Test
    @Tag("UC-006")
    void approveLtt_sameUserAsChecker_shouldThrowSoD() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(pending));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> lttService.approveLtt(1L, LttApprovalRequest.builder()
                        .action(LttApprovalRequest.ApprovalAction.APPROVE)
                        .note("OTP").build(), "checker01"));
        assertTrue(ex.getMessage().contains("SoD") && ex.getMessage().contains("Checker"));
    }

    // UC-006.6 — BIZ-006: Note too short on reject
    @Test
    @Tag("UC-006")
    void approveLtt_returnNoteTooShort_shouldThrow() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(pending));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> lttService.approveLtt(1L, LttApprovalRequest.builder()
                        .action(LttApprovalRequest.ApprovalAction.REJECT)
                        .note("Loi").build(), "approver01"));
        assertTrue(ex.getMessage().contains("BIZ-006"));
    }

    // UC-006.7 — VAL-13: Wrong status for approve
    @Test
    @Tag("UC-006")
    void approveLtt_wrongStatus_shouldThrow() {
        LttHeader submitted = createSubmittedLtt("maker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(submitted));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> lttService.approveLtt(1L, LttApprovalRequest.builder()
                        .action(LttApprovalRequest.ApprovalAction.APPROVE).build(), "approver01"));
        assertTrue(ex.getMessage().contains("PENDING_APPROVER"));
    }

    // ========================================================================
    // UC-007: Copy LTT
    // ========================================================================

    // UC-007.1 — Copy creates new DRAFT
    @Test
    @Tag("UC-007")
    void copyLtt_shouldCreateNewDraft() {
        LttHeader approved = createApprovedLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(approved));
        when(repository.findDetailsByLttId(1L)).thenReturn(detailEntities150M());
        when(repository.findSenderByLttId(1L)).thenReturn(Optional.empty());
        when(repository.findReceiverByLttId(1L)).thenReturn(Optional.empty());
        when(repository.saveHeader(any())).thenAnswer(inv -> inv.getArgument(0));

        LttHeader copy = lttService.copyLtt(1L, "maker01");

        assertEquals(LttStatus.DRAFT, copy.getFStatus());
        assertEquals(1, copy.getFVer());
        assertEquals("maker01", copy.getCreatedBy());
        assertEquals(approved.getAmount(), copy.getAmount());
        assertEquals(approved.getChannel(), copy.getChannel());
        assertNotNull(copy.getCreatedDate());
        verify(auditPublisher).publishAuditEvent(eq("LTT.NEW.COPY"), any(), eq("maker01"), any(), eq("Draft"), any(), any());
    }

    // ========================================================================
    // UC-008: Full lifecycle integration tests
    // ========================================================================

    // UC-008.1 — Full cycle: Create -> Submit -> Check -> Approve
    @Test
    @Tag("UC-008")
    void fullCycle_createSubmitCheckApprove() {
        // Step 1: Create
        when(repository.saveHeader(any())).thenAnswer(inv -> {
            LttHeader h = inv.getArgument(0);
            if (h.getFId() == null) h.setFId(1L);
            return h;
        });

        LttHeader created = lttService.createLtt(validCreateRequest(), "maker01");
        assertEquals(LttStatus.DRAFT, created.getFStatus());

        // Step 2: Submit
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(created));
        when(repository.findDetailsByLttId(1L)).thenReturn(detailEntities150M());
        lttService.submitLtt(1L, "maker01");
        created.setFStatus(LttStatus.READY_FOR_APPROVAL);

        // Step 3: Checker approve
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(created));
        lttService.checkLtt(1L, LttApprovalRequest.builder()
                .action(LttApprovalRequest.ApprovalAction.APPROVE).build(), "checker01");
        created.setFStatus(LttStatus.PENDING_APPROVER);
        created.setCheckedBy("checker01");

        // Step 4: Approver approve
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(created));
        lttService.approveLtt(1L, LttApprovalRequest.builder()
                .action(LttApprovalRequest.ApprovalAction.APPROVE)
                .note("OTP confirmed").build(), "approver01");

        verify(repository, atLeast(4)).saveHeader(any());
        verify(auditPublisher, atLeast(4)).publishAuditEvent(any(), any(), any(), any(), any(), any(), any());
    }

    // UC-008.2 — Full cycle with return and resubmit
    @Test
    @Tag("UC-008")
    void fullCycle_returnAndResubmit() {
        when(repository.saveHeader(any())).thenAnswer(inv -> {
            LttHeader h = inv.getArgument(0);
            if (h.getFId() == null) h.setFId(1L);
            return h;
        });

        // Create + Submit
        LttHeader created = lttService.createLtt(validCreateRequest(), "maker01");
        created.setFId(1L);
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(created));
        when(repository.findDetailsByLttId(1L)).thenReturn(detailEntities150M());
        lttService.submitLtt(1L, "maker01");
        created.setFStatus(LttStatus.READY_FOR_APPROVAL);

        // Checker return
        lttService.checkLtt(1L, LttApprovalRequest.builder()
                .action(LttApprovalRequest.ApprovalAction.RETURN)
                .note("Thieu ho so, can bo sung them tai lieu")
                .build(), "checker01");
        created.setFStatus(LttStatus.RETURNED_TO_MAKER);
        created.setCheckedBy("checker01");

        // Resubmit
        lttService.submitLtt(1L, "maker01");
        created.setFStatus(LttStatus.READY_FOR_APPROVAL);

        // Checker approve
        lttService.checkLtt(1L, LttApprovalRequest.builder()
                .action(LttApprovalRequest.ApprovalAction.APPROVE).build(), "checker01");
        created.setFStatus(LttStatus.PENDING_APPROVER);

        // Approver approve
        lttService.approveLtt(1L, LttApprovalRequest.builder()
                .action(LttApprovalRequest.ApprovalAction.APPROVE)
                .note("OTP confirmed").build(), "approver01");

        verify(repository, atLeast(6)).saveHeader(any());
    }

    // ========================================================================
    // Additional coverage: listLtt, getLttDetail, copy with details, update paths
    // ========================================================================

    @Test
    void listLtt_withNullFilter_shouldUseEmptyFilter() {
        when(repository.searchHeaders(any(), any())).thenReturn(org.springframework.data.domain.Page.empty());

        var result = lttService.listLtt(null, org.springframework.data.domain.Pageable.ofSize(20));
        assertNotNull(result);
        verify(repository).searchHeaders(any(LttFilterRequest.class), any());
    }

    @Test
    void listLtt_withNullPageable_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.listLtt(new LttFilterRequest(), null));
    }

    @Test
    void getLttDetail_happyPath_shouldReturnComposite() {
        LttHeader header = createDraftLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(header));
        when(repository.findDetailsByLttId(1L)).thenReturn(detailEntities150M());
        when(repository.findSenderByLttId(1L)).thenReturn(Optional.of(LttSender.builder()
                .lttId(1L).senderName("KB Ha Noi").build()));
        when(repository.findReceiverByLttId(1L)).thenReturn(Optional.of(LttReceiver.builder()
                .lttId(1L).receiverName("KB TP HCM").build()));

        LttDetailResponse response = lttService.getLttDetail(1L);
        assertEquals(header, response.getHeader());
        assertEquals(1, response.getDetails().size());
        assertNotNull(response.getSender());
        assertNotNull(response.getReceiver());
    }

    @Test
    void getLttDetail_nullId_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.getLttDetail(null));
    }

    @Test
    void copyLtt_withSenderAndReceiver_shouldCopyAll() {
        LttHeader approved = createApprovedLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(approved));
        when(repository.findDetailsByLttId(1L)).thenReturn(detailEntities150M());
        when(repository.findSenderByLttId(1L)).thenReturn(Optional.of(LttSender.builder()
                .lttId(1L).senderName("KB Ha Noi").senderAddress("Addr")
                .senderGlSegment2("1120").senderBankCode("KBHN001").build()));
        when(repository.findReceiverByLttId(1L)).thenReturn(Optional.of(LttReceiver.builder()
                .lttId(1L).receiverName("KB HCM").receiverGlSegment2("1121")
                .receiverBankCode("KBHCM001").build()));
        when(repository.saveHeader(any())).thenAnswer(inv -> inv.getArgument(0));

        LttHeader copy = lttService.copyLtt(1L, "maker02");

        assertEquals(LttStatus.DRAFT, copy.getFStatus());
        assertEquals("maker02", copy.getCreatedBy());
        verify(repository).saveAllDetails(any());
        verify(repository).saveSender(any());
        verify(repository).saveReceiver(any());
    }

    @Test
    void updateLtt_withSenderAndReceiver_existing_shouldUpdate() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(draft));
        when(repository.findSenderByLttId(1L)).thenReturn(Optional.of(
                LttSender.builder().lttId(1L).senderName("Old Name").build()));
        when(repository.findReceiverByLttId(1L)).thenReturn(Optional.of(
                LttReceiver.builder().lttId(1L).receiverName("Old Name").build()));
        when(repository.saveHeader(any())).thenAnswer(inv -> inv.getArgument(0));

        lttService.updateLtt(1L, LttUpdateRequest.builder()
                .fVer(1)
                .description("Updated desc")
                .sender(LttCreateRequest.LttSenderInfo.builder()
                        .senderName("New Sender").senderAddress("New Addr")
                        .senderGlSegment2("1120").senderBankCode("KBHN001")
                        .senderIdentifyId("123456").build())
                .receiver(LttCreateRequest.LttReceiverInfo.builder()
                        .receiverName("New Receiver").receiverBankCode("KBHCM001")
                        .receiverBankName("KB HCM").receiverGlSegment2("1121")
                        .receiverIdentifyId("654321").build())
                .build(), "maker01");

        verify(repository).saveHeader(argThat(h -> "Updated desc".equals(h.getDescription())));
    }

    @Test
    void updateLtt_withSenderAndReceiver_new_shouldCreate() {
        LttHeader draft = createDraftLtt();
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(draft));
        when(repository.findSenderByLttId(1L)).thenReturn(Optional.empty());
        when(repository.findReceiverByLttId(1L)).thenReturn(Optional.empty());
        when(repository.saveHeader(any())).thenAnswer(inv -> inv.getArgument(0));

        lttService.updateLtt(1L, LttUpdateRequest.builder()
                .fVer(1)
                .sender(senderInfo())
                .receiver(receiverInfo())
                .build(), "maker01");

        verify(repository).saveSender(any());
        verify(repository).saveReceiver(any());
    }

    @Test
    void createLtt_withoutDetails_shouldSaveHeaderOnly() {
        when(repository.saveHeader(any())).thenAnswer(inv -> inv.getArgument(0));

        LttCreateRequest req = validCreateRequest();
        req.setDetails(null);
        LttHeader header = lttService.createLtt(req, "maker01");

        assertEquals(LttStatus.DRAFT, header.getFStatus());
        verify(repository, never()).saveAllDetails(any());
    }

    @Test
    void createLtt_withoutSenderAndReceiver_shouldSkip() {
        when(repository.saveHeader(any())).thenAnswer(inv -> inv.getArgument(0));

        LttCreateRequest req = validCreateRequest();
        req.setSender(null);
        req.setReceiver(null);
        LttHeader header = lttService.createLtt(req, "maker01");

        assertEquals(LttStatus.DRAFT, header.getFStatus());
        verify(repository, never()).saveSender(any());
        verify(repository, never()).saveReceiver(any());
    }

    @Test
    void checkLtt_noteTooLong_shouldThrow() {
        LttHeader submitted = createSubmittedLtt("maker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(submitted));

        String longNote = "A".repeat(501);
        assertThrows(IllegalArgumentException.class,
                () -> lttService.checkLtt(1L, LttApprovalRequest.builder()
                        .action(LttApprovalRequest.ApprovalAction.RETURN)
                        .note(longNote).build(), "checker01"));
    }

    @Test
    void approveLtt_noteTooLong_shouldThrow() {
        LttHeader pending = createPendingLtt("maker01", "checker01");
        when(repository.findHeaderById(1L)).thenReturn(Optional.of(pending));

        String longNote = "A".repeat(501);
        assertThrows(IllegalArgumentException.class,
                () -> lttService.approveLtt(1L, LttApprovalRequest.builder()
                        .action(LttApprovalRequest.ApprovalAction.REJECT)
                        .note(longNote).build(), "approver01"));
    }

    @Test
    void deleteLtt_nullId_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.deleteLtt(null, LttDeleteRequest.builder()
                        .fVer(1).deleteReason("Ly do xoa hop le").build(), "maker01"));
    }

    @Test
    void submitLtt_nullId_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.submitLtt(null, "maker01"));
    }

    @Test
    void copyLtt_nullId_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.copyLtt(null, "maker01"));
    }

    @Test
    void approveLtt_nullId_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.approveLtt(null, LttApprovalRequest.builder()
                        .action(LttApprovalRequest.ApprovalAction.APPROVE).build(), "approver01"));
    }

    @Test
    void checkLtt_nullId_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.checkLtt(null, LttApprovalRequest.builder()
                        .action(LttApprovalRequest.ApprovalAction.APPROVE).build(), "checker01"));
    }

    // ========================================================================
    // Edge cases
    // ========================================================================

    @Test
    void createLtt_nullRequest_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.createLtt(null, "maker01"));
    }

    @Test
    void updateLtt_nullRequest_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.updateLtt(1L, null, "maker01"));
    }

    @Test
    void deleteLtt_nullRequest_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.deleteLtt(1L, null, "maker01"));
    }

    @Test
    void checkLtt_nullRequest_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.checkLtt(1L, null, "checker01"));
    }

    @Test
    void approveLtt_nullRequest_shouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> lttService.approveLtt(1L, null, "approver01"));
    }

    @Test
    void getLttDetail_notFound_shouldThrow() {
        when(repository.findHeaderById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> lttService.getLttDetail(999L));
    }

    @Test
    void copyLtt_notFound_shouldThrow() {
        when(repository.findHeaderById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> lttService.copyLtt(999L, "maker01"));
    }

    // ========================================================================
    // Helper methods
    // ========================================================================

    private LttCreateRequest validCreateRequest() {
        return LttCreateRequest.builder()
                .channel(LttChannel.TTSP)
                .transactionType("LENH_CHUYEN_KHOAN")
                .senderCode("KBHN001")
                .receiverCode("KBHCM001")
                .refNo("YCTT-2026-00001")
                .paymentDate(LocalDate.now())
                .amount(new BigDecimal("150000000"))
                .currencyCode("VND")
                .description("Thanh toan hop dong")
                .details(details150M())
                .sender(senderInfo())
                .receiver(receiverInfo())
                .build();
    }

    private List<LttCreateRequest.LttDetailLine> details150M() {
        return List.of(LttCreateRequest.LttDetailLine.builder()
                .glSegment2("1120")
                .glSegment3("1010101")
                .glSegment5("040")
                .glSegment6("260")
                .description("Mua sam trang thiet bi")
                .amount(new BigDecimal("150000000"))
                .build());
    }

    private LttCreateRequest.LttSenderInfo senderInfo() {
        return LttCreateRequest.LttSenderInfo.builder()
                .senderName("KB Ha Noi")
                .senderAddress("So 1, Pham Van Dong")
                .senderGlSegment2("1120")
                .senderBankCode("KBHN001")
                .build();
    }

    private LttCreateRequest.LttReceiverInfo receiverInfo() {
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
                .amount(new BigDecimal("150000000"))
                .build());
    }

    private LttHeader createDraftLtt() {
        return LttHeader.builder()
                .fId(1L).fStatus(LttStatus.DRAFT).fVer(1)
                .createdBy("maker01")
                .channel(LttChannel.TTSP)
                .amount(new BigDecimal("150000000"))
                .build();
    }

    private LttHeader createSubmittedLtt(String maker) {
        return LttHeader.builder()
                .fId(1L).fStatus(LttStatus.READY_FOR_APPROVAL).fVer(1)
                .createdBy(maker)
                .build();
    }

    private LttHeader createPendingLtt(String maker, String checker) {
        return LttHeader.builder()
                .fId(1L).fStatus(LttStatus.PENDING_APPROVER).fVer(1)
                .createdBy(maker).checkedBy(checker)
                .build();
    }

    private LttHeader createApprovedLtt() {
        return LttHeader.builder()
                .fId(1L).fStatus(LttStatus.APPROVED).fVer(2)
                .createdBy("maker01").checkedBy("checker01").approvedBy("approver01")
                .channel(LttChannel.TTSP)
                .amount(new BigDecimal("150000000"))
                .build();
    }
}
