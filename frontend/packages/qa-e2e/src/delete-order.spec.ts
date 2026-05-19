/**
 * @kb/qa-e2e delete-order.spec.ts
 *
 * E2E test suite for BDD-05: PAY.OUT.MANUAL — Xoa lenh thanh toan (Soft Delete)
 * Feature: FT-001 | Flow: UC-DELETE
 *
 * Each test() maps to 1 BDD scenario from features/FT-001/bdd-05-delete.md
 * Test naming: BDD-05-S{XX}
 *
 * References:
 *   - BDD scenarios: features/FT-001/bdd-05-delete.md
 *   - API design: features/FT-001/02-design.md Section 2 (endpoint #4)
 *   - State Machine: features/FT-001/02-design.md Section 5 (transition #4)
 *   - Soft delete: STATUS='DELETED', not a separate is_deleted column
 */

import { test, expect } from "@playwright/test";
import { KbApiClient } from "./helpers/api-client";
import {
  createValidOrderData,
  createValidDeletePayload,
  createInvalidDeletePayloads,
  API_BASE_URL,
  TEST_USERS,
  resetLineNoCounter,
} from "./helpers/test-data";
import type {
  PayOrder,
  ApiErrorResponse,
  AuditLogEntry,
} from "./helpers/api-client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedDraftOrder(makerApi: KbApiClient): Promise<PayOrder> {
  resetLineNoCounter();
  const payload = createValidOrderData("LNH");
  const { body } = await makerApi.createOrder(payload);
  return body as PayOrder;
}

async function seedReturnedOrder(
  makerApi: KbApiClient,
  checkerApi: KbApiClient,
): Promise<PayOrder> {
  const draft = await seedDraftOrder(makerApi);
  const submitResult = await makerApi.submitOrder(draft.id, draft.version);
  const submitted = submitResult.body as PayOrder;
  const returnResult = await checkerApi.returnOrder(
    submitted.id,
    { reason: "Thieu chung tu, vui long bo sung" },
    submitted.version,
  );
  return returnResult.body as PayOrder;
}

async function seedReadyOrder(makerApi: KbApiClient): Promise<PayOrder> {
  const draft = await seedDraftOrder(makerApi);
  const submitResult = await makerApi.submitOrder(draft.id, draft.version);
  return submitResult.body as PayOrder;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe("BDD-05: PAY.OUT.MANUAL — Xoa lenh thanh toan (UC-DELETE)", () => {
  let makerApi: KbApiClient;
  let maker02Api: KbApiClient;
  let checkerApi: KbApiClient;
  let viewerApi: KbApiClient;

  test.beforeAll(() => {
    makerApi = new KbApiClient(API_BASE_URL, TEST_USERS.maker01.token);
    maker02Api = new KbApiClient(API_BASE_URL, TEST_USERS.maker02.token);
    checkerApi = new KbApiClient(API_BASE_URL, TEST_USERS.checker01.token);
    viewerApi = new KbApiClient(API_BASE_URL, TEST_USERS.viewer01.token);
  });

  // ========================================================================
  // @happy-path
  // ========================================================================

  /**
   * BDD-05-S01: Maker soft-deletes DRAFT -> DELETED
   *
   * Reference: @happy-path @TC-4.01
   * "Maker xoa thanh cong lenh o DRAFT — soft delete"
   * State Machine transition #4: DRAFT -> DELETED
   *
   * Validates:
   *   - F-STATUS changes to DELETED
   *   - DELETED_BY set to maker01
   *   - DELETED_AT set to current timestamp
   *   - DELETE_REASON stored
   *   - Version increments
   */
  test("BDD-05-S01: Maker soft-deletes DRAFT -> DELETED", async () => {
    const draft = await seedDraftOrder(makerApi);
    expect(draft.status).toBe("DRAFT");

    const deletePayload = createValidDeletePayload(
      "Lenh nhap sai so tai khoan, can huy",
    );
    const { status, body } = await makerApi.deleteOrder(
      draft.id,
      deletePayload,
      draft.version,
    );

    expect(status).toBe(200);
    const deleted = body as PayOrder;
    expect(deleted.status).toBe("DELETED");
    expect(deleted.deletedBy).toBe(TEST_USERS.maker01.userId);
    expect(deleted.deletedAt).toBeTruthy();
    expect(deleted.deleteReason).toBe("Lenh nhap sai so tai khoan, can huy");
    expect(deleted.version).toBe(draft.version + 1);
  });

  /**
   * BDD-05-S02: Maker soft-deletes RETURNED_TO_MAKER -> DELETED
   *
   * Reference: @happy-path
   * "Maker xoa thanh cong lenh RETURNED_TO_MAKER"
   * State Machine allows DELETE from RETURNED_TO_MAKER (transition #4).
   */
  test("BDD-05-S02: Maker soft-deletes RETURNED_TO_MAKER -> DELETED", async () => {
    const returned = await seedReturnedOrder(makerApi, checkerApi);
    expect(returned.status).toBe("RETURNED_TO_MAKER");

    const deletePayload = createValidDeletePayload(
      "Huy vi khong con nhu cau chi",
    );
    const { status, body } = await makerApi.deleteOrder(
      returned.id,
      deletePayload,
      returned.version,
    );

    expect(status).toBe(200);
    const deleted = body as PayOrder;
    expect(deleted.status).toBe("DELETED");
  });

  /**
   * BDD-05-S03: Only original Maker can delete -> 403
   *
   * Reference: @exception @TC-4.03 @VAL-14
   * "Chan Xoa khi khong phai Maker goc"
   */
  test("BDD-05-S03: Non-original Maker cannot delete -> 403", async () => {
    const draft = await seedDraftOrder(makerApi);

    const deletePayload = createValidDeletePayload(
      "Attempt by different maker",
    );
    const { status, body } = await maker02Api.deleteOrder(
      draft.id,
      deletePayload,
      draft.version,
    );

    expect(status).toBe(403);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-MAKER/);
  });

  /**
   * BDD-05-S04: Cannot delete READY/APPROVED -> 409
   *
   * Reference: @exception @TC-4.02 @VAL-13
   * "Chan Xoa khi F-STATUS khong cho phep"
   *
   * Delete is only allowed from DRAFT and RETURNED_TO_MAKER.
   */
  test("BDD-05-S04: Cannot delete READY_FOR_APPROVAL -> 409", async () => {
    const ready = await seedReadyOrder(makerApi);

    const deletePayload = createValidDeletePayload(
      "Attempt to delete READY order",
    );
    const { status, body } = await makerApi.deleteOrder(
      ready.id,
      deletePayload,
      ready.version,
    );

    expect(status).toBe(409);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-STATUS/);
  });

  /**
   * BDD-05-S05: Delete requires reason (10-500 chars) -> 422 if invalid
   *
   * Reference: @exception @TC-4.04 @VAL-16
   * "Ly do xoa vi pham do dai (10 <= length <= 500)"
   * Schema: CK_LTT_PAY_ORDER_DEL_REASON
   */
  test("BDD-05-S05: Delete reason must be 10-500 chars -> 422 if invalid", async () => {
    const draft = await seedDraftOrder(makerApi);
    const invalidPayloads = createInvalidDeletePayloads();

    // Short reason (< 10 chars)
    const shortResult = await makerApi.deleteOrder(
      draft.id,
      invalidPayloads.shortReason,
      draft.version,
    );
    expect(shortResult.status).toBe(422);
    const shortError = shortResult.body as ApiErrorResponse;
    expect(shortError.code).toMatch(/MSG-ERR/);

    // Create a fresh draft for the next test
    const draft2 = await seedDraftOrder(makerApi);

    // Empty reason
    const emptyResult = await makerApi.deleteOrder(
      draft2.id,
      invalidPayloads.emptyReason,
      draft2.version,
    );
    expect(emptyResult.status).toBe(422);

    // Create a fresh draft for the long reason test
    const draft3 = await seedDraftOrder(makerApi);

    // Long reason (> 500 chars)
    const longResult = await makerApi.deleteOrder(
      draft3.id,
      invalidPayloads.longReason,
      draft3.version,
    );
    expect(longResult.status).toBe(422);
  });

  /**
   * BDD-05-S06: Delete requires confirmed=true -> 422 if false
   *
   * Reference: @exception @TC-4.05 @VAL-16
   * "Chua tick checkbox xac nhan — chan xoa"
   */
  test("BDD-05-S06: Delete requires confirmed=true -> 422 if not confirmed", async () => {
    const draft = await seedDraftOrder(makerApi);
    const invalidPayloads = createInvalidDeletePayloads();

    const { status, body } = await makerApi.deleteOrder(
      draft.id,
      invalidPayloads.notConfirmed,
      draft.version,
    );
    expect(status).toBe(422);

    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR/);
  });

  /**
   * BDD-05-S07: Deleted order not in default list
   *
   * Reference: @happy-path — "Lenh bi an khoi LIST mac dinh"
   *
   * DELETED orders are excluded from the default list query
   * (WHERE STATUS != 'DELETED').
   */
  test("BDD-05-S07: Deleted order not in default list", async () => {
    const draft = await seedDraftOrder(makerApi);

    // Delete the order
    const deletePayload = createValidDeletePayload(
      "An khoi danh sach mac dinh test",
    );
    await makerApi.deleteOrder(draft.id, deletePayload, draft.version);

    // Verify it is not in the default list
    const { status, body } = await makerApi.listOrders({});
    expect(status).toBe(200);

    const result = body as { data: PayOrder[]; total: number };
    const foundInList = result.data.some((o) => o.id === draft.id);
    expect(foundInList).toBe(false);
  });

  /**
   * BDD-05-S08: Deleted order visible with flag
   *
   * Reference: @alternative — "Admin xem lai lenh DELETED bang cach tick filter DELETED"
   *
   * When includeDeleted=true is passed, DELETED orders appear in the list.
   */
  test("BDD-05-S08: Deleted order visible with includeDeleted flag", async () => {
    const draft = await seedDraftOrder(makerApi);

    // Delete the order
    const deletePayload = createValidDeletePayload(
      "Hien thi voi flag deleted test",
    );
    await makerApi.deleteOrder(draft.id, deletePayload, draft.version);

    // List with includeDeleted=true
    const { status, body } = await makerApi.listOrders({
      includeDeleted: true,
    });
    expect(status).toBe(200);

    const result = body as { data: PayOrder[] };
    const deletedOrder = result.data.find((o) => o.id === draft.id);
    expect(deletedOrder).toBeDefined();
    expect(deletedOrder!.status).toBe("DELETED");
  });

  /**
   * BDD-05-S09: Delete with optimistic lock conflict -> 409
   *
   * Reference: @exception — optimistic lock on DELETE (ADR-0004)
   * If version does not match, server rejects with 409.
   */
  test("BDD-05-S09: Delete with optimistic lock conflict -> 409", async () => {
    const draft = await seedDraftOrder(makerApi);

    // Edit the order first to bump the version
    const editResult = await makerApi.updateOrder(draft.id, {
      version: draft.version,
      description: "Edited before delete attempt",
    });
    expect(editResult.status).toBe(200);

    // Try to delete with the old version
    const deletePayload = createValidDeletePayload("Delete with stale version");
    const { status, body } = await makerApi.deleteOrder(
      draft.id,
      deletePayload,
      draft.version, // stale version
    );

    expect(status).toBe(409);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-LOCK/);
  });

  /**
   * BDD-05-S10: Non-MAKER cannot delete -> 403
   *
   * Reference: @exception — VIEWER role lacks DELETE permission
   */
  test("BDD-05-S10: Non-MAKER (VIEWER) cannot delete -> 403", async () => {
    const draft = await seedDraftOrder(makerApi);

    const deletePayload = createValidDeletePayload("Viewer attempt delete");
    const { status, body } = await viewerApi.deleteOrder(
      draft.id,
      deletePayload,
      draft.version,
    );

    expect(status).toBe(403);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-PERMISSION/);
  });

  /**
   * BDD-05-S11: Audit log records delete action
   *
   * Reference: @happy-path @TC-4.06
   * "Ban ghi da xoa van tru duoc qua Audit Log"
   * BIZ-003: ban ghi DELETED van truy duoc
   * BIZ-007: audit day du
   *
   * Validates:
   *   - Audit log entry exists with action=DELETE
   *   - PERFORMED_BY = maker01
   *   - OLD_VALUE contains the full snapshot before deletion
   *   - NEW_VALUE is null (deleted)
   *   - REASON contains the delete reason
   */
  test("BDD-05-S11: Audit log records delete action", async () => {
    const draft = await seedDraftOrder(makerApi);

    // Delete the order
    const deleteReason = "Ban ghi da xoa van tru duoc qua audit log";
    const deletePayload = createValidDeletePayload(deleteReason);
    const deleteResult = await makerApi.deleteOrder(
      draft.id,
      deletePayload,
      draft.version,
    );
    expect(deleteResult.status).toBe(200);

    // Check audit log
    const auditResult = await makerApi.getAuditLog(draft.id);
    expect(auditResult.status).toBe(200);

    const auditEntries = auditResult.body as AuditLogEntry[];
    const deleteEntry = auditEntries.find((e) => e.action === "DELETE");
    expect(deleteEntry).toBeDefined();
    expect(deleteEntry!.performedBy).toBe(TEST_USERS.maker01.userId);
    expect(deleteEntry!.oldValue).toBeTruthy(); // Full snapshot before deletion
    expect(deleteEntry!.versionBefore).toBe(draft.version);
    expect(deleteEntry!.versionAfter).toBe(draft.version + 1);
  });
});
