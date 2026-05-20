/**
 * @kb/qa-e2e/helpers/auth.setup
 *
 * Shared authentication setup for Playwright E2E tests.
 * Exports helper functions used by the top-level auth.setup.ts to
 * authenticate test users and store their auth state as Playwright
 * storage state files.
 *
 * This file does NOT define a Playwright project — it provides the
 * reusable login logic that the top-level auth.setup.ts consumes.
 */

import { type Page, type BrowserContext } from "@playwright/test";
import { TEST_USERS, type TestUser } from "./test-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthStateFile {
  user: TestUser;
  storageStatePath: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const AUTH_STATES: AuthStateFile[] = [
  {
    user: TEST_USERS.maker01,
    storageStatePath: ".auth/maker01.json",
  },
  {
    user: TEST_USERS.checker01,
    storageStatePath: ".auth/checker01.json",
  },
  {
    user: TEST_USERS.approver01,
    storageStatePath: ".auth/approver01.json",
  },
  {
    user: TEST_USERS.viewer01,
    storageStatePath: ".auth/viewer01.json",
  },
];

// ---------------------------------------------------------------------------
// Login helper
// ---------------------------------------------------------------------------

/**
 * Authenticate a test user through the SSO login page.
 * Stores cookies + localStorage into the Playwright context's storage state.
 *
 * This is designed for the VDBAS SSO login flow:
 *   1. Navigate to the login page
 *   2. Fill in username/password
 *   3. Submit the form
 *   4. Wait for redirect to the main application
 *   5. Extract the JWT token from localStorage or cookies
 *
 * @param page - Playwright page instance
 * @param user - Test user to authenticate
 * @param loginUrl - URL of the SSO login page
 */
export async function loginUser(
  page: Page,
  user: TestUser,
  loginUrl: string = "/login",
): Promise<void> {
  await page.goto(loginUrl);

  // Wait for the login form to be visible
  const usernameInput = page.locator(
    'input[name="username"], input[id="username"]',
  );
  await usernameInput.waitFor({ state: "visible", timeout: 10000 });

  // Fill credentials
  await usernameInput.fill(user.username);
  const password =
    process.env[`TEST_PASSWORD_${user.username.toUpperCase()}`] ||
    "Test@123456";
  const passwordInput = page.locator(
    'input[name="password"], input[id="password"]',
  );
  await passwordInput.fill(password);

  // Submit the login form
  const submitButton = page.locator(
    'button[type="submit"], button:has-text("Dang nhap"), button:has-text("Login")',
  );
  await submitButton.click();

  // Wait for successful redirect to the main app
  await page
    .waitForURL("**/pay-out-manual/**", { timeout: 15000 })
    .catch(() => {
      // Fallback: wait for any URL that is NOT the login page
      return page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 5000,
      });
    });

  // Store the auth token in the test user object for API client usage
  const token = await page.evaluate(() => {
    // Try localStorage first, then sessionStorage, then cookies
    const lsToken =
      localStorage.getItem("access_token") || localStorage.getItem("token");
    if (lsToken) return lsToken;
    const ssToken =
      sessionStorage.getItem("access_token") || sessionStorage.getItem("token");
    if (ssToken) return ssToken;
    return "";
  });

  user.token = token;
}

/**
 * Authenticate a test user via direct API call (bypasses UI login).
 * Useful when the SSO login page is not available or for faster test setup.
 *
 * @param user - Test user to authenticate
 * @param authApiUrl - URL of the authentication API endpoint
 * @returns JWT token string
 */
export async function authenticateViaApi(
  user: TestUser,
  authApiUrl: string = "/api/auth/login",
): Promise<string> {
  const baseUrl = process.env.API_BASE_URL || "http://localhost:8080";
  const password =
    process.env[`TEST_PASSWORD_${user.username.toUpperCase()}`] ||
    "Test@123456";

  const response = await fetch(`${baseUrl}${authApiUrl}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: user.username,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Authentication failed for ${user.username}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    token?: string;
    accessToken?: string;
    access_token?: string;
  };
  const token = data.token || data.accessToken || data.access_token || "";

  if (!token) {
    throw new Error(`No token returned in auth response for ${user.username}`);
  }

  user.token = token;
  return token;
}

/**
 * Save the current browser context's storage state to a file.
 * This captures cookies, localStorage, and sessionStorage for reuse.
 *
 * @param context - Playwright browser context
 * @param storageStatePath - Path to save the storage state JSON
 */
export async function saveAuthState(
  context: BrowserContext,
  storageStatePath: string,
): Promise<void> {
  await context.storageState({ path: storageStatePath });
}
