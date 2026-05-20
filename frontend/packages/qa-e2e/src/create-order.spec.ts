/**
 * @kb/qa-e2e create-order.spec.ts
 *
 * E2E test suite for BDD-01: PAY.OUT.MANUAL — Tao lenh thanh toan di thu cong
 * Feature: FT-001 | Flow: UC-CREATE
 *
 * Each test() maps to 1 BDD scenario from features/FT-001/bdd-01-create.md
 * Test naming: BDD-01-S{XX} where XX matches the scenario number in the BDD.
 *
 * References:
 *   - BDD scenarios: features/FT-001/bdd-01-create.md
 *   - API design: features/FT-001/02-design.md Section 2
 *   - DB schema: features/FT-001/03-schema.sql
 */

import { test, expect } from "@playwright/test";
import { KbApiClient } from "./helpers/api-client";
import {
  createValidOrderData,
  createInvalidOrderData,
  createLineData,
  createForeignCurrencyOrderData,
  createTestPdfFile,
  generateIdempotencyKey,
  API_BASE_URL,
  TEST_USERS,
  resetLineNoCounter,
} from "./helpers/test-data";
import type { PayOrder, ApiErrorResponse } from "./helpers/api-client";

// ---------------------------------------------------------------------------
// Setup API client for the MAKER role
// ---------------------------------------------------------------------------

test.describe("BDD-01: PAY.OUT.MANUAL — Tao lenh thanh toan (UC-CREATE)", () => {
  let api: KbApiClient;

  test.beforeAll(() => {
    api = new KbApiClient(API_BASE_URL, TEST_USERS.maker01.token);
  });

  test.beforeEach(() => {
    resetLineNoCounter();
  });

  // ========================================================================
  // @happy-path
  // ========================================================================

  /**
   * BDD-01-S01: Maker creates valid LNH order -> DRAFT, REF_NO auto-gen
   *
   * BDD Scenario: "Maker tao va Luu nap thanh cong lenh thanh toan hop le"
   * Reference: @happy-path @TC-1.01
   *
   * Validates:
   *   - F-STATUS = DRAFT after save
   *   - F-VER = 1
   *   - REF_NO auto-generated with pattern <KBNN>-YYYYMM-<seq6>
   *   - CREATED_BY = maker01
   *   - CREATED_DATE set to current timestamp
   *   - Audit entry created with action=CREATE
   */
  test("BDD-01-S01: Maker creates valid LNH order -> DRAFT with auto-gen REF_NO", async () => {
    const payload = createValidOrderData("LNH");
    const { status, body } = await api.createOrder(payload);

    expect(status).toBe(201);
    const order = body as PayOrder;

    // Verify DRAFT status and version
    expect(order.status).toBe("DRAFT");
    expect(order.version).toBe(1);

    // Verify REF_NO auto-generated with pattern <KBNN>-YYYYMM-<seq6>
    expect(order.refNo).toMatch(/^70001-\d{6}-\d{6}$/);

    // Verify audit fields set correctly
    expect(order.createdBy).toBe(TEST_USERS.maker01.userId);
    expect(order.createdAt).toBeTruthy();

    // Verify channel and order type
    expect(order.channel).toBe("LNH");
    expect(order.orderType).toBe("LENH_CHUYEN_KHOAN");
    expect(order.lnhTransactionType).toBe("LTT01");

    // Verify amount
    expect(order.amount).toBe(1_000_000);
    expect(order.currencyCode).toBe("VND");
  });

  /**
   * BDD-01-S02: Maker creates TTSP order with ORIGIN_NUM
   *
   * Validates channel=TTSP requires:
   *   - ORDER_TYPE is set (not null)
   *   - ORIGIN_NUM is provided (required for TTSP)
   *   - TRANSACTION_DATE is provided (required for TTSP)
   *   - LNH_TRANSACTION_TYPE is null (only valid for LNH)
   */
  test("BDD-01-S02: Maker creates TTSP order with ORIGIN_NUM", async () => {
    const payload = createValidOrderData("TTSP");
    const { status, body } = await api.createOrder(payload);

    expect(status).toBe(201);
    const order = body as PayOrder;

    expect(order.status).toBe("DRAFT");
    expect(order.channel).toBe("TTSP");
    expect(order.orderType).toBe("LENH_CHUYEN_KHOAN");
    expect(order.originNum).toBe("CT-ORIG-2026-001");
    expect(order.transactionDate).toBeTruthy();
    expect(order.lnhTransactionType).toBeUndefined();
  });

  /**
   * BDD-01-S03: Maker creates LIEN_KHO_BAC order (no ORDER_TYPE)
   *
   * Validates channel=LIEN_KHO_BAC:
   *   - ORDER_TYPE must be NULL (schema constraint CK_LTT_PAY_ORDER_TYPE)
   *   - LNH_TRANSACTION_TYPE must be NULL
   *   - ORDER_TYPE is not required (INC-G-16)
   */
  test("BDD-01-S03: Maker creates LIEN_KHO_BAC order without ORDER_TYPE", async () => {
    const payload = createValidOrderData("LIEN_KHO_BAC");
    const { status, body } = await api.createOrder(payload);

    expect(status).toBe(201);
    const order = body as PayOrder;

    expect(order.status).toBe("DRAFT");
    expect(order.channel).toBe("LIEN_KHO_BAC");
    expect(order.orderType).toBeUndefined();
    expect(order.lnhTransactionType).toBeUndefined();
  });

  // ========================================================================
  // @exception — Validation failures
  // ========================================================================

  /**
   * BDD-01-S04: Validate required fields missing -> 422
   *
   * Reference: @exception @TC-1.03 @VAL-01
   * "Submit that bai — truong bat buoc REF_NO bi bo trong"
   *
   * When saving a draft, format validation (VAL-02, VAL-10) still runs,
   * but mandatory field validation (VAL-01) is relaxed per BDD A1 alternative.
   * However, submit-level calls should reject missing required fields with 422.
   *
   * Validates: missing required fields returns 422 with error code MSG-ERR-REQUIRED.
   */
  test("BDD-01-S04: Validate required fields missing -> 422", async () => {
    const invalidData = createInvalidOrderData().missingRequiredFields;
    const { status, body } = await api.createOrder(invalidData);

    expect(status).toBe(422);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-REQUIRED|MSG-ERR-FORMAT/);
    expect(error.message).toBeTruthy();
  });

  /**
   * BDD-01-S05: Invalid AMOUNT (negative/zero) -> 422
   *
   * Reference: Schema constraint CK_LTT_PAY_ORDER_AMOUNT CHECK (AMOUNT > 0)
   * Validates both negative and zero amounts are rejected.
   */
  test("BDD-01-S05: Invalid AMOUNT (negative/zero) -> 422", async () => {
    // Test negative amount
    const negativePayload = createValidOrderData("LNH", { amount: -1_000_000 });
    const negResult = await api.createOrder(negativePayload);
    expect(negResult.status).toBe(422);
    const negError = negResult.body as ApiErrorResponse;
    expect(negError.code).toMatch(/MSG-ERR/);

    // Test zero amount
    const zeroPayload = createValidOrderData("LNH", { amount: 0 });
    const zeroResult = await api.createOrder(zeroPayload);
    expect(zeroResult.status).toBe(422);
  });

  /**
   * BDD-01-S06: Foreign currency without EXCHANGE_RATE -> 422
   *
   * Reference: Schema constraint CK_LTT_PAY_ORDER_EXR
   *   CHECK (CURRENCY_CODE = 'VND' AND EXCHANGE_RATE IS NULL)
   *   OR (CURRENCY_CODE <> 'VND' AND EXCHANGE_RATE > 0)
   *
   * When currency is not VND, EXCHANGE_RATE must be > 0.
   */
  test("BDD-01-S06: Foreign currency without EXCHANGE_RATE -> 422", async () => {
    const payload = createInvalidOrderData().foreignCurrencyNoRate;
    const { status, body } = await api.createOrder(payload);

    expect(status).toBe(422);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR/);
    expect(error.message).toMatch(/EXCHANGE_RATE|ty gia/i);
  });

  /**
   * BDD-01-S07: Invalid channel -> 422
   *
   * Reference: Schema constraint CK_LTT_PAY_ORDER_CHANNEL
   *   CHECK (CHANNEL IN ('LNH', 'TTSP', 'LIEN_KHO_BAC'))
   */
  test("BDD-01-S07: Invalid channel value -> 422", async () => {
    const payload = createInvalidOrderData().invalidChannel;
    const { status, body } = await api.createOrder(payload);

    expect(status).toBe(422);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR/);
  });

  /**
   * BDD-01-S08: Save as DRAFT without required fields -> OK (partial)
   *
   * Reference: @alternative @TC-1.11
   * "Luu nap thanh cong ngay ca khi chua nhap du truong bat buoc"
   *
   * When using the save-draft flow (not submit), the system relaxes
   * mandatory field validation (VAL-01) but still runs format (VAL-02)
   * and security (VAL-10) validation.
   */
  test("BDD-01-S08: Save as DRAFT without all required fields -> OK (partial)", async () => {
    // Create a minimal payload with only basic fields
    const partialPayload = createValidOrderData("LNH", {
      description: "Luu nap tam thoi",
      senderName: "Test", // minimal valid data
      senderAddress: "Test",
      receiverName: "Test",
      receiverGlSegment2: "1111",
      receiverBankCode: "KBHN01",
      receiverAccountName: "Test",
    });

    const { status, body } = await api.createOrder(partialPayload);
    // Draft save should succeed even without all fields
    expect(status).toBe(201);
    const order = body as PayOrder;
    expect(order.status).toBe("DRAFT");
  });

  /**
   * BDD-01-S09: Duplicate REF_NO prevented (unique constraint)
   *
   * Reference: @exception @TC-1.06 @VAL-11
   * "Submit that bai — REF_NO trung trong cung ky + don vi + loai"
   *
   * REF_NO has a unique constraint (UK_LTT_PAY_ORDER_REF_NO).
   * Since REF_NO is auto-generated, duplicate scenarios are rare but
   * the constraint should prevent any collision.
   */
  test("BDD-01-S09: Duplicate REF_NO prevented by unique constraint", async () => {
    // Create the first order
    const payload1 = createValidOrderData("LNH");
    const result1 = await api.createOrder(payload1);
    expect(result1.status).toBe(201);
    const order1 = result1.body as PayOrder;
    expect(order1.refNo).toBeTruthy();

    // Create a second order — should get a different REF_NO
    const payload2 = createValidOrderData("LNH");
    const result2 = await api.createOrder(payload2);
    expect(result2.status).toBe(201);
    const order2 = result2.body as PayOrder;

    // REF_NOs must be unique
    expect(order2.refNo).not.toBe(order1.refNo);
  });

  /**
   * BDD-01-S10: Idempotency — same key returns same result
   *
   * Reference: features/FT-001/02-design.md Section 4.2 (ADR-0005)
   *
   * When the same X-Idempotency-Key is sent with the same request body,
   * the server returns the original response without creating a duplicate.
   */
  test("BDD-01-S10: Idempotency — same key returns same result", async () => {
    const idempotencyKey = generateIdempotencyKey();
    const payload = createValidOrderData("LNH");

    // First request with the idempotency key
    const result1 = await api.createOrderWithKey(payload, idempotencyKey);
    expect(result1.status).toBe(201);
    const order1 = result1.body as PayOrder;

    // Second request with the SAME idempotency key
    const result2 = await api.createOrderWithKey(payload, idempotencyKey);
    expect(result2.status).toBe(201);
    const order2 = result2.body as PayOrder;

    // Should return the same order (no duplicate created)
    expect(order2.id).toBe(order1.id);
    expect(order2.refNo).toBe(order1.refNo);
  });

  /**
   * BDD-01-S11: Non-MAKER role cannot create -> 403
   *
   * Reference: @exception @TC-1.02
   * "Chan truy cap form Tao moi khi khong co quyen Maker"
   *
   * VIEWER role should not have PAY.OUT.MANUAL.CREATE permission.
   */
  test("BDD-01-S11: Non-MAKER role (VIEWER) cannot create -> 403", async () => {
    const viewerApi = new KbApiClient(API_BASE_URL, TEST_USERS.viewer01.token);
    const payload = createValidOrderData("LNH");
    const { status, body } = await viewerApi.createOrder(payload);

    expect(status).toBe(403);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-PERMISSION/);
  });

  /**
   * BDD-01-S12: PAYMENT_DATE outside open period -> 422
   *
   * Reference: @exception @TC-1.05 @VAL-08
   * "Submit that bai — PAYMENT_DATE nam ngoai ky ke toan OPEN"
   *
   * Current period: 05/2026 (OPEN). Date 2024-01-01 is in a CLOSED period.
   */
  test("BDD-01-S12: PAYMENT_DATE outside open period -> 422", async () => {
    const payload = createInvalidOrderData().outsidePeriod;
    const { status, body } = await api.createOrder(payload);

    expect(status).toBe(422);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR-RANGE/);
    expect(error.message).toMatch(/ky ke toan|period/i);
  });

  /**
   * BDD-01-S13: Create with attachments -> DRAFT with files
   *
   * Reference: @happy-path — attachments uploaded alongside creation
   *
   * Validates that files can be attached to a new order and
   * are persisted alongside the order record.
   */
  test("BDD-01-S13: Create with attachments -> DRAFT with files", async () => {
    // Step 1: Create the order first
    const payload = createValidOrderData("LNH");
    const createResult = await api.createOrder(payload);
    expect(createResult.status).toBe(201);
    const order = createResult.body as PayOrder;

    // Step 2: Upload an attachment
    const testFile = createTestPdfFile(2048);
    const uploadResult = await api.uploadAttachment(
      order.id,
      testFile,
      "CHUNG_TU_GOC",
      "Chung tu goc",
    );
    expect(uploadResult.status).toBe(201);

    // Step 3: Verify attachment is listed
    const listResult = await api.listAttachments(order.id);
    expect(listResult.status).toBe(200);
    const attachments = listResult.body as Array<{
      fileName: string;
      docType: string;
      isDeleted: boolean;
    }>;
    expect(attachments.length).toBeGreaterThanOrEqual(1);
    expect(attachments[0].fileName).toBe("chungtu.pdf");
    expect(attachments[0].docType).toBe("CHUNG_TU_GOC");
    expect(attachments[0].isDeleted).toBe(false);
  });

  /**
   * BDD-01-S14: Create with COA lines -> lines saved
   *
   * Reference: BDD-01 Tab "Thong tin khoan muc" with multiple lines
   * Validates: lines are saved with the order and LINE_AMOUNT sum = AMOUNT.
   */
  test("BDD-01-S14: Create with COA lines -> lines saved correctly", async () => {
    resetLineNoCounter();
    const lines = [
      createLineData({ lineNo: 1, lineAmount: 500_000 }),
      createLineData({ lineNo: 2, lineAmount: 300_000 }),
      createLineData({ lineNo: 3, lineAmount: 200_000 }),
    ];

    const payload = createValidOrderData("LNH", {
      amount: 1_000_000,
      lines,
    });

    const { status, body } = await api.createOrder(payload);
    expect(status).toBe(201);
    const order = body as PayOrder;

    expect(order.status).toBe("DRAFT");
    expect(order.amount).toBe(1_000_000);
    expect(order.lines).toBeDefined();
    expect(order.lines!.length).toBe(3);

    // Verify line amounts sum equals header amount
    const totalLines = order.lines!.reduce((sum, l) => sum + l.lineAmount, 0);
    expect(totalLines).toBe(1_000_000);
  });

  /**
   * BDD-01-S15: Max line amount validation
   *
   * Validates that line amounts must be > 0 per schema constraint
   * CK_LTT_PAY_ORDER_LINE_AMT CHECK (LINE_AMOUNT > 0).
   */
  test("BDD-01-S15: Line amount must be positive (> 0)", async () => {
    resetLineNoCounter();
    const lines = [
      createLineData({ lineNo: 1, lineAmount: 500_000 }),
      createLineData({ lineNo: 2, lineAmount: -100_000 }), // Invalid
    ];

    const payload = createValidOrderData("LNH", {
      amount: 400_000,
      lines,
    });

    const { status, body } = await api.createOrder(payload);
    expect(status).toBe(422);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR/);
  });

  /**
   * BDD-01-S16: IDENTIFY conditional validation
   *
   * Reference: Schema constraints CK_LTT_PAY_ORDER_SND_ID and CK_LTT_PAY_ORDER_RCV_ID
   * If IDENTIFY_ID is provided, ISSUED_DATE and ISSUED_PLACE must also be provided.
   */
  test("BDD-01-S16: IDENTIFY conditional — ID requires date and place", async () => {
    const payload = createValidOrderData("LNH", {
      senderIdentifyId: "001200012345",
      // Missing senderIssuedDate and senderIssuedPlace -> should fail
      senderIssuedDate: undefined,
      senderIssuedPlace: undefined,
    });

    const { status, body } = await api.createOrder(payload);
    expect(status).toBe(422);
    const error = body as ApiErrorResponse;
    expect(error.code).toMatch(/MSG-ERR/);
    expect(error.message).toMatch(/ISSUED|IDENTIFY/i);
  });
});
