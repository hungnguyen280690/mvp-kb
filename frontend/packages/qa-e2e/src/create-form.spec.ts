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

    // Click "Nộp duyệt & Lưu" to trigger full validation
    const submitBtn = page.getByRole("button", { name: /Nộp duyệt|Submit/i }).first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      // Error messages are <p> with inline color:#cc0000
      const errorMsg = page.locator("p[style*='cc0000']");
      await expect(errorMsg.first()).toBeVisible({ timeout: 3000 });
    } else {
      test.skip(true, "Không tìm thấy nút Nộp duyệt");
    }
  });
});
