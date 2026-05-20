import { test, expect } from "@playwright/test";
import {
  setDevUser,
  CHECKER_CTX,
  APPROVER_CTX,
  createDraftViaApi,
  submitViaApi,
  checkApproveViaApi,
} from "./helpers/auth";

test.describe("TC-E2E: Workflow — Approve", () => {
  test("TC-E2E-08: CheckApprove → PENDING_APPROVER", async ({ page, request }) => {
    const orderId = await createDraftViaApi(request);
    await submitViaApi(request, orderId);

    await setDevUser(page, CHECKER_CTX);
    await page.goto(`/ltt/pay-out-manual/${orderId}`);

    await expect(page.getByText("Chờ KT").first()).toBeVisible({ timeout: 10000 });

    // Action button is "Kiểm duyệt"
    const checkBtn = page.getByRole("button", { name: "Kiểm duyệt" });
    await expect(checkBtn).toBeVisible({ timeout: 5000 });
    await checkBtn.click();

    // Confirm dialog button label is "Kiểm tra"
    await page.locator('[role="dialog"]').getByRole("button", { name: "Kiểm tra" }).click();

    await expect(page.getByText("Chờ KD").first()).toBeVisible({ timeout: 8000 });
  });

  test("TC-E2E-09: Approve → APPROVED", async ({ page, request }) => {
    const orderId = await createDraftViaApi(request);
    await submitViaApi(request, orderId);
    await checkApproveViaApi(request, orderId);

    await setDevUser(page, APPROVER_CTX);
    await page.goto(`/ltt/pay-out-manual/${orderId}`);

    await expect(page.getByText("Chờ KD").first()).toBeVisible({ timeout: 10000 });

    const approveBtn = page.getByRole("button", { name: "Phê duyệt" });
    await expect(approveBtn).toBeVisible({ timeout: 5000 });
    await approveBtn.click();

    // Confirm dialog button label is "Phê duyệt"
    await page.locator('[role="dialog"]').getByRole("button", { name: "Phê duyệt" }).click();

    await expect(page.getByText("Đã duyệt").first()).toBeVisible({ timeout: 8000 });
  });
});
