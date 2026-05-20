import { randomUUID } from "crypto";
import type { Page, APIRequestContext } from "@playwright/test";

export const MAKER_CTX = {
  userId: "user-e2e-maker-01",
  roles: ["PAY_OUT_MAKER"],
  kbnnId: "HN001",
};

export const CHECKER_CTX = {
  userId: "user-e2e-checker-01",
  roles: ["PAY_OUT_CHECKER"],
  kbnnId: "HN001",
};

export const APPROVER_CTX = {
  userId: "user-e2e-approver-01",
  roles: ["PAY_OUT_APPROVER"],
  kbnnId: "HN001",
};

export function devHeaders(ctx: typeof MAKER_CTX) {
  return {
    "X-Dev-User-Id": ctx.userId,
    "X-Dev-Roles": ctx.roles.join(","),
    "X-Dev-Kbnn-Id": ctx.kbnnId,
    "X-Idempotency-Key": randomUUID(),
    "X-Request-Id": randomUUID(),
    "Content-Type": "application/json",
  };
}

export async function setDevUser(page: Page, ctx: typeof MAKER_CTX) {
  await page.addInitScript((u) => {
    localStorage.setItem("kb_dev_user", JSON.stringify(u));
  }, ctx);
}

const BASE_API = "http://localhost:3000/api";

// CCID segment lengths: 2,4,7,1,3,3,4,5,5,2,4,3
export const DRAFT_PAYLOAD = {
  channel: "LNH",
  sender: "HN001",
  receiver: "HN002",
  paymentDate: new Date().toISOString().slice(0, 10),
  currencyCode: "VND",
  description: "E2E test thanh toán",
  senderName: "Kho bạc HN001",
  senderAddress: "1 Tran Hung Dao",
  senderGlSegment2: "1111",
  senderBankCode: "HN001",
  receiverName: "Kho bạc HN002",
  receiverGlSegment2: "ACC001",
  receiverBankCode: "HN002",
  receiverAccountName: "Test Receiver",
  lines: [
    {
      lineNum: 1,
      lineAmount: 1000000,
      lineDescription: "Dong tien test",
      ccidSegment1: "S1",  // max 2
      ccidSegment2: "S2",  // max 4
      ccidSegment3: "S3",  // max 7
      ccidSegment4: "4",   // max 1
      ccidSegment5: "S5",  // max 3
      ccidSegment6: "S6",  // max 3
      ccidSegment7: "S7",  // max 4
      ccidSegment8: "S8",  // max 5
      ccidSegment9: "S9",  // max 5
      ccidSegment10: "10", // max 2
      ccidSegment11: "S11", // max 4
      ccidSegment12: "S12", // max 3
    },
  ],
};

export async function createDraftViaApi(
  request: APIRequestContext,
  ctx = MAKER_CTX,
): Promise<string> {
  const res = await request.post(`${BASE_API}/pay-out-manual`, {
    data: DRAFT_PAYLOAD,
    headers: devHeaders(ctx),
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`createDraftViaApi failed: HTTP ${res.status()} — ${text}`);
  }
  const body = await res.json();
  return body.id as string;
}

export async function submitViaApi(
  request: APIRequestContext,
  id: string,
  ctx = MAKER_CTX,
): Promise<void> {
  const res = await request.post(`${BASE_API}/pay-out-manual/${id}/submit`, {
    data: { comment: "E2E submit" },
    headers: devHeaders(ctx),
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`submitViaApi failed: HTTP ${res.status()} — ${text}`);
  }
}

export async function checkApproveViaApi(
  request: APIRequestContext,
  id: string,
  ctx = CHECKER_CTX,
): Promise<void> {
  const res = await request.post(`${BASE_API}/pay-out-manual/${id}/check-approve`, {
    data: { comment: "E2E check-approve" },
    headers: devHeaders(ctx),
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`checkApproveViaApi failed: HTTP ${res.status()} — ${text}`);
  }
}
