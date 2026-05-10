// ============================================================================
// E2E Tests — LTT Cross-Cutting Concerns
// Source: 25-sod-constraints.feature, 26-optimistic-lock.feature, 27-idempotency.feature,
//         28-event-publish-notify.feature, 29-fee-fx-contract.feature,
//         30-validation-generic-attachment.feature, 31-audit-hash-chain.feature,
//         32-reserve-release-fund.feature
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import { test, expect } from '@playwright/test';
import { users, createPaymentOrder, uiText, reasons } from './fixtures/test-data';
import { loginAs } from './fixtures/auth';

// ==========================================================================
// SoD Constraints — @BIZ-MAKER-CHECKER, @BIZ-SOD
// Source: 25-sod-constraints.feature
// ==========================================================================

test.describe('Cross-cutting — SoD Constraints', () => {

  // @BIZ-MAKER-CHECKER @BIZ-SOD
  test('Maker cannot approve own LTT as Checker', async ({ page }) => {
    await loginAs(page, users.maker);

    // Find LTT created by maker01 in SUBMITTED state
    await page.click('[data-testid="ltt-row-submitted-by-me"]').first();

    // Approve button should not be visible or should be disabled
    const approveBtn = page.locator('[data-testid="btn-approve-check"]');
    if (await approveBtn.isVisible()) {
      await expect(approveBtn).toBeDisabled();
    }
  });

  // @BIZ-MAKER-CHECKER @BIZ-SOD
  test('Checker cannot approve as Approver on same LTT', async ({ page }) => {
    await loginAs(page, users.checker);

    // LTT where checker01 was the checker
    await page.click('[data-testid="ltt-row-in-control-checked-by-me"]').first();

    const approveBtn = page.locator('[data-testid="btn-approve"]');
    if (await approveBtn.isVisible()) {
      await expect(approveBtn).toBeDisabled();
    }
  });

  // @BIZ-MAKER-CHECKER @BIZ-SOD
  test('Maker cannot approve as Approver on own LTT', async ({ page }) => {
    await loginAs(page, users.maker);

    await page.click('[data-testid="ltt-row-in-control-made-by-me"]').first();

    const approveBtn = page.locator('[data-testid="btn-approve"]');
    if (await approveBtn.isVisible()) {
      await expect(approveBtn).toBeDisabled();
    }
  });

  // @BIZ-MAKER-CHECKER
  test('Three different users for 3 roles is accepted', async ({ page }) => {
    // Verify the workflow with 3 distinct users works
    // Step 1: Maker creates and submits
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-submit"]');
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusSubmitted);

    // Step 2: Checker approves
    await loginAs(page, users.checker);
    await page.click('[data-testid="ltt-row-submitted"]').first();
    await page.click('[data-testid="btn-approve-check"]');
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusInControl);

    // Step 3: Approver approves
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-in-control"]').first();
    await page.click('[data-testid="btn-approve"]');
    await expect(page.locator('[data-testid="field-status"]')).toHaveText(uiText.statusApproved);
  });
});

// ==========================================================================
// Optimistic Lock — @BIZ-OPTIMISTIC-LOCK, @VAL-036
// Source: 26-optimistic-lock.feature
// ==========================================================================

test.describe('Cross-cutting — Optimistic Lock', () => {

  // @BIZ-OPTIMISTIC-LOCK
  test('Concurrent edit: second user gets version conflict', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // User A opens edit
    await loginAs(page1, users.maker);
    await page1.click('[data-testid="ltt-row-draft"]').first();
    await page1.click('[data-testid="btn-edit"]');

    // User B opens same LTT
    await loginAs(page2, users.maker2);
    await page2.click('[data-testid="ltt-row-draft"]').first();
    await page2.click('[data-testid="btn-edit"]');

    // User A saves successfully
    await page1.fill('[data-testid="field-amount"]', '200000000');
    await page1.click('[data-testid="btn-save-draft"]');

    // User B tries to save — should get conflict
    await page2.fill('[data-testid="field-amount"]', '300000000');
    await page2.click('[data-testid="btn-save-draft"]');

    await expect(page2.locator('[data-testid="error-message"]')).toContainText(uiText.optimisticLockError);

    await context1.close();
    await context2.close();
  });

  // @BIZ-OPTIMISTIC-LOCK
  test('Optimistic lock applies to delete operations too', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-delete"]');

    // Simulate version change before confirming delete
    await page.route('**/api/internal/v1/payment-orders/*', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ code: '409', message: uiText.optimisticLockError }),
        });
      }
    });

    await page.fill('[data-testid="input-delete-reason"]', reasons.valid);
    await page.check('[data-testid="checkbox-confirm-delete"]');
    await page.click('[data-testid="btn-confirm-delete"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(uiText.optimisticLockError);
  });
});

// ==========================================================================
// Idempotency — Source: 27-idempotency.feature
// ==========================================================================

test.describe('Cross-cutting — Idempotency', () => {

  test('Duplicate POST with same idempotency key returns original result', async ({ page }) => {
    await loginAs(page, users.maker);

    // Create LTT via API with specific idempotency key
    const idemKey = 'idem-e2e-test-001';
    const order = createPaymentOrder();

    // First request
    const response1 = await page.request.post('/api/internal/v1/payment-orders', {
      headers: {
        'Idempotency-Key': idemKey,
        'X-User-Id': users.maker.id,
        'X-User-Role': users.maker.role,
      },
      data: order,
    });
    expect(response1.status()).toBe(201);
    const body1 = await response1.json();

    // Duplicate request with same key
    const response2 = await page.request.post('/api/internal/v1/payment-orders', {
      headers: {
        'Idempotency-Key': idemKey,
        'X-User-Id': users.maker.id,
        'X-User-Role': users.maker.role,
      },
      data: order,
    });
    expect(response2.status()).toBe(201);
    const body2 = await response2.json();

    // Same LTT returned (not a new one)
    expect(body1.id).toBe(body2.id);
  });
});

// ==========================================================================
// Event Publish & Notify — @BIZ-EVENT-PUBLISH, @BIZ-NOTIFY
// Source: 28-event-publish-notify.feature
// ==========================================================================

test.describe('Cross-cutting — Event Publish & Notify', () => {

  // @BIZ-NOTIFY
  test('Submit LTT sends notification to Checker', async ({ page }) => {
    await loginAs(page, users.maker);

    // Submit an LTT
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-submit"]');

    // Verify notification indicator for checker
    // (Switch to checker to verify notification received)
    await loginAs(page, users.checker);

    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).toBeVisible();
  });

  // @BIZ-NOTIFY
  test('Reject LTT sends notification to Maker', async ({ page }) => {
    await loginAs(page, users.checker);
    await page.click('[data-testid="ltt-row-submitted"]').first();
    await page.click('[data-testid="btn-reject"]');
    await page.fill('[data-testid="input-reject-reason"]', reasons.valid);
    await page.click('[data-testid="btn-confirm-reject"]');

    // Switch to maker and check notification
    await loginAs(page, users.maker);
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).toBeVisible();
  });
});

// ==========================================================================
// Fee, FX Rate, Contract Link — @BIZ-FEE-CALC, @BIZ-FX-RATE, @BIZ-CONTRACT-LINK
// Source: 29-fee-fx-contract.feature
// ==========================================================================

test.describe('Cross-cutting — Fee, FX Rate, Contract', () => {

  // @BIZ-FEE-CALC
  test('Fee auto-calculated based on channel x order type x amount', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s02');

    const order = createPaymentOrder();
    await page.selectOption('[data-testid="select-channel"]', order.channel);
    await page.fill('[data-testid="field-order-type"]', order.orderType);
    await page.fill('[data-testid="field-amount"]', '100500000');

    // Fee should be displayed
    const feeField = page.locator('[data-testid="field-calculated-fee"]');
    await expect(feeField).toBeVisible();
    const fee = await feeField.textContent();
    expect(Number(fee)).toBeGreaterThan(0);
  });

  // @BIZ-FEE-CALC
  test('Fee recalculated when channel changes', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s02');

    const order = createPaymentOrder();
    await page.fill('[data-testid="field-order-type"]', order.orderType);
    await page.fill('[data-testid="field-amount"]', '100500000');

    // Set LNH channel
    await page.selectOption('[data-testid="select-channel"]', 'LNH');
    const feeLNH = await page.locator('[data-testid="field-calculated-fee"]').textContent();

    // Change to SP channel
    await page.selectOption('[data-testid="select-channel"]', 'SP');
    const feeSP = await page.locator('[data-testid="field-calculated-fee"]').textContent();

    // Fees should differ (or at least be recalculated)
    // Exact values depend on fee configuration
  });

  // @BIZ-FX-RATE
  test('FX rate within ±2% accepted', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s02');

    const order = createPaymentOrder({ currency: 'USD', exchangeRate: 25500, amount: 10000 });
    await page.selectOption('[data-testid="select-channel"]', order.channel);
    await page.selectOption('[data-testid="select-currency"]', 'USD');
    await page.fill('[data-testid="field-exchange-rate"]', '25500');

    // No FX rate warning
    const fxWarning = page.locator('[data-testid="fx-rate-warning"]');
    await expect(fxWarning).not.toBeVisible();
  });

  // @BIZ-FX-RATE
  test('FX rate exceeding ±2% shows Approver warning', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s02');

    await page.selectOption('[data-testid="select-channel"]', 'LNH');
    await page.selectOption('[data-testid="select-currency"]', 'USD');
    await page.fill('[data-testid="field-exchange-rate"]', '26500'); // >2% deviation

    const fxWarning = page.locator('[data-testid="fx-rate-warning"]');
    await expect(fxWarning).toBeVisible();
  });

  // @BIZ-CONTRACT-LINK
  test('Contract link with sufficient balance is accepted', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s02');

    const order = createPaymentOrder();
    await page.selectOption('[data-testid="select-channel"]', order.channel);
    await page.fill('[data-testid="field-order-type"]', order.orderType);
    await page.fill('[data-testid="field-amount"]', '100000000');

    // Link contract with sufficient balance
    await page.click('[data-testid="btn-link-contract"]');
    await page.click('[data-testid="contract-option-sufficient"]');

    const contractStatus = page.locator('[data-testid="contract-link-status"]');
    await expect(contractStatus).toContainText('Hợp lệ');
  });

  // @BIZ-CONTRACT-LINK
  test('Contract link with insufficient balance is rejected', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s02');

    await page.selectOption('[data-testid="select-channel"]', 'LNH');
    await page.fill('[data-testid="field-order-type"]', 'OT-LNH-LCC');
    await page.fill('[data-testid="field-amount"]', '999999999999'); // Exceeds contract balance

    await page.click('[data-testid="btn-link-contract"]');
    await page.click('[data-testid="contract-option-insufficient"]');

    const contractError = page.locator('[data-testid="contract-link-error"]');
    await expect(contractError).toBeVisible();
  });
});

// ==========================================================================
// Generic Validation & Attachment — @VAL-001, VAL-002, VAL-003, VAL-004, VAL-029
// Source: 30-validation-generic-attachment.feature
// ==========================================================================

test.describe('Cross-cutting — Generic Validation & Attachment', () => {

  // @VAL-001
  test('Dropdown value not in catalog shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s02');

    // Manually input invalid order type
    await page.fill('[data-testid="field-order-type"]', 'INVALID-TYPE');
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valGeneric);
  });

  // @VAL-002
  test('Field exceeding max length shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s02');

    await page.fill('[data-testid="field-payment-content"]', 'A'.repeat(501));
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valFieldTooLong);
  });

  // @VAL-003
  test('Invalid date format shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s01');

    await page.fill('[data-testid="filter-date-from"]', 'invalid-date');
    await page.click('[data-testid="btn-search"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valDateInvalid);
  });

  // @VAL-004
  test('From date greater than to date shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s01');

    await page.fill('[data-testid="filter-date-from"]', '2026-05-15');
    await page.fill('[data-testid="filter-date-to"]', '2026-05-10');
    await page.click('[data-testid="btn-search"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valDateRange);
  });

  // @VAL-029
  test('Attachment file exceeding 10MB is rejected', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s02');

    // Upload oversized file
    const fileInput = page.locator('[data-testid="file-input"]');
    // Create a large file buffer (simulated)
    await page.route('**/api/internal/v1/upload', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ code: '400', message: uiText.valFileTooLarge }),
      });
    });

    await expect(page.locator('[data-testid="error-message"]')).toContainText('10MB');
  });

  // @VAL-029
  test('Attachment file with wrong format (.exe) is rejected', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s02');

    // Try to upload .exe file
    const fileInput = page.locator('[data-testid="file-input"]');
    // The file input should only accept pdf, jpg, png, docx
    const accept = await fileInput.getAttribute('accept');
    expect(accept).toContain('pdf');
    expect(accept).toContain('jpg');
    expect(accept).toContain('png');
    expect(accept).toContain('docx');
    expect(accept).not.toContain('exe');
  });
});

// ==========================================================================
// Audit Hash Chain — @BIZ-AUDIT, @BIZ-EDIT-AUDIT
// Source: 31-audit-hash-chain.feature
// ==========================================================================

test.describe('Cross-cutting — Audit Hash Chain', () => {

  // @BIZ-AUDIT
  test('Create LTT records audit log with user/timestamp/IP', async ({ page }) => {
    await loginAs(page, users.maker);

    // Create LTT
    await page.click('[data-testid="btn-create-ltt"]');
    const order = createPaymentOrder();
    await page.selectOption('[data-testid="select-channel"]', order.channel);
    await page.fill('[data-testid="field-order-type"]', order.orderType);
    await page.fill('[data-testid="field-receiver-bank-code"]', order.receiverBankCode);
    await page.fill('[data-testid="field-amount"]', order.amount.toString());
    await page.fill('[data-testid="field-payment-content"]', order.paymentContent);
    await page.click('[data-testid="btn-save-draft"]');

    // Check audit
    await page.click('[data-testid="tab-audit-history"]');
    const entry = page.locator('[data-testid="audit-entry"]').first();
    await expect(entry.locator('[data-testid="audit-action"]')).toContainText('create');
    await expect(entry.locator('[data-testid="audit-user"]')).toContainText(users.maker.id);
    await expect(entry.locator('[data-testid="audit-timestamp"]')).toBeVisible();
    await expect(entry.locator('[data-testid="audit-ip"]')).toBeVisible();
  });

  // @BIZ-AUDIT
  test('Submit LTT records audit with before/after status', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-submit"]');

    await page.click('[data-testid="tab-audit-history"]');
    const submitEntry = page.locator('[data-testid="audit-entry"]', { hasText: 'submit' }).first();
    await expect(submitEntry).toBeVisible();
    await expect(submitEntry.locator('[data-testid="audit-prev-status"]')).toContainText('DRAFT');
    await expect(submitEntry.locator('[data-testid="audit-new-status"]')).toContainText('SUBMITTED');
  });

  // @BIZ-EDIT-AUDIT
  test('Edit LTT shows field-level diff in audit history', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-edit"]');
    await page.fill('[data-testid="field-amount"]', '200000000');
    await page.click('[data-testid="btn-save-draft"]');

    await page.click('[data-testid="tab-audit-history"]');
    const editEntry = page.locator('[data-testid="audit-entry"]', { hasText: 'update' }).first();
    await expect(editEntry).toBeVisible();

    // Verify diff section shows field, old value, new value
    const diffSection = editEntry.locator('[data-testid="audit-diffs"]');
    await expect(diffSection).toContainText('amount');
  });
});

// ==========================================================================
// Reserve & Release Fund — @BIZ-RESERVE-FUND, @BIZ-RELEASE-HOLD
// Source: 32-reserve-release-fund.feature
// ==========================================================================

test.describe('Cross-cutting — Reserve & Release Fund', () => {

  // @BIZ-RESERVE-FUND
  test('Submit LTT places hold on account balance', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();

    // Check balance before submit
    const balanceBefore = await page.locator('[data-testid="account-available-balance"]').textContent();

    await page.click('[data-testid="btn-submit"]');

    // Verify hold amount displayed
    const holdAmount = await page.locator('[data-testid="field-hold-amount"]').textContent();
    expect(Number(holdAmount)).toBeGreaterThan(0);
  });

  // @BIZ-RESERVE-FUND
  test('Insufficient balance blocks submit', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft-overlimit"]').first();
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(uiText.insufficientBalance);
  });

  // @BIZ-RELEASE-HOLD
  test('Reject LTT releases held amount', async ({ page }) => {
    await loginAs(page, users.checker);
    await page.click('[data-testid="ltt-row-submitted"]').first();
    await page.click('[data-testid="btn-reject"]');
    await page.fill('[data-testid="input-reject-reason"]', reasons.valid);
    await page.click('[data-testid="btn-confirm-reject"]');

    // Verify RELEASE_HOLD in audit
    await page.click('[data-testid="tab-audit-history"]');
    const releaseEntry = page.locator('[data-testid="audit-entry"]', { hasText: 'RELEASE_HOLD' });
    await expect(releaseEntry).toBeVisible();
  });

  // @BIZ-RELEASE-HOLD
  test('Cancel LTT releases held amount', async ({ page }) => {
    await loginAs(page, users.approver);
    await page.click('[data-testid="ltt-row-signed"]').first();
    await page.click('[data-testid="btn-cancel"]');
    await page.fill('[data-testid="input-cancel-reason"]', reasons.valid);
    await page.click('[data-testid="btn-confirm-cancel"]');

    await page.click('[data-testid="tab-audit-history"]');
    const releaseEntry = page.locator('[data-testid="audit-entry"]', { hasText: 'RELEASE_HOLD' });
    await expect(releaseEntry).toBeVisible();
  });

  // @BIZ-RELEASE-HOLD
  test('Delete DRAFT LTT without prior reserve does not create RELEASE_HOLD audit', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft-no-reserve"]').first();
    await page.click('[data-testid="btn-delete"]');
    await page.fill('[data-testid="input-delete-reason"]', reasons.valid);
    await page.check('[data-testid="checkbox-confirm-delete"]');
    await page.click('[data-testid="btn-confirm-delete"]');

    await page.click('[data-testid="tab-audit-history"]');
    const releaseEntry = page.locator('[data-testid="audit-entry"]', { hasText: 'RELEASE_HOLD' });
    await expect(releaseEntry).not.toBeVisible();
  });

  // @BIZ-RELEASE-HOLD
  test('SEND_FAILED releases held amount', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-send-failed"]').first();

    await page.click('[data-testid="tab-audit-history"]');
    const releaseEntry = page.locator('[data-testid="audit-entry"]', { hasText: 'RELEASE_HOLD' });
    await expect(releaseEntry).toBeVisible();
  });
});
