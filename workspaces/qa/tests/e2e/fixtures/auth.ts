// ============================================================================
// Shared E2E Auth Fixture — Login helper for mock auth LoginPage
// ============================================================================

import type { Page } from '@playwright/test';
import { users } from './test-data';

const ROLE_BUTTON_MAP: Record<string, string> = {
  MAKER: 'btn-login-maker',
  CHECKER: 'btn-login-checker',
  APPROVER: 'btn-login-approver',
};

export async function loginAs(page: Page, user: typeof users.maker): Promise<void> {
  const testId = ROLE_BUTTON_MAP[user.role.toUpperCase()];
  if (!testId) {
    throw new Error(`Unknown role: ${user.role}`);
  }
  await page.goto('/login');
  await page.click(`[data-testid="${testId}"]`);
  await page.waitForURL('**/');
}
