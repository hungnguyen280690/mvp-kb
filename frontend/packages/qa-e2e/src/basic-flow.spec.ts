import { test, expect } from "@playwright/test";

test.describe("MARBO Basic Flow", () => {
  test("should load the homepage", async ({ page }) => {
    // Go to the base URL defined in playwright.config.ts
    await page.goto("/");

    // Check if the page title is correct (or any element that should be present)
    // Adjust this to match your actual UI content
    await expect(page).toHaveTitle(/MARBO/i);

    // Check if the root element exists
    const root = page.locator("#root");
    await expect(root).toBeVisible();
  });

  test("should show login screen if not authenticated", async ({ page }) => {
    await page.goto("/");

    // Example: check for a login button or heading
    // const loginHeading = page.getByRole('heading', { name: /Đăng nhập/i });
    // await expect(loginHeading).toBeVisible();
  });
});
