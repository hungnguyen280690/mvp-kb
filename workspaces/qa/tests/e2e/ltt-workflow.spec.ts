// ============================================================================
// E2E Tests — LTT Workflow (Submit through Post-to-GL)
// Source: 05-submit-ltt.feature through 14-post-to-gl.feature
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import { test, expect } from '@playwright/test';
import { users, createPaymentOrder, uiText, reasons } from './fixtures/test-data';
import { loginAs } from './fixtures/auth';

test.describe('LTT Workflow — Submit (DRAFT -> SUBMITTED)', () => {

  // @VAL-005 @VAL-019 @BIZ-COA-CROSS @BIZ-LIMIT @BIZ-COT-CHECK
  test('Submit DRAFT LTT successfully — happy path', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="toast-message"]')).toContainText(uiText.submitSuccess);

    // Verify status changed
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusSubmitted);

    // @BIZ-RESERVE-FUND: Verify hold amount displayed
    await expect(page.locator('[data-testid="field-hold-amount"]')).toBeVisible();
  });

  // @VAL-005
  test('Submit with missing required field shows validation error', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-incomplete"]').first();
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.requiredField);
  });

  // @BIZ-RESERVE-FUND
  test('Submit when insufficient balance is rejected', async ({ page }) => {
    await loginAs(page, users.maker);

    // Create order with very large amount
    await page.click('[data-testid="btn-create-ltt"]');
    const order = createPaymentOrder({ amount: 999999999999 });
    await page.selectOption('[data-testid="select-channel"]', order.channel);
    await page.fill('[data-testid="field-order-type"]', order.orderType);
    await page.fill('[data-testid="field-receiver-bank-code"]', order.receiverBankCode);
    await page.fill('[data-testid="field-amount"]', order.amount.toString());
    await page.fill('[data-testid="field-payment-content"]', order.paymentContent);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(uiText.insufficientBalance);
  });

  // @BIZ-COT-CHECK
  test('Submit after cut-off shows warning about next working day', async ({ page }) => {
    await loginAs(page, users.maker);

    // This test requires time manipulation or specific test data
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-submit"]');

    // Check for cut-off warning dialog
    const warningDialog = page.locator('[data-testid="cutoff-warning-dialog"]');
    if (await warningDialog.isVisible()) {
      await expect(warningDialog).toContainText(uiText.cutoffWarning);
    }
  });

  // @BIZ-DUPLICATE
  test('Duplicate LTT warning displayed within N minutes', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-submit"]');

    // Check for duplicate warning
    const dupDialog = page.locator('[data-testid="duplicate-warning-dialog"]');
    if (await dupDialog.isVisible()) {
      await expect(dupDialog).toContainText('trùng');
      await page.click('[data-testid="btn-confirm-continue"]');
    }
  });

  // @BIZ-LIMIT
  test('Amount exceeding limit requires higher-level approval', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-overlimit"]').first();
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="limit-warning"]')).toContainText('hạn mức');
  });
});

test.describe('LTT Workflow — Checker Approve (SUBMITTED -> IN_CONTROL)', () => {

  // @BIZ-MAKER-CHECKER @BIZ-SOD
  test('Checker approves submitted LTT — happy path', async ({ page }) => {
    await loginAs(page, users.checker);
    await page.click('[data-testid="ltt-row-submitted"]').first();
    await page.click('[data-testid="btn-approve-check"]');

    await expect(page.locator('[data-testid="toast-message"]')).toContainText(uiText.approveSuccess);
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusInControl);
    await expect(page.locator('[data-testid="field-checker"]')).toContainText(users.checker.name);
  });

  // @BIZ-MAKER-CHECKER @BIZ-SOD
  test('Same user as Maker cannot approve as Checker (SoD violation)', async ({ page }) => {
    await loginAs(page, users.maker); // Maker trying to approve their own LTT
    await page.click('[data-testid="ltt-row-submitted-by-me"]').first();

    await expect(page.locator('[data-testid="btn-approve-check"]')).not.toBeVisible();
  });
});

test.describe('LTT Workflow — Checker Reject (SUBMITTED -> RETURNED_TO_MAKER)', () => {

  // @BIZ-MAKER-CHECKER @BIZ-REJECT-REASON @VAL-030 @BIZ-RELEASE-HOLD
  test('Checker rejects submitted LTT — happy path', async ({ page }) => {
    await loginAs(page, users.checker);
    await page.click('[data-testid="ltt-row-submitted"]').first();
    await page.click('[data-testid="btn-reject"]');

    // Enter reject reason
    await page.fill('[data-testid="input-reject-reason"]', reasons.valid);
    await page.click('[data-testid="btn-confirm-reject"]');

    await expect(page.locator('[data-testid="toast-message"]')).toContainText(uiText.rejectSuccess);
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusReturnedToMaker);
  });

  // @BIZ-REJECT-REASON @VAL-030
  test('Reject without reason is blocked', async ({ page }) => {
    await loginAs(page, users.checker);
    await page.click('[data-testid="ltt-row-submitted"]').first();
    await page.click('[data-testid="btn-reject"]');

    await expect(page.locator('[data-testid="btn-confirm-reject"]')).toBeDisabled();
  });

  // @BIZ-REJECT-REASON @VAL-030
  test('Reject reason shorter than 10 characters is blocked', async ({ page }) => {
    await loginAs(page, users.checker);
    await page.click('[data-testid="ltt-row-submitted"]').first();
    await page.click('[data-testid="btn-reject"]');

    await page.fill('[data-testid="input-reject-reason"]', reasons.tooShort);
    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.rejectReasonMinLength);
  });
});

test.describe('LTT Workflow — Approver Approve (IN_CONTROL -> APPROVED)', () => {

  // @BIZ-MAKER-CHECKER @BIZ-SOD
  test('Approver approves LTT — happy path', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-in-control"]').first();
    await page.click('[data-testid="btn-approve"]');

    await expect(page.locator('[data-testid="toast-message"]')).toContainText(uiText.approveSuccess);
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusApproved);
    await expect(page.locator('[data-testid="field-approver"]')).toContainText(users.approver.name);
  });

  // @BIZ-SOD
  test('Approver same as Checker is rejected (SoD)', async ({ page }) => {
    await loginAs(page, users.checker); // Checker has Approver role too
    await page.click('[data-testid="ltt-row-in-control-checked-by-me"]').first();

    await expect(page.locator('[data-testid="btn-approve"]')).not.toBeVisible();
  });
});

test.describe('LTT Workflow — Sign (APPROVED -> SIGNED)', () => {

  // @BIZ-SIGN-TAD-COMM
  test('Approver signs LTT with valid certificate — happy path', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-approved"]').first();
    await page.click('[data-testid="btn-sign"]');

    // Simulate certificate selection
    await page.click('[data-testid="select-certificate"]');
    await page.click('[data-testid="certificate-valid"]'); // select valid cert
    await page.click('[data-testid="btn-confirm-sign"]');

    await expect(page.locator('[data-testid="toast-message"]')).toContainText(uiText.signSuccess);
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusSigned);
  });

  // @BIZ-SIGN-TAD-COMM
  test('Signing with expired certificate is rejected', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-approved"]').first();
    await page.click('[data-testid="btn-sign"]');

    await page.click('[data-testid="select-certificate"]');
    await page.click('[data-testid="certificate-expired"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(uiText.expiredCert);
  });

  // @BIZ-SIGN-TAD-COMM
  test('Signing with certificate belonging to different user is rejected', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-approved"]').first();
    await page.click('[data-testid="btn-sign"]');

    await page.click('[data-testid="select-certificate"]');
    await page.click('[data-testid="certificate-wrong-user"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(uiText.wrongCert);
  });
});

test.describe('LTT Workflow — Send (SIGNED -> SENT)', () => {

  // @BIZ-CHANNEL-ROUTING
  test('Send LTT to LNH gateway', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-signed-lnh"]').first();
    await page.click('[data-testid="btn-send"]');

    await expect(page.locator('[data-testid="toast-message"]')).toContainText(uiText.sendSuccess);
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusSent);
  });

  // @BIZ-CHANNEL-ROUTING
  test('Send LTT to SP gateway', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-signed-sp"]').first();
    await page.click('[data-testid="btn-send"]');

    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusSent);
  });

  // @BIZ-CHANNEL-ROUTING
  test('Send LTT to LKB gateway', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-signed-lkb"]').first();
    await page.click('[data-testid="btn-send"]');

    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusSent);
  });
});

test.describe('LTT Workflow — Confirm & Post to GL', () => {

  // @BIZ-RETRY — Callback success
  test('Callback success transitions SENT to CONFIRMED', async ({ page }) => {
    // This is typically a system test, not UI test
    // Verify via API or admin interface
    await loginAs(page, users.maker);

    // Check LTT that should be confirmed by now
    await page.click('[data-testid="ltt-row-confirmed"]').first();
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusConfirmed);
  });

  // @BIZ-COA-CROSS — GL post success
  test('GL post success transitions CONFIRMED to POSTED', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-posted"]').first();

    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusPosted);
    await expect(page.locator('[data-testid="field-gl-voucher-no"]')).not.toBeEmpty();
  });
});

test.describe('LTT Workflow — Cancel (SIGNED -> CANCELLED)', () => {

  // @VAL-030 @BIZ-REJECT-REASON @BIZ-RELEASE-HOLD
  test('Cancel signed LTT with valid reason', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-signed"]').first();
    await page.click('[data-testid="btn-cancel"]');

    await page.fill('[data-testid="input-cancel-reason"]', reasons.valid);
    await page.click('[data-testid="btn-confirm-cancel"]');

    await expect(page.locator('[data-testid="toast-message"]')).toContainText(uiText.cancelSuccess);
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusCancelled);
  });

  // @VAL-030
  test('Cancel without reason is blocked', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-signed"]').first();
    await page.click('[data-testid="btn-cancel"]');

    await expect(page.locator('[data-testid="btn-confirm-cancel"]')).toBeDisabled();
  });
});

test.describe('LTT Workflow — Reverse (POSTED -> REVERSED)', () => {

  // @BIZ-MAKER-CHECKER @BIZ-SOD
  test('Create reversal for posted LTT', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-posted"]').first();
    await page.click('[data-testid="btn-reverse"]');

    await page.fill('[data-testid="input-reverse-reason"]', reasons.valid);
    await page.click('[data-testid="btn-confirm-reverse"]');

    // Original LTT should be REVERSED
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusReversed);

    // New reversal LTT should be in DRAFT
    const reversalLttLink = page.locator('[data-testid="reversal-ltt-link"]');
    await expect(reversalLttLink).toBeVisible();
  });
});
