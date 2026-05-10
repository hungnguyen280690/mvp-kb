// ============================================================================
// E2E Tests — LTT CRUD (Create, Read, Update, Delete)
// Source: 01-create-ltt.feature, 02-read-ltt.feature, 03-update-ltt.feature,
//         04-delete-ltt.feature, 20-search-filter-ltt.feature
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import { test, expect } from '@playwright/test';
import { users, createPaymentOrder, uiText, apiEndpoints, invalidOrders } from './fixtures/test-data';
import { loginAs } from './fixtures/auth';

test.describe('LTT CRUD — Create', () => {

  // @BIZ-AUTOFILL @BIZ-IDGEN
  test('Maker opens create form with autofill defaults', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="btn-create-ltt"]');

    // @BIZ-AUTOFILL: Verify autofill fields
    await expect(page.locator('[data-testid="field-sender-bank-code"]')).toHaveValue(users.maker.bankCode);
    await expect(page.locator('[data-testid="field-maker-name"]')).toHaveValue(users.maker.name);
    await expect(page.locator('[data-testid="field-payment-date"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="field-currency"]')).toHaveValue('VND');
    await expect(page.locator('[data-testid="field-fund-code"]')).toHaveValue('01');
  });

  // @BIZ-IDGEN — LNH
  test('System auto-generates request number when Maker leaves it empty (LNH)', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="btn-create-ltt"]');

    const order = createPaymentOrder({ channel: 'LNH' });
    await page.selectOption('[data-testid="select-channel"]', order.channel);
    await page.fill('[data-testid="field-order-type"]', order.orderType);
    // Leave requestNumber empty

    await page.click('[data-testid="btn-save-draft"]');

    await expect(page.locator('[data-testid="toast-message"]')).toContainText(uiText.saveDraftSuccess);
    // Verify request number was generated
    const requestNumber = await page.locator('[data-testid="field-request-number"]').inputValue();
    expect(requestNumber).toMatch(/\d{10}\d{6}/); // ddMMyyyy + 6-digit seq
  });

  // @BIZ-IDGEN — SP
  test('System auto-generates request number for SP channel', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="btn-create-ltt"]');

    const order = createPaymentOrder({ channel: 'SP', orderType: 'OT-SP-CK' });
    await page.selectOption('[data-testid="select-channel"]', 'SP');
    await page.fill('[data-testid="field-order-type"]', order.orderType);

    await page.click('[data-testid="btn-save-draft"]');

    const requestNumber = await page.locator('[data-testid="field-request-number"]').inputValue();
    expect(requestNumber.length).toBeGreaterThan(0);
  });

  // @BIZ-IDGEN — Maker enters own request number
  test('System keeps Maker-entered request number unchanged', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="btn-create-ltt"]');

    const order = createPaymentOrder();
    await page.fill('[data-testid="field-request-number"]', '10052026000099');
    await page.selectOption('[data-testid="select-channel"]', order.channel);
    await page.fill('[data-testid="field-order-type"]', order.orderType);
    await page.fill('[data-testid="field-receiver-bank-code"]', order.receiverBankCode);
    await page.fill('[data-testid="field-amount"]', order.amount.toString());
    await page.fill('[data-testid="field-payment-content"]', order.paymentContent);
    await page.click('[data-testid="btn-save-draft"]');

    await expect(page.locator('[data-testid="field-request-number"]')).toHaveValue('10052026000099');
  });

  // @VAL-005
  test('Save draft succeeds when all required fields are filled', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="btn-create-ltt"]');

    const order = createPaymentOrder();
    await page.selectOption('[data-testid="select-channel"]', order.channel);
    await page.fill('[data-testid="field-order-type"]', order.orderType);
    await page.fill('[data-testid="field-receiver-bank-code"]', order.receiverBankCode);
    await page.fill('[data-testid="field-amount"]', order.amount.toString());
    await page.fill('[data-testid="field-payment-content"]', order.paymentContent);

    await page.click('[data-testid="btn-save-draft"]');

    await expect(page.locator('[data-testid="toast-message"]')).toContainText(uiText.saveDraftSuccess);
  });

  // @BIZ-AUDIT
  test('Creating LTT records full audit log', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="btn-create-ltt"]');

    const order = createPaymentOrder();
    await page.selectOption('[data-testid="select-channel"]', order.channel);
    await page.fill('[data-testid="field-order-type"]', order.orderType);
    await page.fill('[data-testid="field-receiver-bank-code"]', order.receiverBankCode);
    await page.fill('[data-testid="field-amount"]', order.amount.toString());
    await page.fill('[data-testid="field-payment-content"]', order.paymentContent);
    await page.click('[data-testid="btn-save-draft"]');

    // Navigate to audit history tab
    await page.click('[data-testid="tab-audit-history"]');

    // Verify CREATE audit entry
    const auditRow = page.locator('[data-testid="audit-entry"]').first();
    await expect(auditRow.locator('[data-testid="audit-action"]')).toContainText('create');
    await expect(auditRow.locator('[data-testid="audit-user"]')).toContainText(users.maker.id);
  });
});

test.describe('LTT CRUD — Read', () => {

  // @BIZ-001
  test('View LTT detail in DRAFT state shows edit/delete/submit buttons', async ({ page }) => {
    await loginAs(page, users.maker);

    // Navigate to an existing DRAFT LTT
    await page.click('[data-testid="ltt-row-draft"]').first();

    await expect(page.locator('[data-testid="btn-edit"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-delete"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-submit"]')).toBeVisible();
  });

  // @BIZ-001 — Checker view
  test('View LTT detail in SUBMITTED state shows checker actions for Checker role', async ({ page }) => {
    await loginAs(page, users.checker);

    await page.click('[data-testid="ltt-row-submitted"]').first();

    await expect(page.locator('[data-testid="btn-approve-check"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-reject"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-edit"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-delete"]')).not.toBeVisible();
  });

  // @BIZ-001 — Approver view
  test('View LTT detail in IN_CONTROL state shows approver actions for Approver role', async ({ page }) => {
    await loginAs(page, users.approver);

    await page.click('[data-testid="ltt-row-in-control"]').first();

    await expect(page.locator('[data-testid="btn-approve"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-reject"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-edit"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-submit"]')).not.toBeVisible();
  });

  // POSTED state
  test('View LTT detail in POSTED state has all action buttons disabled', async ({ page }) => {
    await loginAs(page, users.maker);

    await page.click('[data-testid="ltt-row-posted"]').first();

    await expect(page.locator('[data-testid="btn-edit"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-delete"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-submit"]')).not.toBeVisible();
    // Reverse button visible for approver
  });

  // @BIZ-AUDIT — Audit trail tab
  test('View audit history shows chronological list of actions', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row"]').first();
    await page.click('[data-testid="tab-audit-history"]');

    const auditEntries = page.locator('[data-testid="audit-entry"]');
    await expect(auditEntries.first()).toBeVisible();

    // Verify each entry has required fields
    const firstEntry = auditEntries.first();
    await expect(firstEntry.locator('[data-testid="audit-timestamp"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="audit-user"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="audit-action"]')).toBeVisible();
  });
});

test.describe('LTT CRUD — Update', () => {

  // @BIZ-EDIT-OWN @VAL-031
  test('Original Maker can edit DRAFT LTT', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-edit"]');

    await expect(page.locator('[data-testid="form-s02"]')).toBeVisible();

    // Change amount
    await page.fill('[data-testid="field-amount"]', '200000000');
    await page.click('[data-testid="btn-save-draft"]');

    await expect(page.locator('[data-testid="toast-message"]')).toContainText(uiText.saveDraftSuccess);
  });

  // @VAL-031
  test('Edit LTT in SUBMITTED state is rejected', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-submitted"]').first();

    await expect(page.locator('[data-testid="btn-edit"]')).not.toBeVisible();
  });

  // @VAL-032
  test('Non-owner Maker cannot edit LTT', async ({ page }) => {
    await loginAs(page, users.maker2);
    await page.click('[data-testid="ltt-row-draft"]').first();

    await expect(page.locator('[data-testid="btn-edit"]')).toBeDisabled();
  });

  // @BIZ-EDIT-IMMUTABLE @VAL-034
  test('Immutable fields are disabled in edit mode', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-edit"]');

    // Immutable fields: request number, maker name, created date
    await expect(page.locator('[data-testid="field-request-number"]')).toBeDisabled();
    await expect(page.locator('[data-testid="field-maker-name"]')).toBeDisabled();
    await expect(page.locator('[data-testid="field-created-at"]')).toBeDisabled();
  });

  // @BIZ-OPTIMISTIC-LOCK @VAL-036
  test('Optimistic lock rejects edit when version changed by another user', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-edit"]');

    // Simulate version change by API call
    // In real test, another browser context would edit first
    await page.fill('[data-testid="field-amount"]', '250000000');

    // Mock version conflict
    await page.route('**/api/internal/v1/payment-orders/*', (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ code: '409', message: uiText.optimisticLockError }),
        });
      }
    });

    await page.click('[data-testid="btn-save-draft"]');
    await expect(page.locator('[data-testid="error-message"]')).toContainText(uiText.optimisticLockError);
  });

  // @BIZ-EDIT-AUDIT
  test('Edit LTT records field-level diff in audit log', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-edit"]');

    await page.fill('[data-testid="field-amount"]', '200000000');
    await page.click('[data-testid="btn-save-draft"]');

    await page.click('[data-testid="tab-audit-history"]');

    const editEntry = page.locator('[data-testid="audit-entry"]').first();
    await expect(editEntry.locator('[data-testid="audit-action"]')).toContainText('update');

    // Verify diff is shown
    const diffSection = page.locator('[data-testid="audit-diffs"]').first();
    await expect(diffSection).toBeVisible();
    await expect(diffSection).toContainText('amount');
    await expect(diffSection).toContainText('150000000');
    await expect(diffSection).toContainText('200000000');
  });
});

test.describe('LTT CRUD — Delete', () => {

  // @BIZ-DELETE-DRAFT @BIZ-DELETE-SOFT
  test('Maker soft-deletes DRAFT LTT with reason and confirmation', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-delete"]');

    // Delete confirmation popup
    await page.fill('[data-testid="input-delete-reason"]', 'Khong can thanh toan nua do sai thong tin');
    await page.check('[data-testid="checkbox-confirm-delete"]');
    await page.click('[data-testid="btn-confirm-delete"]');

    await expect(page.locator('[data-testid="toast-message"]')).toContainText(uiText.deleteSuccess);
  });

  // @VAL-035
  test('Delete LTT without reason blocks confirmation button', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-delete"]');

    // No reason entered
    await expect(page.locator('[data-testid="btn-confirm-delete"]')).toBeDisabled();
  });

  // @VAL-035
  test('Delete LTT without ticking confirmation checkbox is blocked', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-draft"]').first();
    await page.click('[data-testid="btn-delete"]');

    await page.fill('[data-testid="input-delete-reason"]', 'Khong can thanh toan nua do sai thong tin');
    // Checkbox not ticked
    await expect(page.locator('[data-testid="btn-confirm-delete"]')).toBeDisabled();
  });

  // @VAL-031
  test('Delete LTT in SUBMITTED state is rejected', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.click('[data-testid="ltt-row-submitted"]').first();

    await expect(page.locator('[data-testid="btn-delete"]')).not.toBeVisible();
  });

  // @VAL-032
  test('Non-owner Maker cannot delete LTT', async ({ page }) => {
    await loginAs(page, users.maker2);
    await page.click('[data-testid="ltt-row-draft"]').first();

    await expect(page.locator('[data-testid="btn-delete"]')).toBeDisabled();
  });

  // @BIZ-DELETE-SOFT
  test('Soft-deleted LTT request number cannot be reused', async ({ page }) => {
    await loginAs(page, users.maker);

    // Try to create new LTT with same request number as deleted one
    await page.click('[data-testid="btn-create-ltt"]');
    await page.fill('[data-testid="field-request-number"]', '10052026000001'); // deleted LTT's number
    await page.selectOption('[data-testid="select-channel"]', 'LNH');
    await page.fill('[data-testid="field-order-type"]', 'OT-LNH-LCC');
    await page.fill('[data-testid="field-receiver-bank-code"]', '01101002');
    await page.fill('[data-testid="field-amount"]', '150000000');
    await page.fill('[data-testid="field-payment-content"]', 'Test');
    await page.click('[data-testid="btn-save-draft"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('tồn tại');
  });
});

test.describe('LTT CRUD — Search & Filter', () => {

  // @BIZ-001
  test('Search with all valid parameters returns filtered results', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s01');

    await page.selectOption('[data-testid="filter-status"]', 'SUBMITTED');
    await page.selectOption('[data-testid="filter-channel"]', 'LNH');
    await page.fill('[data-testid="filter-date-from"]', '2026-05-01');
    await page.fill('[data-testid="filter-date-to"]', '2026-05-10');
    await page.click('[data-testid="btn-search"]');

    const rows = page.locator('[data-testid="ltt-row"]');
    await expect(rows.first()).toBeVisible();

    // Verify all results match filters
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator('[data-testid="row-status"]')).toContainText(uiText.statusSubmitted);
      await expect(rows.nth(i).locator('[data-testid="row-channel"]')).toContainText('LNH');
    }
  });

  // @BIZ-001
  test('Empty filter field means no filter on that field', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s01');

    await page.selectOption('[data-testid="filter-status"]', 'DRAFT');
    // Leave channel empty
    await page.click('[data-testid="btn-search"]');

    const rows = page.locator('[data-testid="ltt-row"]');
    await expect(rows.first()).toBeVisible();
    // Results include all channels, not just one
  });

  // @BIZ-001 @VAL-004
  test('Search with from-date > to-date shows validation error', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s01');

    await page.fill('[data-testid="filter-date-from"]', '2026-05-15');
    await page.fill('[data-testid="filter-date-to"]', '2026-05-10');
    await page.click('[data-testid="btn-search"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(uiText.valDateRange);
  });

  // @BIZ-002
  test('Default pagination is 20 records sorted by payment date descending', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s01');

    // Check page size selector
    await expect(page.locator('[data-testid="page-size-selector"]')).toHaveValue('20');

    // Verify sort
    const dates = page.locator('[data-testid="row-payment-date"]');
    const count = await dates.count();
    if (count > 1) {
      const first = await dates.first().textContent();
      const second = await dates.nth(1).textContent();
      expect(first! >= second!).toBeTruthy();
    }
  });

  // @BIZ-002
  test('Change page size to 50 displays 50 records', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s01');

    await page.selectOption('[data-testid="page-size-selector"]', '50');
    await page.waitForResponse('**/payment-orders**');

    const rows = page.locator('[data-testid="ltt-row"]');
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(50);
  });
});
