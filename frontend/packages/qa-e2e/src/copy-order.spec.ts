/**
 * @kb/qa-e2e copy-order.spec.ts
 *
 * E2E test suite for BDD-07: PAY.OUT.MANUAL — Sao chep lenh thanh toan
 * Feature: FT-001 | Flow: UC-COPY
 *
 * Each test() maps to 1 BDD scenario from features/FT-001/bdd-07-copy.md
 * Test naming: BDD-07-S{XX}
 *
 * References:
 *   - BDD scenarios: features/FT-001/bdd-07-copy.md
 *   - API design: features/FT-001/02-design.md Section 2 (endpoint #10)
 *   - State Machine: features/FT-001/02-design.md Section 5
 */

import { test, expect } from "@playwright/test";
import { KbApiClient } from "./helpers/api-client";
import {
  createValidOrderData,
  createLineData,
  createTestPdfFile,
  generateIdempotencyKey,
  API_BASE_URL,
  TEST_USERS,
  resetLineNoCounter,
} from "./helpers/test-data";
import type {
  PayOrder,
  ApiErrorResponse,
  ApprovalEntry,
  Attachment,
} from "./helpers/api-client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedDraftOrder(makerApi: KbApiClient): Promise<PayOrder> {
  resetLineNoCounter();
  const payload = createValidOrderData("LNH", {
    amount: 1_000_000,
    lines: [
      createLineData({ lineNo: 1, lineAmount: 600_000 }),
      createLineData({ lineNo: 2, lineAmount: 400_000 }),
    ],
  });
  const { body } = await makerApi.createOrder(payload);
  return body as PayOrder;
}

async function seedApprovedOrder(
  makerApi: KbApiClient,
  checkerApi: KbApiClient,
  approverApi: KbApiClient,
): Promise<PayOrder> {
  resetLineNoCounter();
  const payload = createValidOrderData("LNH", {
    amount: 10_000_000,
    lines: [
      createLineData({ lineNo: 1, lineAmount: 6_000_000 }),
      createLineData({ lineNo: 2, lineAmount: 4_000_000 }),
    ],
  });
  const { body: draft } = await makerApi.createOrder(payload);
  const order = draft as PayOrder;

  const { body: submitted } = await makerApi.submitOrder(
    order.id,
    order.version,
  );
  const ready = submitted as PayOrder;

  const { body: checked } = await checkerApi.checkApprove(
    ready.id,
    ready.version,
  );
  const pending = checked as PayOrder;

  const { body: approved } = await approverApi.approve(
    pending.id,
    pending.version,
  );
  return approved as PayOrder;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe("BDD-07: PAY.OUT.MANUAL — Sao chep lenh thanh toan (UC-COPY)", () => {
  let makerApi: KbApiClient;
  let maker02Api: KbApiClient;
  let checkerApi: KbApiClient;
  let approverApi: KbApiClient;
  let viewerApi: KbApiClient;

  test.beforeAll(() => {
    makerApi = new KbApiClient(API_BASE_URL, TEST_USERS.maker01.token);
    maker02Api = new KbApiClient(API_BASE_URL, TEST_USERS.maker02.token);
    checkerApi = new KbApiClient(API_BASE_URL, TEST_USERS.checker01.token);
    approverApi = new KbApiClient(API_BASE_URL, TEST_USERS.approver01.token);
    viewerApi = new KbApiClient(API_BASE_URL, TEST_USERS.viewer01.token);
  });

  test.beforeEach(() => {
    resetLineNoCounter();
  });

  // ========================================================================
  // @happy-path
  // ========================================================================

  /**
   * BDD-07-S01: Maker copies DRAFT -> new DRAFT with new REF_NO
   *
   * Reference: @happy-path @TC-3.07
   * "Maker sao chep lenh thanh cong, du lieu duoc copy dung"
   *
   * Validates:
   *   - New order created with status DRAFT
   *   - New F-ID (different from source)
   *   - New REF_NO auto-generated
   *   - CREATED_BY = current user (maker01)
   *   - Data fields copied from source
   */
  test("BDD-07-S01: Maker copies DRAFT -> new DRAFT with new REF_NO", async () => {
    const source = await seedDraftOrder(makerApi);

    const { status, body } = await makerApi.copyOrder(source.id);
    expect(status).toBe(201);

    const copy = body as PayOrder;
    expect(copy.status).toBe("DRAFT");
    expect(copy.version).toBe(1);
    expect(copy.id).not.toBe(source.id); // New F-ID
    expect(copy.refNo).not.toBe(source.refNo); // New REF_NO
    expect(copy.refNo).toBeTruthy();

    // Data fields should be copied
    expect(copy.channel).toBe(source.channel);
    expect(copy.orderType).toBe(source.orderType);
    expect(copy.amount).toBe(source.amount);
    expect(copy.description).toBe(source.description);
    expect(copy.sender).toBe(source.sender);
    expect(copy.receiver).toBe(source.receiver);

    // CREATED_BY is the current user
    expect(copy.createdBy).toBe(TEST_USERS.maker01.userId);
    expect(copy.createdAt).toBeTruthy();
  });

  /**
   * BDD-07-S02: Maker copies APPROVED -> new DRAFT
   *
   * Reference: @happy-path
   * Copy is allowed from any status. The new order always starts as DRAFT.
   */
  test("BDD-07-S02: Maker copies APPROVED order -> new DRAFT", async () => {
    const approved = await seedApprovedOrder(makerApi, checkerApi, approverApi);
    expect(approved.status).toBe("APPROVED");

    const { status, body } = await makerApi.copyOrder(approved.id);
    expect(status).toBe(201);

    const copy = body as PayOrder;
    expect(copy.status).toBe("DRAFT");
    expect(copy.version).toBe(1);
    expect(copy.channel).toBe(approved.channel);
    expect(copy.amount).toBe(approved.amount);
  });

  /**
   * BDD-07-S03: Copy preserves data except status/version
   *
   * Reference: @happy-path — detailed field mapping
   * Validates that copy preserves business data fields while
   * resetting workflow/audit fields.
   */
  test("BDD-07-S03: Copy preserves data except status/version", async () => {
    const source = await seedDraftOrder(makerApi);

    const { status, body } = await makerApi.copyOrder(source.id);
    expect(status).toBe(201);

    const copy = body as PayOrder;

    // Business data preserved
    expect(copy.channel).toBe(source.channel);
    expect(copy.sender).toBe(source.sender);
    expect(copy.receiver).toBe(source.receiver);
    expect(copy.amount).toBe(source.amount);
    expect(copy.currencyCode).toBe(source.currencyCode);
    expect(copy.description).toBe(source.description);
    expect(copy.senderName).toBe(source.senderName);
    expect(copy.receiverName).toBe(source.receiverName);

    // Workflow fields reset
    expect(copy.checkerId).toBeUndefined();
    expect(copy.approverId).toBeUndefined();
    expect(copy.checkerActionAt).toBeUndefined();
    expect(copy.approverActionAt).toBeUndefined();
    expect(copy.deleteReason).toBeUndefined();
    expect(copy.deletedBy).toBeUndefined();
    expect(copy.deletedAt).toBeUndefined();
  });

  /**
   * BDD-07-S04: Copy generates new F-ID (UUID)
   *
   * Reference: F-ID = UUID (INC-G-01), always new for copied orders
   */
  test("BDD-07-S04: Copy generates new F-ID (UUID)", async () => {
    const source = await seedDraftOrder(makerApi);

    const { status, body } = await makerApi.copyOrder(source.id);
    expect(status).toBe(201);

    const copy = body as PayOrder;

    // New F-ID must be a different UUID
    expect(copy.id).not.toBe(source.id);

    // Both should be valid UUIDs (format check)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(copy.id).toMatch(uuidRegex);
    expect(source.id).toMatch(uuidRegex);
  });

  /**
   * BDD-07-S05: Copy preserves COA lines
   *
   * Reference: @happy-path — "Copy nguyen 2 dong voi LINE_AMOUNT + COA giu nguyen"
   */
  test("BDD-07-S05: Copy preserves COA lines", async () => {
    const source = await seedDraftOrder(makerApi);
    expect(source.lines).toBeDefined();
    expect(source.lines!.length).toBe(2);

    const { status, body } = await makerApi.copyOrder(source.id);
    expect(status).toBe(201);

    const copy = body as PayOrder;
    expect(copy.lines).toBeDefined();
    expect(copy.lines!.length).toBe(source.lines!.length);

    // Verify line amounts are preserved
    const sourceTotal = source.lines!.reduce((sum, l) => sum + l.lineAmount, 0);
    const copyTotal = copy.lines!.reduce((sum, l) => sum + l.lineAmount, 0);
    expect(copyTotal).toBe(sourceTotal);
  });

  /**
   * BDD-07-S06: Copy does NOT copy attachments
   *
   * Reference: @happy-path — "Dinh kem KHONG copy (user phai upload moi)"
   */
  test("BDD-07-S06: Copy does NOT copy attachments", async () => {
    const source = await seedDraftOrder(makerApi);

    // Upload an attachment to the source
    const testFile = createTestPdfFile(1024);
    const uploadResult = await makerApi.uploadAttachment(
      source.id,
      testFile,
      "CHUNG_TU_GOC",
      "Chung tu goc",
    );
    expect(uploadResult.status).toBe(201);

    // Copy the order
    const { status, body } = await makerApi.copyOrder(source.id);
    expect(status).toBe(201);
    const copy = body as PayOrder;

    // Verify the copy has no attachments
    const attachResult = await makerApi.listAttachments(copy.id);
    expect(attachResult.status).toBe(200);
    const attachments = attachResult.body as Attachment[];
    expect(attachments.length).toBe(0);
  });

  /**
   * BDD-07-S07: Copy does NOT copy approval history
   *
   * Reference: @happy-path — CHECKER and APPROVER fields are reset
   * Approval history tab should be empty for the new copy.
   */
  test("BDD-07-S07: Copy does NOT copy approval history", async () => {
    const approved = await seedApprovedOrder(makerApi, checkerApi, approverApi);

    // Source should have approval history
    const sourceHistoryResult = await makerApi.getApprovalStatus(approved.id);
    const sourceHistory = sourceHistoryResult.body as ApprovalEntry[];
    expect(sourceHistory.length).toBeGreaterThan(0);

    // Copy the order
    const { status, body } = await makerApi.copyOrder(approved.id);
    expect(status).toBe(201);
    const copy = body as PayOrder;

    // Copied order should have minimal or no approval history
    const copyHistoryResult = await makerApi.getApprovalStatus(copy.id);
    const copyHistory = copyHistoryResult.body as ApprovalEntry[];
    // Only the CREATE entry should exist for the copy
    expect(copyHistory.length).toBeLessThan(sourceHistory.length);
  });

  /**
   * BDD-07-S08: Copied order is editable (DRAFT)
   *
   * Reference: @alternative — "Sao chep sau do chinh sua truoc khi Luu"
   * The copied order is in DRAFT state and can be edited.
   */
  test("BDD-07-S08: Copied order is editable (DRAFT)", async () => {
    const source = await seedDraftOrder(makerApi);
    const { body: copyBody } = await makerApi.copyOrder(source.id);
    const copy = copyBody as PayOrder;

    // Edit the copy
    const editResult = await makerApi.updateOrder(copy.id, {
      version: copy.version,
      description: "Sao chep va chinh sua noi dung",
    });
    expect(editResult.status).toBe(200);

    const edited = editResult.body as PayOrder;
    expect(edited.description).toBe("Sao chep va chinh sua noi dung");
    expect(edited.version).toBe(2);
  });

  /**
   * BDD-07-S09: Cannot copy from DELETED -> 409
   *
   * Reference: BDD-07 @happy-path mentions DELETED copy for admin,
   * but for regular Maker, copying from DELETED should be rejected
   * per state machine rules.
   */
  test("BDD-07-S09: Cannot copy from DELETED -> 409", async () => {
    const source = await seedDraftOrder(makerApi);

    // Delete the source order
    const deleteResult = await makerApi.deleteOrder(
      source.id,
      {
        deleteReason: "Xoa de test copy tu DELETED",
        confirmed: true,
      },
      source.version,
    );
    expect(deleteResult.status).toBe(200);
    expect((deleteResult.body as PayOrder).status).toBe("DELETED");

    // Try to copy from DELETED
    const { status, body } = await makerApi.copyOrder(source.id);
    expect(status).toBe(409);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-STATUS/);
  });

  /**
   * BDD-07-S10: Copied order can be submitted
   *
   * Reference: @alternative — full copy -> submit flow
   */
  test("BDD-07-S10: Copied order can be submitted", async () => {
    const source = await seedDraftOrder(makerApi);
    const { body: copyBody } = await makerApi.copyOrder(source.id);
    const copy = copyBody as PayOrder;

    // Submit the copy (DRAFT -> READY_FOR_APPROVAL)
    const submitResult = await makerApi.submitOrder(copy.id, copy.version);
    expect(submitResult.status).toBe(200);

    const submitted = submitResult.body as PayOrder;
    expect(submitted.status).toBe("READY_FOR_APPROVAL");
    expect(submitted.version).toBe(copy.version + 1);
  });

  /**
   * BDD-07-S11: Copy with idempotency key
   *
   * Reference: ADR-0005 — idempotency on POST endpoints
   * Same idempotency key should return the same copied order.
   */
  test("BDD-07-S11: Copy with idempotency key returns same result", async () => {
    const source = await seedDraftOrder(makerApi);
    const idempotencyKey = generateIdempotencyKey();

    // First copy
    const result1 = await makerApi.copyOrderWithKey(source.id, idempotencyKey);
    expect(result1.status).toBe(201);
    const copy1 = result1.body as PayOrder;

    // Second copy with same idempotency key
    const result2 = await makerApi.copyOrderWithKey(source.id, idempotencyKey);
    expect(result2.status).toBe(201);
    const copy2 = result2.body as PayOrder;

    // Should return the same copied order
    expect(copy2.id).toBe(copy1.id);
    expect(copy2.refNo).toBe(copy1.refNo);
  });

  /**
   * BDD-07-S12: Full copy -> edit -> submit flow
   *
   * Reference: @alternative — end-to-end scenario
   * Copy an APPROVED order, edit it, and submit.
   */
  test("BDD-07-S12: Full copy -> edit -> submit flow", async () => {
    const approved = await seedApprovedOrder(makerApi, checkerApi, approverApi);

    // Step 1: Copy
    const copyResult = await makerApi.copyOrder(approved.id);
    expect(copyResult.status).toBe(201);
    const copy = copyResult.body as PayOrder;
    expect(copy.status).toBe("DRAFT");

    // Step 2: Edit
    const editResult = await makerApi.updateOrder(copy.id, {
      version: copy.version,
      description: "Sao chep va dieu chinh tu lenh da duyet",
    });
    expect(editResult.status).toBe(200);
    const edited = editResult.body as PayOrder;
    expect(edited.version).toBe(2);

    // Step 3: Submit
    const submitResult = await makerApi.submitOrder(edited.id, edited.version);
    expect(submitResult.status).toBe(200);
    const submitted = submitResult.body as PayOrder;
    expect(submitted.status).toBe("READY_FOR_APPROVAL");
    expect(submitted.version).toBe(3);
    expect(submitted.description).toBe(
      "Sao chep va dieu chinh tu lenh da duyet",
    );

    // Original order should be unchanged
    const originalResult = await makerApi.getOrder(approved.id);
    const original = originalResult.body as PayOrder;
    expect(original.status).toBe("APPROVED");
  });

  /**
   * BDD-07-S13: Non-MAKER cannot copy -> 403
   *
   * Reference: @exception — "User khong co quyen Maker — khong thay nut Sao chep"
   * VIEWER role should not have COPY permission.
   */
  test("BDD-07-S13: Non-MAKER (VIEWER) cannot copy -> 403", async () => {
    const source = await seedDraftOrder(makerApi);

    const { status, body } = await viewerApi.copyOrder(source.id);
    expect(status).toBe(403);

    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-PERMISSION/);
  });
});
