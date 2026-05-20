import { test, expect } from "@playwright/test";

test.describe("VDBAS Basic Flow", () => {
  test("should load the shell homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/VDBAS/i);
    const root = page.locator("#root");
    await expect(root).toBeVisible();
  });

  test("should load the LTT module at /ltt/", async ({ page }) => {
    await page.goto("/ltt/");
    await expect(page).toHaveTitle(/Lệnh Thanh Toán|VDBAS/i);
    const root = page.locator("#root");
    await expect(root).toBeVisible();
  });

  test("should redirect /ltt/ to pay-out-manual list", async ({ page }) => {
    await page.goto("/ltt/");
    await page.waitForURL(/pay-out-manual/, { timeout: 5000 });
    expect(page.url()).toContain("pay-out-manual");
  });
});
