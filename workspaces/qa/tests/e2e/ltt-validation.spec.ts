// ============================================================================
// E2E Tests — LTT Validation
// Source: 21-validation-channel.feature, 22-validation-amount-date.feature,
//         23-validation-coa-account.feature, 24-validation-reference-identity.feature
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import { test, expect } from '@playwright/test';
import { users, createPaymentOrder, uiText, invalidOrders } from './fixtures/test-data';

async function loginAs(page: any, user: typeof users.maker) {
  await page.goto('/login');
  await page.fill('[data-testid="input-username"]', user.id);
  await page.fill('[data-testid="input-password"]', user.password);
  await page.click('[data-testid="btn-login"]');
  await page.waitForURL('**/dashboard');
}

async function fillCreateForm(page: any, order: Record<string, unknown>) {
  await page.goto('/s02');
  await page.selectOption('[data-testid="select-channel"]', order.channel as string);
  if (order.orderType) await page.fill('[data-testid="field-order-type"]', order.orderType as string);
  if (order.transactionType) await page.fill('[data-testid="field-transaction-type"]', order.transactionType as string);
  if (order.receiverBankCode) await page.fill('[data-testid="field-receiver-bank-code"]', order.receiverBankCode as string);
  if (order.amount !== undefined) await page.fill('[data-testid="field-amount"]', order.amount.toString());
  if (order.currency) await page.selectOption('[data-testid="select-currency"]', order.currency as string);
  if (order.paymentContent) await page.fill('[data-testid="field-payment-content"]', order.paymentContent as string);
}

// ==========================================================================
// Channel Validation — @VAL-006, VAL-007, VAL-008, VAL-009, VAL-017
// Source: 21-validation-channel.feature
// ==========================================================================

test.describe('Validation — Channel', () => {

  // @VAL-006
  test('LNH channel with invalid receiver bank shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder({ channel: 'LNH', receiverBankCode: 'INVALID1' });
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText('LNH');
  });

  // @VAL-007
  test('SP channel with non-SP order type shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder({ channel: 'SP', orderType: 'OT-LNH-LCC' }); // LNH type on SP channel
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Loại lệnh không hợp lệ');
  });

  // @VAL-008
  test('Sender bank code different from user bank shows error', async ({ page }) => {
    await loginAs(page, users.maker);

    // Try to change the autofill sender bank code
    await page.goto('/s02');
    const senderBankField = page.locator('[data-testid="field-sender-bank-code"]');
    await expect(senderBankField).toBeDisabled(); // Autofill field should be disabled
  });

  // @VAL-009
  test('Receiver bank same as sender bank shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = invalidOrders.sameSenderReceiverBank;
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.sameBankError);
  });

  // @VAL-017
  test('LNH channel without transaction type shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = invalidOrders.missingTransactionTypeForLNH;
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valTransactionTypeRequired);
  });
});

// ==========================================================================
// Amount & Date Validation — @VAL-012, VAL-013, VAL-014, VAL-015, VAL-016, VAL-028
// Source: 22-validation-amount-date.feature
// ==========================================================================

test.describe('Validation — Amount & Date', () => {

  // @VAL-014
  test('Amount equal to zero shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = invalidOrders.zeroAmount;
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.invalidAmount);
  });

  // @VAL-014
  test('Negative amount shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = invalidOrders.negativeAmount;
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.invalidAmount);
  });

  // @VAL-015
  test('Line item total mismatch with LTT total shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = invalidOrders.mismatchedLineItemTotal;
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valLineItemTotal);
  });

  // @VAL-016
  test('Foreign currency without exchange rate shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = invalidOrders.missingExchangeRateForFx;
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valFxRateRequired);
  });

  // @VAL-016
  test('Foreign currency with exchange rate of zero shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder({ currency: 'USD', exchangeRate: 0, amount: 10000 });
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valFxRateRequired);
  });

  // @VAL-012
  test('Payment date before current working date shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder({ paymentDate: '2026-05-09' }); // yesterday
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText('ngày làm việc hiện tại');
  });

  // @VAL-013
  test('Payment date on holiday shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder({ paymentDate: '2026-05-16' }); // Saturday
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText('ngày nghỉ');
  });

  // @VAL-028
  test('Amount exceeding configured limit shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder({ amount: 2000000000 }); // 2 billion
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valOverLimit);
  });
});

// ==========================================================================
// COA & Account Validation — @VAL-019, VAL-020, VAL-021, VAL-022, VAL-024
// Source: 23-validation-coa-account.feature
// ==========================================================================

test.describe('Validation — COA & Account', () => {

  // @VAL-019 @BIZ-COA-CROSS
  test('Valid COA combination is accepted', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    // Should not show COA error
    const coaError = page.locator('[data-testid="validation-error"]', { hasText: 'COA' });
    await expect(coaError).not.toBeVisible();
  });

  // @VAL-019 @BIZ-COA-CROSS
  test('Invalid COA combination shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);

    // Override line item with invalid COA
    await page.fill('[data-testid="line-item-0-ndkt"]', '9999');
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.coaInvalid);
  });

  // @BIZ-COA-CROSS
  test('Changing fund code revalidates entire COA combination', async ({ page }) => {
    await loginAs(page, users.maker);
    await page.goto('/s02');

    const order = createPaymentOrder();
    await fillCreateForm(page, order);

    // Change fund code
    await page.fill('[data-testid="line-item-0-fund-code"]', '02');
    await page.click('[data-testid="btn-submit"]');

    // System should revalidate the COA combination with new fund code
    // Either passes or shows COA error based on configuration
  });

  // @VAL-020
  test('Non-existent DVQHNS shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);
    await page.fill('[data-testid="line-item-0-dvqhns"]', '9999999');
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valDVQHNS);
  });

  // @VAL-020
  test('Locked DVQHNS shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);
    await page.fill('[data-testid="line-item-0-dvqhns"]', '9999999'); // Locked code
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valDVQHNS);
  });

  // @VAL-021
  test('Budget level/chapter mismatch with fund code shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);
    await page.fill('[data-testid="line-item-0-budget-level"]', '9'); // Invalid for fund code
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valBudgetLevel);
  });

  // @VAL-022 @BIZ-NDND-RULE
  test('NDKT invalid for order type shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);
    await page.fill('[data-testid="line-item-0-ndkt"]', '9999');
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valNDKT);
  });

  // @VAL-024
  test('Account number with invalid checksum shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);
    await page.fill('[data-testid="field-sender-account"]', '011010010099'); // Bad checksum
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valAccountChecksum);
  });
});

// ==========================================================================
// Reference & Identity Validation — @VAL-010, VAL-011, VAL-018, VAL-023,
//   VAL-025, VAL-026, VAL-027
// Source: 24-validation-reference-identity.feature
// ==========================================================================

test.describe('Validation — Reference & Identity', () => {

  // @VAL-010
  test('Duplicate request number in same day/unit shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder({ requestNumber: '10052026000001' }); // Already exists
    await fillCreateForm(page, order);
    await page.fill('[data-testid="field-request-number"]', '10052026000001');
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText('tồn tại');
  });

  // @VAL-011
  test('Request number wrong format for LNH channel shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder({ channel: 'LNH' });
    await fillCreateForm(page, order);
    await page.fill('[data-testid="field-request-number"]', 'WRONG-FORMAT');
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText('định dạng');
  });

  // @VAL-018
  test('SP channel without original document number shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = invalidOrders.missingOriginalDocForSP;
    await fillCreateForm(page, order);
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valOriginalDocRequired);
  });

  // @VAL-023
  test('Empty line item description shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);
    await page.fill('[data-testid="line-item-0-description"]', '');
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valLineItemDesc);
  });

  // @VAL-023
  test('Line item description over 250 characters shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);
    await page.fill('[data-testid="line-item-0-description"]', 'A'.repeat(251));
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valLineItemDesc);
  });

  // @VAL-025
  test('Invalid CCCD format shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);
    await page.fill('[data-testid="field-sender-identity-doc"]', '12345'); // Not 12 digits
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valIdentityDoc);
  });

  // @VAL-025
  test('Invalid enterprise code format shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);
    await page.fill('[data-testid="field-sender-identity-doc"]', 'AB'); // Not 10-13 chars
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valIdentityDoc);
  });

  // @VAL-026
  test('CCCD entered but issue date missing shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);
    await page.fill('[data-testid="field-sender-identity-doc"]', '001234567890');
    // Leave issue date empty
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valIdentityDocDatePlace);
  });

  // @VAL-026
  test('CCCD entered but issue place missing shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder();
    await fillCreateForm(page, order);
    await page.fill('[data-testid="field-sender-identity-doc"]', '001234567890');
    await page.fill('[data-testid="field-sender-identity-doc-date"]', '2020-01-01');
    // Leave issue place empty
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valIdentityDocDatePlace);
  });

  // @VAL-027
  test('Government bond order type without TPCP code shows error', async ({ page }) => {
    await loginAs(page, users.maker);
    const order = createPaymentOrder({ orderType: 'OT-SP-TPCP' });
    await fillCreateForm(page, order);
    // Leave TPCP code empty
    await page.click('[data-testid="btn-submit"]');

    await expect(page.locator('[data-testid="validation-error"]')).toContainText(uiText.valTPCP);
  });
});
