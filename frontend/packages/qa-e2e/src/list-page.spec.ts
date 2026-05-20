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
    // Wait for filter panel to render
    const draftCheckbox = page.getByRole("checkbox", { name: "Nháp" });
    await expect(draftCheckbox).toBeVisible({ timeout: 8000 });
    await draftCheckbox.check();
    await page.getByRole("button", { name: "Tìm kiếm" }).click();
    await page.waitForTimeout(1000);
    // "Từ chối" status badge (span) must not appear in table rows
    await expect(page.locator("table span").filter({ hasText: /^Từ chối$/ })).toHaveCount(0);
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
