import { test, expect } from "@playwright/test";
import { setDevUser, MAKER_CTX, createDraftViaApi } from "./helpers/auth";

test.describe("TC-E2E: Workflow — Submit", () => {
  test("TC-E2E-07: tạo DRAFT qua API, mở detail, nộp duyệt → READY_FOR_APPROVAL", async ({
    page,
    request,
  }) => {
    const orderId = await createDraftViaApi(request);
    expect(orderId).toBeTruthy();

    await setDevUser(page, MAKER_CTX);
    await page.goto(`/ltt/pay-out-manual/${orderId}`);

    // Wait for status badge "Nháp"
    await expect(page.getByText("Nháp").first()).toBeVisible({ timeout: 10000 });

    // Click "Nộp duyệt" action button
    const submitBtn = page.getByRole("button", { name: "Nộp duyệt" });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();

    // Confirm in dialog — button label is "Nộp duyệt"
    await page.locator('[role="dialog"]').getByRole("button", { name: "Nộp duyệt" }).click();

    // Status should change to "Chờ KT"
    await expect(page.getByText("Chờ KT").first()).toBeVisible({ timeout: 8000 });
  });
});
