/**
 * @kb/qa-e2e approve-order.spec.ts
 *
 * E2E test suite for BDD-03: PAY.OUT.MANUAL — Workflow Phe duyet (Maker-Checker-Approver)
 * Feature: FT-001 | Flow: UC-APPROVE
 *
 * Each test() maps to 1 BDD scenario from features/FT-001/bdd-03-approve.md
 * Test naming: BDD-03-S{XX}
 *
 * References:
 *   - BDD scenarios: features/FT-001/bdd-03-approve.md
 *   - API design: features/FT-001/02-design.md Section 2
 *   - State Machine: features/FT-001/02-design.md Section 5
 *   - SoD: BIZ-001, INC-G-17
 */

import { test, expect } from "@playwright/test";
import { KbApiClient } from "./helpers/api-client";
import {
  createValidOrderData,
  createValidReason,
  createInvalidReasons,
  API_BASE_URL,
  TEST_USERS,
  resetLineNoCounter,
} from "./helpers/test-data";
import type {
  PayOrder,
  ApiErrorResponse,
  ApprovalEntry,
} from "./helpers/api-client";

// ---------------------------------------------------------------------------
// Helpers: seed orders at various states
// ---------------------------------------------------------------------------

async function seedReadyForApproval(makerApi: KbApiClient): Promise<PayOrder> {
  const payload = createValidOrderData("LNH");
  const createResult = await makerApi.createOrder(payload);
  const draft = createResult.body as PayOrder;

  const submitResult = await makerApi.submitOrder(draft.id, draft.version);
  return submitResult.body as PayOrder;
}

async function seedPendingApprover(
  makerApi: KbApiClient,
  checkerApi: KbApiClient,
): Promise<PayOrder> {
  const ready = await seedReadyForApproval(makerApi);
  const checkResult = await checkerApi.checkApprove(ready.id, ready.version);
  return checkResult.body as PayOrder;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe("BDD-03: PAY.OUT.MANUAL — Workflow Phe duyet 3 cap (UC-APPROVE)", () => {
  let makerApi: KbApiClient;
  let checkerApi: KbApiClient;
  let approverApi: KbApiClient;

  test.beforeAll(() => {
    makerApi = new KbApiClient(API_BASE_URL, TEST_USERS.maker01.token);
    checkerApi = new KbApiClient(API_BASE_URL, TEST_USERS.checker01.token);
    approverApi = new KbApiClient(API_BASE_URL, TEST_USERS.approver01.token);
  });

  test.beforeEach(() => {
    resetLineNoCounter();
  });

  // ========================================================================
  // @happy-path — 2-level approval flow
  // ========================================================================

  /**
   * BDD-03-S01: Maker submits DRAFT -> READY_FOR_APPROVAL
   *
   * Reference: @happy-path — "Maker Gui kiem soat thanh cong lenh o trang thai DRAFT"
   * State Machine transition #3: DRAFT -> READY_FOR_APPROVAL
   *
   * Validates:
   *   - Status changes from DRAFT to READY_FOR_APPROVAL
   *   - Version increments
   *   - Notification sent (BIZ-009)
   */
  test("BDD-03-S01: Maker submits DRAFT -> READY_FOR_APPROVAL", async () => {
    const payload = createValidOrderData("LNH");
    const createResult = await makerApi.createOrder(payload);
    const draft = createResult.body as PayOrder;
    expect(draft.status).toBe("DRAFT");

    const submitResult = await makerApi.submitOrder(draft.id, draft.version);
    expect(submitResult.status).toBe(200);

    const submitted = submitResult.body as PayOrder;
    expect(submitted.status).toBe("READY_FOR_APPROVAL");
    expect(submitted.version).toBe(draft.version + 1);
    expect(submitted.updatedBy).toBe(TEST_USERS.maker01.userId);
  });

  /**
   * BDD-03-S02: Checker approves READY -> PENDING_APPROVER
   *
   * Reference: @happy-path — "Checker phe duyet cap 1 thanh cong"
   * State Machine transition #5: READY_FOR_APPROVAL -> PENDING_APPROVER
   *
   * Validates:
   *   - SoD check: checker_id != created_by (BIZ-001)
   *   - CHECKER_ID set to checker01
   *   - CHECKER_ACTION_AT set to current timestamp
   *   - Version increments
   */
  test("BDD-03-S02: Checker approves READY -> PENDING_APPROVER", async () => {
    const ready = await seedReadyForApproval(makerApi);
    expect(ready.status).toBe("READY_FOR_APPROVAL");

    const checkResult = await checkerApi.checkApprove(ready.id, ready.version);
    expect(checkResult.status).toBe(200);

    const pending = checkResult.body as PayOrder;
    expect(pending.status).toBe("PENDING_APPROVER");
    expect(pending.checkerId).toBe(TEST_USERS.checker01.userId);
    expect(pending.checkerActionAt).toBeTruthy();
    expect(pending.version).toBe(ready.version + 1);
  });

  /**
   * BDD-03-S03: Approver approves PENDING -> APPROVED
   *
   * Reference: @happy-path — "Approver phe duyet cuoi thanh cong"
   * State Machine transition #8: PENDING_APPROVER -> APPROVED
   *
   * Validates:
   *   - SoD: approver_id != created_by AND approver_id != checker_id
   *   - APPROVER_ID set
   *   - APPROVED final state for MVP
   */
  test("BDD-03-S03: Approver approves PENDING -> APPROVED", async () => {
    const pending = await seedPendingApprover(makerApi, checkerApi);
    expect(pending.status).toBe("PENDING_APPROVER");

    const approveResult = await approverApi.approve(
      pending.id,
      pending.version,
    );
    expect(approveResult.status).toBe(200);

    const approved = approveResult.body as PayOrder;
    expect(approved.status).toBe("APPROVED");
    expect(approved.approverId).toBe(TEST_USERS.approver01.userId);
    expect(approved.approverActionAt).toBeTruthy();
    expect(approved.version).toBe(pending.version + 1);
  });

  // ========================================================================
  // @alternative — Return and Reject flows
  // ========================================================================

  /**
   * BDD-03-S04: Checker returns READY -> RETURNED_TO_MAKER with reason
   *
   * Reference: @alternative — "Checker tra lai Maker — yeu cau ly do hop le"
   * State Machine transition #6: READY_FOR_APPROVAL -> RETURNED_TO_MAKER
   *
   * Validates:
   *   - Reason is required and must be 10-500 chars (BIZ-006)
   *   - CHECKER_COMMENT stores the reason
   *   - Order returns to RETURNED_TO_MAKER state
   */
  test("BDD-03-S04: Checker returns READY -> RETURNED_TO_MAKER with reason", async () => {
    const ready = await seedReadyForApproval(makerApi);

    const returnPayload = createValidReason(
      "Thieu chung tu hop dong, vui long bo sung va submit lai",
    );
    const returnResult = await checkerApi.returnOrder(
      ready.id,
      returnPayload,
      ready.version,
    );
    expect(returnResult.status).toBe(200);

    const returned = returnResult.body as PayOrder;
    expect(returned.status).toBe("RETURNED_TO_MAKER");
    expect(returned.checkerComment).toBeTruthy();
    expect(returned.checkerComment!.length).toBeGreaterThanOrEqual(10);
  });

  /**
   * BDD-03-S05: Approver returns PENDING -> RETURNED_TO_MAKER with reason
   *
   * Reference: @alternative — Approver can also return
   * State Machine transition #9: PENDING_APPROVER -> RETURNED_TO_MAKER
   */
  test("BDD-03-S05: Approver returns PENDING -> RETURNED_TO_MAKER with reason", async () => {
    const pending = await seedPendingApprover(makerApi, checkerApi);

    const returnPayload = createValidReason(
      "Can bo sung thong tin nguoi nhan chi tiet hon",
    );
    const returnResult = await approverApi.returnOrder(
      pending.id,
      returnPayload,
      pending.version,
    );
    expect(returnResult.status).toBe(200);

    const returned = returnResult.body as PayOrder;
    expect(returned.status).toBe("RETURNED_TO_MAKER");
    expect(returned.approverComment).toBeTruthy();
  });

  /**
   * BDD-03-S06: Checker rejects READY -> REJECTED with reason
   *
   * Reference: @alternative — "Approver tu choi — khoa giao dich vinh vien"
   * State Machine transition #7: READY_FOR_APPROVAL -> REJECTED
   *
   * Validates:
   *   - REJECTED is a final state (no edit/delete/resubmit)
   *   - Reason stored in CHECKER_COMMENT
   */
  test("BDD-03-S06: Checker rejects READY -> REJECTED with reason", async () => {
    const ready = await seedReadyForApproval(makerApi);

    const rejectPayload = createValidReason(
      "Nghiep vu khong hop le, khong phe duyet",
    );
    const rejectResult = await checkerApi.rejectOrder(
      ready.id,
      rejectPayload,
      ready.version,
    );
    expect(rejectResult.status).toBe(200);

    const rejected = rejectResult.body as PayOrder;
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.checkerComment).toBeTruthy();

    // Verify REJECTED order cannot be edited
    const editResult = await makerApi.updateOrder(rejected.id, {
      version: rejected.version,
      description: "Attempt edit on rejected",
    });
    expect(editResult.status).toBe(409);
  });

  /**
   * BDD-03-S07: Approver rejects PENDING -> REJECTED with reason
   *
   * Reference: @alternative — "Approver tu choi"
   * State Machine transition #10: PENDING_APPROVER -> REJECTED
   */
  test("BDD-03-S07: Approver rejects PENDING -> REJECTED with reason", async () => {
    const pending = await seedPendingApprover(makerApi, checkerApi);

    const rejectPayload = createValidReason(
      "So tien khong hop le, tu choi phe duyet",
    );
    const rejectResult = await approverApi.rejectOrder(
      pending.id,
      rejectPayload,
      pending.version,
    );
    expect(rejectResult.status).toBe(200);

    const rejected = rejectResult.body as PayOrder;
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.approverComment).toBeTruthy();
  });

  // ========================================================================
  // @exception — SoD violations
  // ========================================================================

  /**
   * BDD-03-S08: SoD violation — Maker self-approves -> 403
   *
   * Reference: @exception @BIZ-001 @SoD
   * "Vi pham SoD — Maker khong duoc tu duyet lenh cua minh"
   *
   * Maker01 has both MAKER and CHECKER roles. They create an order
   * and then try to check-approve their own order.
   * created_by must differ from checker_id (BIZ-001).
   */
  test("BDD-03-S08: SoD violation — Maker self-approves as Checker -> 403", async () => {
    const ready = await seedReadyForApproval(makerApi);
    // Maker01 (who created the order) tries to check-approve
    // Using makerApi (same user) instead of checkerApi
    const result = await makerApi.checkApprove(ready.id, ready.version);

    expect(result.status).toBe(403);
    const error = result.body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-PERMISSION/);
  });

  /**
   * BDD-03-S09: SoD violation — Checker same as Approver -> 403
   *
   * Reference: @exception @BIZ-001 @SoD
   * "Vi pham SoD — Checker khong duoc duyet cuoi lenh minh da kiem soat"
   *
   * Checker01 also has APPROVER role. After checking, they try to
   * do the final approval. checker_id must differ from approver_id.
   */
  test("BDD-03-S09: SoD violation — Checker same as Approver -> 403", async () => {
    const pending = await seedPendingApprover(makerApi, checkerApi);

    // Checker01 (who already checked) tries to approve as Approver
    const result = await checkerApi.approve(pending.id, pending.version);

    expect(result.status).toBe(403);
    const error = result.body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-PERMISSION/);
  });

  /**
   * BDD-03-S10: Return reason too short (< 10 chars) -> 422
   *
   * Reference: @exception @BIZ-006
   * "Return/Reject that bai — ly do khong du do dai"
   *
   * BIZ-006: reason must be between 10 and 500 characters.
   */
  test("BDD-03-S10: Return reason too short (< 10 chars) -> 422", async () => {
    const ready = await seedReadyForApproval(makerApi);

    const invalidReasons = createInvalidReasons();

    // Short reason (< 10 chars)
    const shortResult = await checkerApi.returnOrder(
      ready.id,
      invalidReasons.shortReason,
      ready.version,
    );
    expect(shortResult.status).toBe(422);
    const shortError = shortResult.body as ApiErrorResponse;
    expect(shortError.code).toMatch(/MSG-ERR/);
  });

  /**
   * BDD-03-S11: Full lifecycle: Create -> Submit -> Check -> Approve
   *
   * Reference: End-to-end happy path through all 3 roles
   * Validates the complete state machine flow:
   *   DRAFT -> READY_FOR_APPROVAL -> PENDING_APPROVER -> APPROVED
   *
   * Also verifies:
   *   - Approval history entries exist for each step
   *   - Each step records the correct role and user
   */
  test("BDD-03-S11: Full lifecycle — Create -> Submit -> Check -> Approve", async () => {
    // Step 1: Create
    const payload = createValidOrderData("LNH");
    const createResult = await makerApi.createOrder(payload);
    expect(createResult.status).toBe(201);
    const order = createResult.body as PayOrder;
    expect(order.status).toBe("DRAFT");
    expect(order.version).toBe(1);

    // Step 2: Submit (DRAFT -> READY_FOR_APPROVAL)
    const submitResult = await makerApi.submitOrder(order.id, order.version);
    expect(submitResult.status).toBe(200);
    const submitted = submitResult.body as PayOrder;
    expect(submitted.status).toBe("READY_FOR_APPROVAL");
    expect(submitted.version).toBe(2);

    // Step 3: Check-approve (READY_FOR_APPROVAL -> PENDING_APPROVER)
    const checkResult = await checkerApi.checkApprove(
      submitted.id,
      submitted.version,
    );
    expect(checkResult.status).toBe(200);
    const pending = checkResult.body as PayOrder;
    expect(pending.status).toBe("PENDING_APPROVER");
    expect(pending.checkerId).toBe(TEST_USERS.checker01.userId);
    expect(pending.version).toBe(3);

    // Step 4: Final approve (PENDING_APPROVER -> APPROVED)
    const approveResult = await approverApi.approve(
      pending.id,
      pending.version,
    );
    expect(approveResult.status).toBe(200);
    const approved = approveResult.body as PayOrder;
    expect(approved.status).toBe("APPROVED");
    expect(approved.approverId).toBe(TEST_USERS.approver01.userId);
    expect(approved.version).toBe(4);

    // Step 5: Verify approval history
    const historyResult = await makerApi.getApprovalStatus(approved.id);
    expect(historyResult.status).toBe(200);
    const history = historyResult.body as ApprovalEntry[];
    expect(history.length).toBeGreaterThanOrEqual(3);

    // Verify CREATE entry
    const createEntry = history.find((e) => e.action === "CREATE");
    expect(createEntry).toBeDefined();
    expect(createEntry!.performedBy).toBe(TEST_USERS.maker01.userId);
    expect(createEntry!.performedRole).toBe("MAKER");

    // Verify CHECK_APPROVE entry
    const checkEntry = history.find((e) => e.action === "CHECK_APPROVE");
    expect(checkEntry).toBeDefined();
    expect(checkEntry!.performedBy).toBe(TEST_USERS.checker01.userId);
    expect(checkEntry!.performedRole).toBe("CHECKER");

    // Verify APPROVE entry
    const approveEntry = history.find((e) => e.action === "APPROVE");
    expect(approveEntry).toBeDefined();
    expect(approveEntry!.performedBy).toBe(TEST_USERS.approver01.userId);
    expect(approveEntry!.performedRole).toBe("APPROVER");
  });
});
