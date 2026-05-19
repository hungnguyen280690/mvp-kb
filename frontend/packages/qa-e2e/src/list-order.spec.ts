/**
 * @kb/qa-e2e list-order.spec.ts
 *
 * E2E test suite for BDD-04: PAY.OUT.MANUAL — Danh sach lenh thanh toan (List + Filter + Search)
 * Feature: FT-001 | Flow: UC-LIST
 *
 * Each test() maps to 1 BDD scenario from features/FT-001/bdd-04-list.md
 * Test naming: BDD-04-S{XX}
 *
 * References:
 *   - BDD scenarios: features/FT-001/bdd-04-list.md
 *   - API design: features/FT-001/02-design.md Section 2 (endpoint #11)
 */

import { test, expect } from "@playwright/test";
import { KbApiClient } from "./helpers/api-client";
import {
  createValidOrderData,
  API_BASE_URL,
  TEST_USERS,
  resetLineNoCounter,
} from "./helpers/test-data";
import type {
  PayOrder,
  ApiErrorResponse,
  PaginatedResponse,
  OrderStatus,
} from "./helpers/api-client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Seed multiple orders with varying statuses for list testing */
async function seedOrdersForListing(
  makerApi: KbApiClient,
  checkerApi: KbApiClient,
  approverApi: KbApiClient,
): Promise<PayOrder[]> {
  const orders: PayOrder[] = [];

  // Create 5 DRAFT orders
  for (let i = 0; i < 5; i++) {
    resetLineNoCounter();
    const payload = createValidOrderData("LNH", {
      description: `Draft order ${i + 1} for list test`,
      amount: 1_000_000 * (i + 1),
    });
    const { body } = await makerApi.createOrder(payload);
    orders.push(body as PayOrder);
  }

  // Create 3 READY_FOR_APPROVAL orders
  for (let i = 0; i < 3; i++) {
    resetLineNoCounter();
    const payload = createValidOrderData("LNH", {
      description: `Ready order ${i + 1}`,
      amount: 5_000_000 * (i + 1),
    });
    const { body: draft } = await makerApi.createOrder(payload);
    const order = draft as PayOrder;
    const { body: submitted } = await makerApi.submitOrder(
      order.id,
      order.version,
    );
    orders.push(submitted as PayOrder);
  }

  // Create 2 APPROVED orders
  for (let i = 0; i < 2; i++) {
    resetLineNoCounter();
    const payload = createValidOrderData("LNH", {
      description: `Approved order ${i + 1}`,
      amount: 10_000_000 * (i + 1),
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
    orders.push(approved as PayOrder);
  }

  return orders;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe("BDD-04: PAY.OUT.MANUAL — Danh sach lenh thanh toan (UC-LIST)", () => {
  let makerApi: KbApiClient;
  let checkerApi: KbApiClient;
  let approverApi: KbApiClient;
  let viewerApi: KbApiClient;
  let seededOrderIds: string[];

  test.beforeAll(async () => {
    makerApi = new KbApiClient(API_BASE_URL, TEST_USERS.maker01.token);
    checkerApi = new KbApiClient(API_BASE_URL, TEST_USERS.checker01.token);
    approverApi = new KbApiClient(API_BASE_URL, TEST_USERS.approver01.token);
    viewerApi = new KbApiClient(API_BASE_URL, TEST_USERS.viewer01.token);

    // Seed test data once for the entire suite
    const orders = await seedOrdersForListing(
      makerApi,
      checkerApi,
      approverApi,
    );
    seededOrderIds = orders.map((o) => o.id);
  });

  test.beforeEach(() => {
    resetLineNoCounter();
  });

  // ========================================================================
  // @happy-path
  // ========================================================================

  /**
   * BDD-04-S01: List returns paginated results
   *
   * Reference: @happy-path — "Mo LIST mac dinh"
   * GET /api/pay-out-manual with default pagination (page=1, pageSize=20)
   *
   * Validates:
   *   - Response has data array with total count
   *   - Default pagination returns page 1
   *   - DELETED orders excluded by default
   */
  test("BDD-04-S01: List returns paginated results", async () => {
    const { status, body } = await viewerApi.listOrders();
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    expect(result.data).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThan(0);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBeGreaterThan(0);

    // Default list should not include DELETED orders
    const hasDeleted = result.data.some((o) => o.status === "DELETED");
    expect(hasDeleted).toBe(false);
  });

  /**
   * BDD-04-S02: Filter by status DRAFT
   *
   * Reference: @happy-path — filter by F-STATUS
   */
  test("BDD-04-S02: Filter by status DRAFT", async () => {
    const { status, body } = await viewerApi.listOrders({
      status: ["DRAFT"],
    });
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    expect(result.data.length).toBeGreaterThan(0);

    // All results should be DRAFT
    for (const order of result.data) {
      expect(order.status).toBe("DRAFT");
    }
  });

  /**
   * BDD-04-S03: Filter by channel LNH
   *
   * Reference: @happy-path — filter by CHANNEL
   */
  test("BDD-04-S03: Filter by channel LNH", async () => {
    const { status, body } = await viewerApi.listOrders({
      channel: ["LNH"],
    });
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    expect(result.data.length).toBeGreaterThan(0);

    for (const order of result.data) {
      expect(order.channel).toBe("LNH");
    }
  });

  /**
   * BDD-04-S04: Filter by date range
   *
   * Reference: @happy-path — filter by FROM_DATE and TO_DATE
   */
  test("BDD-04-S04: Filter by date range", async () => {
    const { status, body } = await viewerApi.listOrders({
      fromDate: "2026-05-01",
      toDate: "2026-05-31",
    });
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    expect(result.data).toBeInstanceOf(Array);

    // All results should have paymentDate within the range
    for (const order of result.data) {
      const paymentDate = new Date(order.paymentDate);
      expect(paymentDate.getTime()).toBeGreaterThanOrEqual(
        new Date("2026-05-01").getTime(),
      );
      expect(paymentDate.getTime()).toBeLessThanOrEqual(
        new Date("2026-05-31").getTime(),
      );
    }
  });

  /**
   * BDD-04-S05: Filter by amount range
   *
   * Reference: @happy-path — filter by AMOUNT_FROM and AMOUNT_TO
   */
  test("BDD-04-S05: Filter by amount range", async () => {
    const { status, body } = await viewerApi.listOrders({
      amountFrom: 1_000_000,
      amountTo: 10_000_000,
    });
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    for (const order of result.data) {
      expect(order.amount).toBeGreaterThanOrEqual(1_000_000);
      expect(order.amount).toBeLessThanOrEqual(10_000_000);
    }
  });

  /**
   * BDD-04-S06: Search by REF_NO partial match
   *
   * Reference: @alternative — search by REF_NO (chinh xac)
   */
  test("BDD-04-S06: Search by REF_NO partial match", async () => {
    // First get any order's refNo
    const listResult = await viewerApi.listOrders({ pageSize: 1 });
    const list = listResult.body as PaginatedResponse<PayOrder>;
    expect(list.data.length).toBeGreaterThan(0);

    const refNo = list.data[0].refNo;
    // Use a partial match (prefix up to the KBNN-YYYYMM part)
    const prefix = refNo.substring(0, Math.min(11, refNo.length));

    const { status, body } = await viewerApi.listOrders({
      refNo: prefix,
    });
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    expect(result.data.length).toBeGreaterThan(0);

    // Results should contain the refNo prefix
    for (const order of result.data) {
      expect(order.refNo).toContain(prefix);
    }
  });

  // ========================================================================
  // @alternative — Sort and pagination
  // ========================================================================

  /**
   * BDD-04-S07: Sort by created_at descending (default)
   *
   * Reference: @happy-path — "mac dinh sort theo CREATED_DATE DESC"
   */
  test("BDD-04-S07: Sort by created_at descending (default)", async () => {
    const { status, body } = await viewerApi.listOrders({
      sortBy: "createdAt",
      sortDir: "DESC",
    });
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    if (result.data.length >= 2) {
      const firstDate = new Date(result.data[0].createdAt).getTime();
      const secondDate = new Date(result.data[1].createdAt).getTime();
      expect(firstDate).toBeGreaterThanOrEqual(secondDate);
    }
  });

  /**
   * BDD-04-S08: Sort by amount ascending
   *
   * Reference: @alternative — "Doi page size va sort theo AMOUNT"
   */
  test("BDD-04-S08: Sort by amount ascending", async () => {
    const { status, body } = await viewerApi.listOrders({
      sortBy: "amount",
      sortDir: "ASC",
    });
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    if (result.data.length >= 2) {
      expect(result.data[0].amount).toBeLessThanOrEqual(result.data[1].amount);
    }
  });

  /**
   * BDD-04-S09: Pagination — page 2 returns correct subset
   *
   * Reference: @happy-path — page size 20, verify page 2 offset
   */
  test("BDD-04-S09: Pagination — page 2 returns correct subset", async () => {
    const pageSize = 2;

    // Get page 1
    const page1Result = await viewerApi.listOrders({ page: 1, pageSize });
    expect(page1Result.status).toBe(200);
    const page1 = page1Result.body as PaginatedResponse<PayOrder>;

    // Get page 2
    const page2Result = await viewerApi.listOrders({ page: 2, pageSize });
    expect(page2Result.status).toBe(200);
    const page2 = page2Result.body as PaginatedResponse<PayOrder>;

    // Page 1 and Page 2 should have different IDs
    if (page1.data.length > 0 && page2.data.length > 0) {
      const page1Ids = page1.data.map((o) => o.id);
      const page2Ids = page2.data.map((o) => o.id);
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap.length).toBe(0);
    }

    // Total should be the same across pages
    expect(page2.total).toBe(page1.total);
  });

  /**
   * BDD-04-S10: Default excludes DELETED status
   *
   * Reference: @happy-path — "DELETED khong hien thi tru khi tick"
   */
  test("BDD-04-S10: Default list excludes DELETED status", async () => {
    // Create and delete an order
    const payload = createValidOrderData("LNH");
    const createResult = await makerApi.createOrder(payload);
    const draft = createResult.body as PayOrder;

    await makerApi.deleteOrder(
      draft.id,
      {
        deleteReason: "Xoa de test filter danh sach",
        confirmed: true,
      },
      draft.version,
    );

    // List without includeDeleted
    const { status, body } = await viewerApi.listOrders({});
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    const deletedInList = result.data.some(
      (o) => o.id === draft.id && o.status === "DELETED",
    );
    expect(deletedInList).toBe(false);
  });

  /**
   * BDD-04-S11: VIEWER can view list
   *
   * Reference: @happy-path — viewer01 has access to LIST
   */
  test("BDD-04-S11: VIEWER can view list", async () => {
    const { status, body } = await viewerApi.listOrders();
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    expect(result.data).toBeInstanceOf(Array);
  });

  // ========================================================================
  // @alternative / @exception
  // ========================================================================

  /**
   * BDD-04-S12: Combined filters
   *
   * Reference: @happy-path — "Filter theo Trang thai + khoang so tien"
   * Tests combining status + amount + date filters together.
   */
  test("BDD-04-S12: Combined filters — status + amount + date", async () => {
    const { status, body } = await viewerApi.listOrders({
      status: ["DRAFT"],
      amountFrom: 1_000_000,
      amountTo: 20_000_000,
      fromDate: "2026-05-01",
      toDate: "2026-05-31",
    });
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    for (const order of result.data) {
      expect(order.status).toBe("DRAFT");
      expect(order.amount).toBeGreaterThanOrEqual(1_000_000);
      expect(order.amount).toBeLessThanOrEqual(20_000_000);
    }
  });

  /**
   * BDD-04-S13: Empty result set
   *
   * Reference: @exception — filters that match nothing
   */
  test("BDD-04-S13: Empty result set returns valid structure", async () => {
    const { status, body } = await viewerApi.listOrders({
      amountFrom: 999_999_999_999,
      amountTo: 999_999_999_999,
    });
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBe(0);
    expect(result.total).toBe(0);
  });

  /**
   * BDD-04-S14: List with kbnnId filter (tenant isolation)
   *
   * Reference: Multi-tenant scope — KBNN_ID filtering
   * Orders created under kbnnId=70001 should only be visible
   * to users in the same tenant.
   */
  test("BDD-04-S14: List with kbnnId filter (tenant isolation)", async () => {
    const { status, body } = await viewerApi.listOrders({
      kbnnId: "70001",
    });
    expect(status).toBe(200);

    const result = body as PaginatedResponse<PayOrder>;
    for (const order of result.data) {
      expect(order.kbnnId).toBe("70001");
    }
  });
});
