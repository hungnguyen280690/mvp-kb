import { randomUUID } from "crypto";
import { test, expect } from "@playwright/test";
import {
  setDevUser,
  MAKER_CTX,
  CHECKER_CTX,
  devHeaders,
  createDraftViaApi,
  submitViaApi,
} from "./helpers/auth";

const BASE_API = "http://localhost:3000/api";

test.describe("TC-E2E: Workflow — Return", () => {
  test("TC-E2E-10: Checker trả lại → RETURNED_TO_MAKER", async ({ page, request }) => {
    const orderId = await createDraftViaApi(request);
    await submitViaApi(request, orderId);

    await setDevUser(page, CHECKER_CTX);
    await page.goto(`/ltt/pay-out-manual/${orderId}`);

    await expect(page.getByText("Chờ KT").first()).toBeVisible({ timeout: 10000 });

    const returnBtn = page.getByRole("button", { name: "Trả lại" });
    await expect(returnBtn).toBeVisible({ timeout: 5000 });
    await returnBtn.click();

    // ReasonDialog — fill in reason
    const dialog = page.locator('[role="dialog"]');
    await dialog.locator("textarea").fill("Cần bổ sung chứng từ E2E");

    // Confirm button label is "Trả lại"
    await dialog.getByRole("button", { name: "Trả lại" }).click();

    // Status badge (span) should show "Trả lại" — use span to avoid matching buttons
    await expect(page.locator("span").filter({ hasText: /^Trả lại$/ }).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test("TC-E2E-11: Maker chỉnh sửa và nộp lại sau khi bị trả", async ({ page, request }) => {
    const orderId = await createDraftViaApi(request);
    await submitViaApi(request, orderId);

    // Return via API
    const returnRes = await request.post(`${BASE_API}/pay-out-manual/${orderId}/return`, {
      data: { reason: "Thiếu chứng từ E2E" },
      headers: devHeaders(CHECKER_CTX),
    });
    if (!returnRes.ok()) {
      throw new Error(`return failed: HTTP ${returnRes.status()} — ${await returnRes.text()}`);
    }

    await setDevUser(page, MAKER_CTX);
    await page.goto(`/ltt/pay-out-manual/${orderId}`);

    await expect(page.locator("span").filter({ hasText: /^Trả lại$/ }).first()).toBeVisible({
      timeout: 10000,
    });

    // Re-submit
    const submitBtn = page.getByRole("button", { name: "Nộp duyệt" });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();

    await page.locator('[role="dialog"]').getByRole("button", { name: "Nộp duyệt" }).click();

    await expect(page.getByText("Chờ KT").first()).toBeVisible({ timeout: 8000 });
  });

  test("TC-E2E-12: SoD — Maker không được CheckApprove đơn của mình", async ({
    request,
  }) => {
    const orderId = await createDraftViaApi(request, MAKER_CTX);
    await submitViaApi(request, orderId, MAKER_CTX);

    // Maker tries check-approve own order → must get 403
    const res = await request.post(`${BASE_API}/pay-out-manual/${orderId}/check-approve`, {
      data: { comment: "self check" },
      headers: {
        "X-Dev-User-Id": MAKER_CTX.userId,
        "X-Dev-Roles": MAKER_CTX.roles.join(","),
        "X-Dev-Kbnn-Id": MAKER_CTX.kbnnId,
        "X-Idempotency-Key": randomUUID(),
        "Content-Type": "application/json",
      },
    });
    expect(res.status()).toBe(403);
  });
});
