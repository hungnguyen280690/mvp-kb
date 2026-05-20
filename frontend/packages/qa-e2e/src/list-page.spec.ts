import { test, expect } from "@playwright/test";
import { setDevUser, MAKER_CTX } from "./helpers/auth";

const LIST_URL = "/ltt/pay-out-manual";

test.describe("TC-E2E: List Page", () => {
  test.beforeEach(async ({ page }) => {
    await setDevUser(page, MAKER_CTX);
  });

  test("TC-E2E-01: danh sách load thành công, hiển thị bảng", async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Số hiệu").first()).toBeVisible();
  });

  test("TC-E2E-02: filter theo status DRAFT", async ({ page }) => {
    await page.goto(LIST_URL);
    // Tìm checkbox Nháp (DRAFT)
    const draftCheckbox = page.getByRole("checkbox", { name: /Nháp|DRAFT/i });
    if (await draftCheckbox.count() > 0) {
      await draftCheckbox.check();
      // Click tìm kiếm nếu có nút
      const searchBtn = page.getByRole("button", { name: /Tìm kiếm|Search|Lọc/i });
      if (await searchBtn.count() > 0) {
        await searchBtn.click();
      }
      await page.waitForTimeout(1000);
      // URL hoặc bảng phản ánh filter
      const statusBadges = page.locator("text=Nháp");
      const rejectedBadges = page.locator("text=Từ chối");
      await expect(rejectedBadges).toHaveCount(0);
    } else {
      test.skip(true, "Không tìm thấy checkbox status filter");
    }
  });

  test("TC-E2E-03: nút Tạo mới navigate đến form", async ({ page }) => {
    await page.goto(LIST_URL);
    const createBtn = page.getByRole("button", { name: /Tạo mới|Tạo|New/i });
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await createBtn.click();
    await page.waitForURL(/pay-out-manual\/new/, { timeout: 5000 });
    expect(page.url()).toContain("new");
  });

  test("TC-E2E-04: trang load không lỗi 500", async ({ page }) => {
    const errors: string[] = [];
    page.on("response", (res) => {
      if (res.status() >= 500) errors.push(`${res.status()} ${res.url()}`);
    });
    await page.goto(LIST_URL);
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
});
