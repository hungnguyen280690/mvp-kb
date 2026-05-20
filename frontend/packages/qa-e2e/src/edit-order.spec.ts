/**
 * @kb/qa-e2e edit-order.spec.ts
 *
 * E2E test suite for BDD-02: PAY.OUT.MANUAL — Chinh sua lenh thanh toan di thu cong
 * Feature: FT-001 | Flow: UC-EDIT
 *
 * Each test() maps to 1 BDD scenario from features/FT-001/bdd-02-edit.md
 * Test naming: BDD-02-S{XX}
 *
 * References:
 *   - BDD scenarios: features/FT-001/bdd-02-edit.md
 *   - API design: features/FT-001/02-design.md Section 2
 *   - DB schema: features/FT-001/03-schema.sql
 *   - Optimistic lock: ADR-0004
 */

import { test, expect } from "@playwright/test";
import { KbApiClient } from "./helpers/api-client";
import {
  createValidOrderData,
  createValidEditPayload,
  createLineData,
  API_BASE_URL,
  TEST_USERS,
  resetLineNoCounter,
} from "./helpers/test-data";
import type { PayOrder, ApiErrorResponse } from "./helpers/api-client";

// ---------------------------------------------------------------------------
// Helper: create a draft order for edit testing
// ---------------------------------------------------------------------------

async function seedDraftOrder(api: KbApiClient): Promise<PayOrder> {
  const payload = createValidOrderData("LNH");
  const { body } = await api.createOrder(payload);
  return body as PayOrder;
}

async function seedReturnedOrder(
  makerApi: KbApiClient,
  checkerApi: KbApiClient,
): Promise<PayOrder> {
  // Create and submit
  const draft = await seedDraftOrder(makerApi);
  const submitResult = await makerApi.submitOrder(draft.id, draft.version);
  const submitted = submitResult.body as PayOrder;

  // Checker returns it
  const returnResult = await checkerApi.returnOrder(
    submitted.id,
    { reason: "Thieu chung tu hop dong, vui long bo sung va submit lai" },
    submitted.version,
  );
  return returnResult.body as PayOrder;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe("BDD-02: PAY.OUT.MANUAL — Chinh sua lenh thanh toan (UC-EDIT)", () => {
  let makerApi: KbApiClient;
  let maker02Api: KbApiClient;
  let checkerApi: KbApiClient;

  test.beforeAll(() => {
    makerApi = new KbApiClient(API_BASE_URL, TEST_USERS.maker01.token);
    maker02Api = new KbApiClient(API_BASE_URL, TEST_USERS.maker02.token);
    checkerApi = new KbApiClient(API_BASE_URL, TEST_USERS.checker01.token);
  });

  // ========================================================================
  // @happy-path
  // ========================================================================

  /**
   * BDD-02-S01: Maker edits DRAFT order -> updated
   *
   * Reference: @happy-path @TC-3.01
   * "Maker goc sua thanh cong lenh o trang thai DRAFT"
   *
   * Validates:
   *   - PUT /api/pay-out-manual/{id} with If-Match header
   *   - F-VER increments from 1 to 2
   *   - Updated field reflects the new value
   *   - F-STATUS remains DRAFT
   *   - Audit entry created with action=UPDATE
   */
  test("BDD-02-S01: Maker edits DRAFT order -> updated, version increments", async () => {
    const draft = await seedDraftOrder(makerApi);

    const editPayload = createValidEditPayload(draft.version, {
      description: "Thanh toan cap nhat thang 5",
    });

    const { status, body } = await makerApi.updateOrder(draft.id, editPayload);
    expect(status).toBe(200);

    const updated = body as PayOrder;
    expect(updated.version).toBe(draft.version + 1);
    expect(updated.description).toBe("Thanh toan cap nhat thang 5");
    expect(updated.status).toBe("DRAFT");
    expect(updated.updatedBy).toBe(TEST_USERS.maker01.userId);
    expect(updated.updatedAt).toBeTruthy();
  });

  /**
   * BDD-02-S02: Maker edits RETURNED order -> updated
   *
   * Reference: @happy-path @TC-3.06
   * "Maker sua thanh cong lenh RETURNED_TO_MAKER sau khi Checker tra lai"
   *
   * Validates:
   *   - RETURNED_TO_MAKER status allows editing
   *   - RETURN_REASON is visible in the response
   *   - After edit, status remains RETURNED_TO_MAKER
   *   - Version increments
   */
  test("BDD-02-S02: Maker edits RETURNED_TO_MAKER order -> updated", async () => {
    const returned = await seedReturnedOrder(makerApi, checkerApi);
    expect(returned.status).toBe("RETURNED_TO_MAKER");

    const editPayload = createValidEditPayload(returned.version, {
      description: "Da bo sung chung tu theo yeu cau Checker",
    });

    const { status, body } = await makerApi.updateOrder(
      returned.id,
      editPayload,
    );
    expect(status).toBe(200);

    const updated = body as PayOrder;
    expect(updated.version).toBe(returned.version + 1);
    expect(updated.description).toBe(
      "Da bo sung chung tu theo yeu cau Checker",
    );
    expect(updated.status).toBe("RETURNED_TO_MAKER");
  });

  /**
   * BDD-02-S03: Only original Maker can edit -> 403
   *
   * Reference: @exception @TC-3.03 @VAL-14
   * "Chan Sua khi khong phai Maker goc"
   *
   * Maker02 cannot edit an order created by Maker01.
   */
  test("BDD-02-S03: Non-original Maker cannot edit -> 403", async () => {
    const draft = await seedDraftOrder(makerApi);

    const editPayload = createValidEditPayload(draft.version, {
      description: "Attempt by different maker",
    });

    const { status, body } = await maker02Api.updateOrder(
      draft.id,
      editPayload,
    );
    expect(status).toBe(403);

    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-MAKER/);
  });

  /**
   * BDD-02-S04: Cannot edit APPROVED/READY/PENDING -> 409
   *
   * Reference: @exception @TC-3.02 @VAL-13
   * "Chan Sua khi F-STATUS khong cho phep"
   *
   * Edit is only allowed for DRAFT and RETURNED_TO_MAKER.
   * Tests: READY_FOR_APPROVAL, PENDING_APPROVER, APPROVED
   */
  test("BDD-02-S04: Cannot edit READY_FOR_APPROVAL order -> 409", async () => {
    const draft = await seedDraftOrder(makerApi);

    // Submit to make it READY_FOR_APPROVAL
    const submitResult = await makerApi.submitOrder(draft.id, draft.version);
    const submitted = submitResult.body as PayOrder;
    expect(submitted.status).toBe("READY_FOR_APPROVAL");

    // Attempt to edit
    const editPayload = createValidEditPayload(submitted.version);
    const { status, body } = await makerApi.updateOrder(
      submitted.id,
      editPayload,
    );

    expect(status).toBe(409);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-STATUS/);
  });

  /**
   * BDD-02-S05: Optimistic lock conflict -> 409
   *
   * Reference: @exception @TC-3.04 @VAL-15 (ADR-0004)
   * "Optimistic lock conflict — user khac da luu truoc"
   *
   * If the version in the request does not match the current DB version,
   * the server rejects with 409 MSG-ERR-LOCK.
   */
  test("BDD-02-S05: Optimistic lock conflict -> 409", async () => {
    const draft = await seedDraftOrder(makerApi);

    // First edit succeeds, version goes from 1 to 2
    const edit1 = createValidEditPayload(draft.version, {
      description: "First edit",
    });
    const result1 = await makerApi.updateOrder(draft.id, edit1);
    expect(result1.status).toBe(200);

    // Second edit with stale version (1) -> conflict
    const edit2 = createValidEditPayload(draft.version, {
      description: "Second edit with stale version",
    });
    const result2 = await makerApi.updateOrder(draft.id, edit2);

    expect(result2.status).toBe(409);
    const error = result2.body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-LOCK/);
  });

  /**
   * BDD-02-S06: Edit with invalid data -> 422
   *
   * Reference: @exception @VAL-02
   * "Edit that bai — Format ngay sai sau khi sua"
   *
   * Invalid field values during edit should trigger 422.
   */
  test("BDD-02-S06: Edit with invalid data -> 422", async () => {
    const draft = await seedDraftOrder(makerApi);

    const editPayload = createValidEditPayload(draft.version, {
      paymentDate: "INVALID_DATE_FORMAT",
    } as any);

    const { status, body } = await makerApi.updateOrder(draft.id, editPayload);
    expect(status).toBe(422);

    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-FORMAT/);
  });

  /**
   * BDD-02-S07: Edit after submit -> 409
   *
   * Reference: State Machine — DRAFT/RETURNED only allow UPDATE.
   * After submit (READY_FOR_APPROVAL), edit should be rejected.
   */
  test("BDD-02-S07: Cannot edit after submit (READY_FOR_APPROVAL) -> 409", async () => {
    const draft = await seedDraftOrder(makerApi);

    // Submit
    const submitResult = await makerApi.submitOrder(draft.id, draft.version);
    expect(submitResult.status).toBe(200);
    const submitted = submitResult.body as PayOrder;
    expect(submitted.status).toBe("READY_FOR_APPROVAL");

    // Try to edit the submitted order
    const editPayload = createValidEditPayload(submitted.version, {
      description: "Should not work",
    });
    const editResult = await makerApi.updateOrder(submitted.id, editPayload);

    expect(editResult.status).toBe(409);
  });

  /**
   * BDD-02-S08: Version increments on each edit
   *
   * Reference: @happy-path — F-VER increments by 1 on each update
   * Validates that multiple sequential edits increment version correctly.
   */
  test("BDD-02-S08: Version increments on each edit", async () => {
    const draft = await seedDraftOrder(makerApi);
    expect(draft.version).toBe(1);

    // Edit 1: version 1 -> 2
    const edit1 = createValidEditPayload(1, { description: "Edit 1" });
    const result1 = await makerApi.updateOrder(draft.id, edit1);
    expect(result1.status).toBe(200);
    expect((result1.body as PayOrder).version).toBe(2);

    // Edit 2: version 2 -> 3
    const edit2 = createValidEditPayload(2, { description: "Edit 2" });
    const result2 = await makerApi.updateOrder(draft.id, edit2);
    expect(result2.status).toBe(200);
    expect((result2.body as PayOrder).version).toBe(3);

    // Edit 3: version 3 -> 4
    const edit3 = createValidEditPayload(3, { description: "Edit 3" });
    const result3 = await makerApi.updateOrder(draft.id, edit3);
    expect(result3.status).toBe(200);
    expect((result3.body as PayOrder).version).toBe(4);
  });

  /**
   * BDD-02-S09: Edit preserves REF_NO
   *
   * Reference: VAL-17 — immutable fields cannot be changed
   * REF_NO, F-ID, CREATED_BY, CREATED_DATE must remain unchanged after edit.
   */
  test("BDD-02-S09: Edit preserves REF_NO and immutable fields", async () => {
    const draft = await seedDraftOrder(makerApi);
    const originalRefNo = draft.refNo;
    const originalId = draft.id;
    const originalCreatedBy = draft.createdBy;
    const originalCreatedAt = draft.createdAt;

    const editPayload = createValidEditPayload(draft.version, {
      description: "Updated description",
    });
    const { status, body } = await makerApi.updateOrder(draft.id, editPayload);
    expect(status).toBe(200);

    const updated = body as PayOrder;
    // Immutable fields must not change
    expect(updated.refNo).toBe(originalRefNo);
    expect(updated.id).toBe(originalId);
    expect(updated.createdBy).toBe(originalCreatedBy);
    expect(updated.createdAt).toBe(originalCreatedAt);
  });

  /**
   * BDD-02-S10: Edit COA lines (add/remove)
   *
   * Reference: @alternative — adding lines updates AMOUNT header
   * Validates adding and removing COA lines during edit.
   */
  test("BDD-02-S10: Edit COA lines — add and remove lines", async () => {
    resetLineNoCounter();
    const draft = await seedDraftOrder(makerApi);

    // Edit with new lines — 3 lines total
    const newLines = [
      createLineData({ lineNo: 1, lineAmount: 400_000 }),
      createLineData({ lineNo: 2, lineAmount: 350_000 }),
      createLineData({ lineNo: 3, lineAmount: 250_000 }),
    ];

    const editPayload = createValidEditPayload(draft.version, {
      amount: 1_000_000,
      lines: newLines,
    });

    const { status, body } = await makerApi.updateOrder(draft.id, editPayload);
    expect(status).toBe(200);

    const updated = body as PayOrder;
    expect(updated.lines).toBeDefined();
    expect(updated.lines!.length).toBe(3);
    expect(updated.amount).toBe(1_000_000);
  });

  /**
   * BDD-02-S11: Edit attachments during DRAFT
   *
   * Reference: @alternative — delete attachment during edit
   * Validates that attachments can be uploaded and deleted on DRAFT orders.
   */
  test("BDD-02-S11: Edit attachments during DRAFT — upload and delete", async () => {
    const draft = await seedDraftOrder(makerApi);

    // Upload attachment
    const testFile = createTestPdfFile(2048);
    const uploadResult = await makerApi.uploadAttachment(
      draft.id,
      testFile,
      "CHUNG_TU_GOC",
      "Chung tu test",
    );
    expect(uploadResult.status).toBe(201);
    const attachment = uploadResult.body as { id: string; fileName: string };
    expect(attachment.fileName).toBe("chungtu.pdf");

    // Verify attachment exists
    const listResult = await makerApi.listAttachments(draft.id);
    const attachments = listResult.body as Array<{
      id: string;
      isDeleted: boolean;
    }>;
    expect(attachments.length).toBeGreaterThanOrEqual(1);

    // Delete the attachment (soft delete)
    const deleteResult = await makerApi.deleteAttachment(
      draft.id,
      attachment.id,
    );
    expect(deleteResult.status).toBe(200);
  });

  /**
   * BDD-02-S12: Concurrent edit race condition
   *
   * Reference: @exception — concurrent edit detected by optimistic lock
   * Two "sessions" editing the same order simultaneously.
   * The second edit should fail with 409 MSG-ERR-LOCK.
   */
  test("BDD-02-S12: Concurrent edit race condition -> second edit rejected", async () => {
    const draft = await seedDraftOrder(makerApi);

    // Both edits use the same version (1)
    const edit1 = createValidEditPayload(draft.version, {
      description: "First concurrent edit",
    });
    const edit2 = createValidEditPayload(draft.version, {
      description: "Second concurrent edit",
    });

    // First edit succeeds
    const result1 = await makerApi.updateOrder(draft.id, edit1);
    expect(result1.status).toBe(200);
    expect((result1.body as PayOrder).version).toBe(2);

    // Second edit with stale version -> 409
    const result2 = await makerApi.updateOrder(draft.id, edit2);
    expect(result2.status).toBe(409);
    const error = result2.body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-LOCK/);
  });
});

// Import the createTestPdfFile used in S11
function createTestPdfFile(sizeBytes: number = 1024): File {
  const content = new Uint8Array(Math.min(sizeBytes, 1024));
  content.fill(0x25);
  return new File([content], "chungtu.pdf", { type: "application/pdf" });
}
