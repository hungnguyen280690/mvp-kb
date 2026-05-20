/**
 * @kb/qa-e2e/helpers/test-data
 *
 * Factory functions for generating test data for FT-001 PAY.OUT.MANUAL E2E tests.
 * Uses realistic Vietnamese names, addresses, and KBNN domain data.
 *
 * References:
 *   - features/FT-001/bdd-01-create.md (BDD-01)
 *   - features/FT-001/03-schema.sql (DB constraints)
 *   - features/FT-001/02-design.md (API contracts)
 */

import { v4 as uuidv4 } from "uuid";
import {
  type Channel,
  type CreatePayOrderPayload,
  type CoaLine,
  type UpdatePayOrderPayload,
  type DeletePayOrderPayload,
  type ReturnRejectPayload,
  type CcidValidationRequest,
  type DocType,
} from "./api-client";

// ---------------------------------------------------------------------------
// Environment config
// ---------------------------------------------------------------------------

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";

export { API_BASE_URL };

// ---------------------------------------------------------------------------
// Test Users (roles)
// ---------------------------------------------------------------------------

export interface TestUser {
  username: string;
  userId: string;
  role: "MAKER" | "CHECKER" | "APPROVER" | "VIEWER";
  kbnnId: string;
  token: string;
}

/**
 * Test user tokens — these should match the auth.setup.ts stored states.
 * In CI, tokens are injected via environment variables.
 */
export const TEST_USERS: Record<string, TestUser> = {
  maker01: {
    username: "maker01",
    userId: "usr-maker01-0000-0000-000000000001",
    role: "MAKER",
    kbnnId: "70001",
    token: process.env.TEST_TOKEN_MAKER || "",
  },
  maker02: {
    username: "maker02",
    userId: "usr-maker02-0000-0000-000000000002",
    role: "MAKER",
    kbnnId: "70001",
    token: process.env.TEST_TOKEN_MAKER2 || "",
  },
  checker01: {
    username: "checker01",
    userId: "usr-checker01-0000-0000-000000000003",
    role: "CHECKER",
    kbnnId: "70001",
    token: process.env.TEST_TOKEN_CHECKER || "",
  },
  approver01: {
    username: "approver01",
    userId: "usr-approver01-0000-0000-000000000004",
    role: "APPROVER",
    kbnnId: "70001",
    token: process.env.TEST_TOKEN_APPROVER || "",
  },
  viewer01: {
    username: "viewer01",
    userId: "usr-viewer01-0000-0000-000000000005",
    role: "VIEWER",
    kbnnId: "70001",
    token: process.env.TEST_TOKEN_VIEWER || "",
  },
};

/** Get auth token for a given role */
export function getTokenForRole(
  role: "MAKER" | "CHECKER" | "APPROVER" | "VIEWER",
): string {
  const mapping: Record<string, string> = {
    MAKER: TEST_USERS.maker01.token,
    CHECKER: TEST_USERS.checker01.token,
    APPROVER: TEST_USERS.approver01.token,
    VIEWER: TEST_USERS.viewer01.token,
  };
  return mapping[role];
}

// ---------------------------------------------------------------------------
// COA Line factory
// ---------------------------------------------------------------------------

let lineNoCounter = 1;

/**
 * Create a valid COA line for testing.
 * Uses realistic segment values matching LOV.07 categories.
 */
export function createLineData(
  overrides?: Partial<CoaLine> & { lineAmount?: number },
): CoaLine {
  const lineNo = overrides?.lineNo ?? lineNoCounter++;
  return {
    lineNo,
    glSegment1: "01", // Ma quy — default
    glSegment2: "1121", // TK tu nhien — tai khoan tien gui
    glSegment3: "1234567", // DVQHNS
    glSegment4: "1", // Cap NS
    glSegment5: "024", // Chuong
    glSegment6: "011", // Nganh KT
    glSegment7: "5111", // NDKT
    glSegment8: "00000", // DB
    glSegment9: "00000", // CTMT
    glSegment10: "00", // MN
    glSegment11: "7001", // Kho bac
    glSegment12: "000", // DP
    ccidKey: undefined,
    lineDescription: `Khoan muc chi tieu dong ${lineNo}`,
    lineAmount: overrides?.lineAmount ?? 1_000_000,
    ...overrides,
  };
}

/** Reset line number counter (useful between tests) */
export function resetLineNoCounter(): void {
  lineNoCounter = 1;
}

// ---------------------------------------------------------------------------
// Pay Order factory — Valid data
// ---------------------------------------------------------------------------

/**
 * Create valid order data for testing the CREATE endpoint.
 * Matches LTT_PAY_ORDER constraints and BDD-01 Scenario S01.
 *
 * @param channel - LNH | TTSP | LIEN_KHO_BAC
 * @param overrides - Partial overrides for customization
 */
export function createValidOrderData(
  channel: Channel = "LNH",
  overrides?: Partial<CreatePayOrderPayload>,
): CreatePayOrderPayload {
  resetLineNoCounter();

  const lines: CoaLine[] = [createLineData({ lineAmount: 1_000_000 })];

  const basePayload: CreatePayOrderPayload = {
    channel,
    orderType: channel === "LIEN_KHO_BAC" ? undefined : "LENH_CHUYEN_KHOAN",
    lnhTransactionType: channel === "LNH" ? "LTT01" : undefined,
    sender: "NH001-CN-HANOI",
    receiver: "NH002-CN-HCM",
    paymentDate: "2026-05-19",
    amount: 1_000_000,
    currencyCode: "VND",
    description: "Thanh toan chi thuong xuyen thang 5",
    // Tab B1.3: Sender info
    senderName: "Nguyen Van Thanh",
    senderAddress: "So 12, Pho Nguyen Trai, Quan Thanh Xuan, Ha Noi",
    senderGlSegment2: "1121",
    senderBankCode: "KBHN01",
    // Tab B1.4: Receiver info
    receiverName: "Tran Thi Mai",
    receiverAddress: "456 Nguyen Hue, Quan 1, TP Ho Chi Minh",
    receiverGlSegment2: "3111",
    receiverBankCode: "KBHCM01",
    receiverAccountName: "CONG TY TNHH ABC",
    kbnnId: "70001",
    lines,
    ...overrides,
  };

  // Channel-specific adjustments
  if (channel === "TTSP") {
    basePayload.orderType = "LENH_CHUYEN_KHOAN";
    basePayload.originNum = "CT-ORIG-2026-001";
    basePayload.transactionDate = "2026-05-19";
    basePayload.lnhTransactionType = undefined;
  }

  if (channel === "LIEN_KHO_BAC") {
    basePayload.orderType = undefined;
    basePayload.lnhTransactionType = undefined;
  }

  return basePayload;
}

/**
 * Create valid order data with foreign currency (USD).
 * EXCHANGE_RATE is required when currency != VND (schema constraint).
 */
export function createForeignCurrencyOrderData(): CreatePayOrderPayload {
  return createValidOrderData("LNH", {
    currencyCode: "USD",
    exchangeRate: 25_450,
    fnCode1: "USD",
    fnCode2: "VND",
    fnAmount: 50_000,
    amount: 1_272_500_000,
  });
}

// ---------------------------------------------------------------------------
// Pay Order factory — Invalid data for validation tests
// ---------------------------------------------------------------------------

/**
 * Generate a set of invalid order payloads for validation testing.
 * Each key maps to a specific validation rule (VAL-01 through VAL-11).
 */
export function createInvalidOrderData(): Record<
  string,
  CreatePayOrderPayload
> {
  const valid = createValidOrderData();

  return {
    /** VAL-01: Required field REF_NO missing (empty description as proxy) */
    missingRequiredFields: {
      ...valid,
      description: "",
      senderName: "",
      senderAddress: "",
      receiverName: "",
    },

    /** VAL-02: Invalid date format */
    invalidDateFormat: {
      ...valid,
      paymentDate: "32/13/2025",
    },

    /** VAL-07: Negative amount */
    negativeAmount: {
      ...valid,
      amount: -1_000_000,
    },

    /** VAL-07: Zero amount */
    zeroAmount: {
      ...valid,
      amount: 0,
    },

    /** VAL-08: Payment date outside open period */
    outsidePeriod: {
      ...valid,
      paymentDate: "2024-01-01",
    },

    /** VAL-09: Invalid channel value */
    invalidChannel: {
      ...valid,
      channel: "INVALID_CHANNEL" as Channel,
    },

    /** Foreign currency without exchange rate */
    foreignCurrencyNoRate: {
      ...valid,
      currencyCode: "USD",
      exchangeRate: undefined,
    },

    /** VAL-11: Duplicate ref_no (set manually) */
    // Note: REF_NO is auto-generated, this tests the unique constraint
    duplicateRefNo: {
      ...valid,
    },

    /** VAL-10: XSS in description */
    xssDescription: {
      ...valid,
      description: "<script>alert('xss')</script>Thanh toan",
    },
  };
}

// ---------------------------------------------------------------------------
// Edit payload factory
// ---------------------------------------------------------------------------

/**
 * Create a valid update payload for testing the PUT endpoint.
 */
export function createValidEditPayload(
  currentVersion: number,
  overrides?: Partial<UpdatePayOrderPayload>,
): UpdatePayOrderPayload {
  return {
    version: currentVersion,
    description: "Thanh toan cap nhat lan 2",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Delete payload factory
// ---------------------------------------------------------------------------

/**
 * Create a valid delete payload with reason 10-500 chars.
 */
export function createValidDeletePayload(
  reason?: string,
): DeletePayOrderPayload {
  return {
    deleteReason: reason || "Lenh nhap sai so tai khoan, can huy",
    confirmed: true,
  };
}

/**
 * Create invalid delete payloads for validation testing.
 */
export function createInvalidDeletePayloads(): Record<
  string,
  DeletePayOrderPayload
> {
  return {
    /** VAL-16: Reason too short (< 10 chars) */
    shortReason: {
      deleteReason: "abc",
      confirmed: true,
    },

    /** VAL-16: Reason empty */
    emptyReason: {
      deleteReason: "",
      confirmed: true,
    },

    /** VAL-16: Reason too long (> 500 chars) */
    longReason: {
      deleteReason: "A".repeat(501),
      confirmed: true,
    },

    /** VAL-16: Not confirmed */
    notConfirmed: {
      deleteReason: "Ly do hop le tren 10 ky tu",
      confirmed: false,
    },
  };
}

// ---------------------------------------------------------------------------
// Return/Reject payload factory
// ---------------------------------------------------------------------------

/**
 * Create a valid return/reject reason payload.
 * BIZ-006: reason length between 10 and 500 chars.
 */
export function createValidReason(reason?: string): ReturnRejectPayload {
  return {
    reason: reason || "Thieu chung tu hop dong, vui long bo sung va submit lai",
  };
}

/**
 * Create invalid reason payloads for BIZ-006 validation testing.
 */
export function createInvalidReasons(): Record<string, ReturnRejectPayload> {
  return {
    /** < 10 chars */
    shortReason: { reason: "abc" },

    /** Empty */
    emptyReason: { reason: "" },

    /** > 500 chars */
    longReason: { reason: "A".repeat(501) },
  };
}

// ---------------------------------------------------------------------------
// CCID validation request factory
// ---------------------------------------------------------------------------

/**
 * Create a CCID validation request with valid segments.
 */
export function createValidCcidRequest(): CcidValidationRequest {
  return {
    lines: [
      {
        glSegment1: "01",
        glSegment2: "1121",
        glSegment3: "1234567",
        glSegment4: "1",
        glSegment5: "024",
        glSegment6: "011",
        glSegment7: "5111",
      },
    ],
  };
}

/**
 * Create a CCID validation request with invalid segment combination.
 */
export function createInvalidCcidRequest(): CcidValidationRequest {
  return {
    lines: [
      {
        glSegment1: "01",
        glSegment2: "9999", // Invalid TK tu nhien
        glSegment3: "9999999", // Invalid DVQHNS
        glSegment4: "9",
        glSegment5: "999",
        glSegment6: "999",
        glSegment7: "9999",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Attachment factory (for FormData construction)
// ---------------------------------------------------------------------------

/**
 * Create a minimal valid PDF file for attachment upload testing.
 */
export function createTestPdfFile(sizeBytes: number = 1024): File {
  const content = new Uint8Array(Math.min(sizeBytes, 1024));
  content.fill(0x25); // % character (PDF header starts with %PDF)
  return new File([content], "chungtu.pdf", { type: "application/pdf" });
}

/**
 * Create a test file exceeding 10MB limit (VAL-09).
 */
export function createOversizedFile(): File {
  // 15MB — exceeds the 10MB (10_485_760 bytes) limit
  const content = new Uint8Array(15 * 1024 * 1024);
  content.fill(0x41);
  return new File([content], "large-file.pdf", { type: "application/pdf" });
}

/**
 * Create a test file with disallowed extension.
 */
export function createExecutableFile(): File {
  const content = new Uint8Array(256);
  content.fill(0x00);
  return new File([content], "malware.exe", {
    type: "application/x-msdownload",
  });
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Generate a new UUID v4 */
export function generateId(): string {
  return uuidv4();
}

/** Generate a deterministic idempotency key for testing */
export function generateIdempotencyKey(): string {
  return uuidv4();
}

/** Format a date as dd/MM/yyyy */
export function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Format a date as ISO date string YYYY-MM-DD */
export function formatIsoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Vietnamese test data constants */
export const VN_TEST_DATA = {
  senderNames: [
    "Nguyen Van Thanh",
    "Tran Duc Minh",
    "Le Thi Huong",
    "Pham Quang Huy",
    "Vo Minh Tuan",
  ],
  receiverNames: [
    "Cong Ty TNHH ABC",
    "Ngan Hang Nha Nuoc CN Ha Noi",
    "Kho Bac Nha Nuoc TP HCM",
    "Cuc Thuế Quan 1",
    "Buu chinh Viet Nam",
  ],
  addresses: [
    "So 12, Pho Nguyen Trai, Quan Thanh Xuan, Ha Noi",
    "456 Nguyen Hue, Quan 1, TP Ho Chi Minh",
    "78 Dien Bien Phu, Ba Dinh, Ha Noi",
    "Le Loi, Quan Hai Chau, Da Nang",
    "23 Thang 2, TP Buon Ma Thuot, Dak Lak",
  ],
  bankCodes: ["KBHN01", "KBHCM01", "KBDN01", "KBHP01", "KBCT01"],
  descriptions: [
    "Thanh toan chi thuong xuyen thang 5",
    "Chi cong tac phi quyet toan nam 2026",
    "Hoan ung kinh phi du an xay dung",
    "Chi tro cap bao hiem xa hoi",
    "Thanh toan tien su dung dat cong",
  ],
} as const;
