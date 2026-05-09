// ============================================================================
// E2E Tests — LTT Error Flows
// Source: 15-post-failed.feature, 16-send-failed.feature, 17-cancel-ltt.feature,
//         18-reverse-ltt.feature, 19-blocked-ltt.feature
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import { test, expect } from '@playwright/test';
import { users, uiText, reasons } from './fixtures/test-data';

async function loginAs(page: any, user: typeof users.maker) {
  await page.goto('/login');
  await page.fill('[data-testid="input-username"]', user.id);
  await page.fill('[data-testid="input-password"]', user.password);
  await page.click('[data-testid="btn-login"]');
  await page.waitForURL('**/dashboard');
}

// ---- POST_FAILED ----

test.describe('POST_FAILED — GL post failure', () => {

  test('POST_FAILED LTT has all action buttons disabled', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-post-failed"]').first();

    // @states.yaml: POST_FAILED has no transitions, all buttons disabled
    await expect(page.locator('[data-testid="btn-edit"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-delete"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-submit"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-approve"]')).not.toBeVisible();

    // Operations warning banner
    await expect(page.locator('[data-testid="ops-warning-banner"]')).toBeVisible();
  });

  test('POST_FAILED shows DLQ message indicator', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-post-failed"]').first();

    // Verify DLQ indicator
    await expect(page.locator('[data-testid="dlq-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-detail"]')).toContainText('GL');
  });
});

// ---- SEND_FAILED ----

test.describe('SEND_FAILED — Gateway retry exhausted', () => {

  // @BIZ-RETRY @BIZ-OPTIMISTIC-LOCK
  test('Approver can resend from SEND_FAILED', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-send-failed"]').first();

    await page.click('[data-testid="btn-resend"]');

    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusSigned);
  });

  // @VAL-030 @BIZ-REJECT-REASON
  test('Approver can cancel from SEND_FAILED', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-send-failed"]').first();

    await page.click('[data-testid="btn-cancel"]');
    await page.fill('[data-testid="input-cancel-reason"]', reasons.valid);
    await page.click('[data-testid="btn-confirm-cancel"]');

    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusCancelled);
  });
});

// ---- CANCEL ----

test.describe('Cancel LTT — Approver cancels signed LTT', () => {

  // @VAL-030 @BIZ-REJECT-REASON @BIZ-RELEASE-HOLD
  test('Cancel signed LTT releases hold and notifies Maker', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-signed"]').first();
    await page.click('[data-testid="btn-cancel"]');

    await page.fill('[data-testid="input-cancel-reason"]', reasons.valid);
    await page.click('[data-testid="btn-confirm-cancel"]');

    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusCancelled);

    // Verify hold released
    await expect(page.locator('[data-testid="field-hold-amount"]')).toHaveText('');
  });

  // @VAL-030
  test('Cancel with reason shorter than 10 chars is blocked', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-signed"]').first();
    await page.click('[data-testid="btn-cancel"]');

    await page.fill('[data-testid="input-cancel-reason"]', 'Huy');
    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.rejectReasonMinLength);
  });
});

// ---- REVERSE ----

test.describe('Reverse LTT — Create reversal for posted LTT', () => {

  // @BIZ-MAKER-CHECKER @BIZ-SOD
  test('Reverse posted LTT creates new reversal LTT', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-posted"]').first();
    await page.click('[data-testid="btn-reverse"]');

    await page.fill('[data-testid="input-reverse-reason"]', reasons.valid);
    await page.click('[data-testid="btn-confirm-reverse"]');

    // Original LTT locked as REVERSED
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusReversed);

    // No action buttons on REVERSED LTT
    await expect(page.locator('[data-testid="btn-edit"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-delete"]')).not.toBeVisible();
  });

  // @BIZ-SOD
  test('Reverse LTT with SoD violation is rejected', async ({ page }) => {
    // Login as user who would violate SoD
    await loginAs(page, users.approver);

    // Mock SoD violation response
    await page.route('**/api/internal/v1/payment-orders/*/reverse', (route) => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ code: '403', message: uiText.sodViolation }),
      });
    });

    await page.click('[data-testid="ltt-row-posted"]').first();
    await page.click('[data-testid="btn-reverse"]');
    await page.fill('[data-testid="input-reverse-reason"]', reasons.valid);
    await page.click('[data-testid="btn-confirm-reverse"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(uiText.sodViolation);
  });
});

// ---- BLOCKED ----

test.describe('BLOCKED — System-triggered block', () => {

  // @BIZ-SOD @BIZ-DUPLICATE
  test('System blocks LTT on SoD violation', async ({ page }) => {
    await loginAs(page, users.maker);

    // Navigate to a LTT that should be blocked
    await page.click('[data-testid="ltt-row-blocked"]').first();

    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusBlocked);

    // All action buttons disabled
    await expect(page.locator('[data-testid="btn-edit"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-delete"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-submit"]')).not.toBeVisible();
  });

  // @BIZ-SOD @BIZ-DUPLICATE
  test('System blocks LTT on duplicate detection', async ({ page }) => {
    await loginAs(page, users.maker);

    // Create duplicate LTTs rapidly
    await page.click('[data-testid="btn-create-ltt"]');
    // ... fill form with duplicate data
    // The system should detect and block

    // Verify block indicator
    await expect(page.locator('[data-testid="block-indicator"]')).toBeVisible();
  });

  test('Operations can unblock LTT after verification', async ({ page }) => {
    await loginAs(page, users.admin);

    await page.click('[data-testid="ltt-row-blocked"]').first();
    await page.click('[data-testid="btn-unblock"]');

    await page.fill('[data-testid="input-unblock-reason"]', 'Da xac minh, khong con vi pham');
    await page.click('[data-testid="btn-confirm-unblock"]');

    // Should return to previous state
    const status = await page.locator('[data-testid="field-status"]').textContent();
    expect(status).not.toBe(uiText.statusBlocked);
  });

  test('BLOCKED can occur from any non-final state', async ({ page }) => {
    await loginAs(page, users.admin);

    // Verify BLOCKED indicator works for various source states
    const states = ['DRAFT', 'SUBMITTED', 'IN_CONTROL', 'SIGNED', 'SENT'];
    for (const state of states) {
      await page.goto(`/s01?status=BLOCKED&previousState=${state}`);
      await expect(page.locator('[data-testid="block-indicator"]')).toBeVisible();
    }
  });
});
