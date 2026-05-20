import { test, expect } from "@playwright/test";
import { setDevUser, MAKER_CTX } from "./helpers/auth";

test.describe("TC-E2E: Create Form", () => {
  test.beforeEach(async ({ page }) => {
    await setDevUser(page, MAKER_CTX);
  });

  test("TC-E2E-05: navigate đến form tạo mới thành công", async ({ page }) => {
    await page.goto("/ltt/pay-out-manual/new");
    // Form phải render — tìm bất kỳ field input nào
    await expect(
      page.locator("input, select, textarea, form").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("TC-E2E-06: submit form rỗng hiển thị lỗi validation", async ({ page }) => {
    await page.goto("/ltt/pay-out-manual/new");
    await expect(page.locator("input, select, textarea").first()).toBeVisible({ timeout: 10000 });

    // "Lưu & Nộp" triggers full Zod validation — errors say "bắt buộc"
    const submitBtn = page.getByRole("button", { name: /Lưu.*Nộp|Nộp.*duyệt|Submit/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();
    // Zod error messages contain "bắt buộc" (e.g. "Nội dung bắt buộc")
    await expect(page.getByText(/bắt buộc/i).first()).toBeVisible({ timeout: 3000 });
  });
});
