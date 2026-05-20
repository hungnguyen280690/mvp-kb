/**
 * @kb/qa-e2e auth.setup.ts
 *
 * Playwright setup project that authenticates all test users
 * and stores their auth state for reuse in test suites.
 *
 * This file runs as a "setup" project before any test suites.
 * Authenticated states are stored in .auth/ directory.
 *
 * Usage in playwright.config.ts:
 *   {
 *     name: 'setup',
 *     testMatch: /auth\.setup\.ts/,
 *   },
 *   {
 *     name: 'create-order',
 *     testMatch: /create-order\.spec\.ts/,
 *     dependencies: ['setup'],
 *     use: { storageState: '.auth/maker01.json' },
 *   }
 */

import { test as setup, expect } from "@playwright/test";
import {
  AUTH_STATES,
  loginUser,
  authenticateViaApi,
  saveAuthState,
} from "./helpers/auth.setup";

const authFile = ".auth";

// Ensure we have unique storage state files per role
const STATE_FILES = {
  maker: `${authFile}/maker01.json`,
  checker: `${authFile}/checker01.json`,
  approver: `${authFile}/approver01.json`,
  viewer: `${authFile}/viewer01.json`,
};

/**
 * Setup: Authenticate MAKER user.
 * The MAKER role is the primary actor for create/edit/delete/copy operations.
 */
setup("Authenticate as MAKER (maker01)", async ({ page }) => {
  // Attempt UI login first; fall back to API authentication
  try {
    await loginUser(page, AUTH_STATES[0].user);
  } catch {
    // UI login failed — use direct API auth
    await authenticateViaApi(AUTH_STATES[0].user);
    // Set token in localStorage manually so Playwright can capture it
    await page.goto("/");
    await page.evaluate((token) => {
      localStorage.setItem("access_token", token);
    }, AUTH_STATES[0].user.token);
  }

  // Verify authentication succeeded
  expect(AUTH_STATES[0].user.token).toBeTruthy();

  // Save storage state for reuse
  await page.context().storageState({ path: STATE_FILES.maker });
});

/**
 * Setup: Authenticate CHECKER user.
 * The CHECKER role approves at level 1 (READY_FOR_APPROVAL -> PENDING_APPROVER).
 */
setup("Authenticate as CHECKER (checker01)", async ({ page }) => {
  try {
    await loginUser(page, AUTH_STATES[1].user);
  } catch {
    await authenticateViaApi(AUTH_STATES[1].user);
    await page.goto("/");
    await page.evaluate((token) => {
      localStorage.setItem("access_token", token);
    }, AUTH_STATES[1].user.token);
  }

  expect(AUTH_STATES[1].user.token).toBeTruthy();
  await page.context().storageState({ path: STATE_FILES.checker });
});

/**
 * Setup: Authenticate APPROVER user.
 * The APPROVER role approves at level 2 (PENDING_APPROVER -> APPROVED).
 */
setup("Authenticate as APPROVER (approver01)", async ({ page }) => {
  try {
    await loginUser(page, AUTH_STATES[2].user);
  } catch {
    await authenticateViaApi(AUTH_STATES[2].user);
    await page.goto("/");
    await page.evaluate((token) => {
      localStorage.setItem("access_token", token);
    }, AUTH_STATES[2].user.token);
  }

  expect(AUTH_STATES[2].user.token).toBeTruthy();
  await page.context().storageState({ path: STATE_FILES.approver });
});

/**
 * Setup: Authenticate VIEWER user.
 * The VIEWER role has read-only access (list + view details).
 */
setup("Authenticate as VIEWER (viewer01)", async ({ page }) => {
  try {
    await loginUser(page, AUTH_STATES[3].user);
  } catch {
    await authenticateViaApi(AUTH_STATES[3].user);
    await page.goto("/");
    await page.evaluate((token) => {
      localStorage.setItem("access_token", token);
    }, AUTH_STATES[3].user.token);
  }

  expect(AUTH_STATES[3].user.token).toBeTruthy();
  await page.context().storageState({ path: STATE_FILES.viewer });
});
