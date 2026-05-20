import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for @kb/qa-e2e — FT-001 PAY.OUT.MANUAL E2E tests.
 *
 * Project structure:
 *   - setup: Authenticates test users (MAKER, CHECKER, APPROVER, VIEWER)
 *   - create-order: BDD-01 tests (MAKER role)
 *   - edit-order: BDD-02 tests (MAKER role)
 *   - approve-order: BDD-03 tests (MAKER, CHECKER, APPROVER roles)
 *   - list-order: BDD-04 tests (VIEWER role)
 *   - delete-order: BDD-05 tests (MAKER role)
 *   - copy-order: BDD-07 tests (MAKER role)
 *
 * All test suites depend on the "setup" project for authentication.
 */
export default defineConfig({
  testDir: "./src",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // ========================================================================
    // Setup: Authenticate test users and store auth state
    // ========================================================================
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    // ========================================================================
    // Test suites — each depends on "setup"
    // ========================================================================

    // BDD-01: Create order tests (MAKER role)
    {
      name: "create-order",
      testMatch: /create-order\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/maker01.json",
      },
    },

    // BDD-02: Edit order tests (MAKER role)
    {
      name: "edit-order",
      testMatch: /edit-order\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/maker01.json",
      },
    },

    // BDD-03: Approval workflow tests (CHECKER role primary)
    {
      name: "approve-order",
      testMatch: /approve-order\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/maker01.json",
      },
    },

    // BDD-04: List/filter/search tests (VIEWER role)
    {
      name: "list-order",
      testMatch: /list-order\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/viewer01.json",
      },
    },

    // BDD-05: Delete order tests (MAKER role)
    {
      name: "delete-order",
      testMatch: /delete-order\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/maker01.json",
      },
    },

    // BDD-07: Copy order tests (MAKER role)
    {
      name: "copy-order",
      testMatch: /copy-order\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/maker01.json",
      },
    },
  ],
});
