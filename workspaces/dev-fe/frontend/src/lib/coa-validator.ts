// ============================================================================
// COA Cross-Validation — client-side validation cho to hop COA
// Sinh tu BIZ-COA-CROSS va VAL-019
// ============================================================================

import type { LineItem } from '@/types';

/** Ket qua validate COA */
export interface CoaValidationResult {
  isValid: boolean;
  errors: { segment: string; message: string }[];
}

/**
 * Validate to hop COA tren client.
 * Day la validation nhanh (preview), backend se validate day du.
 */
export function validateCoaCombination(lineItem: Partial<LineItem>): CoaValidationResult {
  const errors: { segment: string; message: string }[] = [];

  // Kiem tra cac truong COA co gia tri
  if (lineItem.fundCode && lineItem.fundCode.length !== 2) {
    errors.push({ segment: 'fundCode', message: 'Ma quy phai co 2 ky tu' });
  }

  if (lineItem.naturalAccount && lineItem.naturalAccount.length !== 4) {
    errors.push({ segment: 'naturalAccount', message: 'TK tu nhien phai co 4 ky tu' });
  }

  if (lineItem.dvqhns && lineItem.dvqhns.length !== 7) {
    errors.push({ segment: 'dvqhns', message: 'DVQHNS phai co 7 ky tu' });
  }

  if (lineItem.budgetLevel && lineItem.budgetLevel.length !== 1) {
    errors.push({ segment: 'budgetLevel', message: 'Cap NS phai co 1 ky tu' });
  }

  if (lineItem.chapter && lineItem.chapter.length !== 3) {
    errors.push({ segment: 'chapter', message: 'Chuong phai co 3 ky tu' });
  }

  if (lineItem.economicSector && lineItem.economicSector.length !== 3) {
    errors.push({ segment: 'economicSector', message: 'Nganh KT phai co 3 ky tu' });
  }

  if (lineItem.ndkt && lineItem.ndkt.length !== 4) {
    errors.push({ segment: 'ndkt', message: 'NDKT phai co 4 ky tu' });
  }

  if (lineItem.area && lineItem.area.length !== 5) {
    errors.push({ segment: 'area', message: 'Dia ban phai co 5 ky tu' });
  }

  if (lineItem.program && lineItem.program.length !== 5) {
    errors.push({ segment: 'program', message: 'CTMT phai co 5 ky tu' });
  }

  if (lineItem.fundSource && lineItem.fundSource.length !== 2) {
    errors.push({ segment: 'fundSource', message: 'Ma nguon kinh phi phai co 2 ky tu' });
  }

  if (lineItem.treasuryCode && lineItem.treasuryCode.length !== 4) {
    errors.push({ segment: 'treasuryCode', message: 'Ma kho bac phai co 4 ky tu' });
  }

  if (lineItem.reserve && lineItem.reserve.length !== 3) {
    errors.push({ segment: 'reserve', message: 'Ma du phong phai co 3 ky tu' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Kiem tra tong tien chi tiet bang tong tien LTT (VAL-015)
 */
export function validateTotalAmount(
  lineItems: LineItem[],
  totalAmount: number
): boolean {
  if (!lineItems || lineItems.length === 0) return true;
  const calculatedTotal = lineItems.reduce((sum, item) => sum + (item.itemAmount || 0), 0);
  return Math.abs(calculatedTotal - totalAmount) < 0.01;
}

/**
 * Tinh tong tien tu cac dong khoan muc
 */
export function calculateTotalAmount(lineItems: LineItem[]): number {
  if (!lineItems) return 0;
  return lineItems.reduce((sum, item) => sum + (item.itemAmount || 0), 0);
}

/**
 * Tao dong khoan muc rong mac dinh
 */
export function createEmptyLineItem(): LineItem {
  return {
    fundCode: '01',
    naturalAccount: '',
    dvqhns: '',
    budgetLevel: '',
    chapter: '000',
    economicSector: '000',
    ndkt: '0000',
    area: '00000',
    program: '00000',
    fundSource: '00',
    treasuryCode: '0000',
    reserve: '000',
    description: '',
    itemAmount: 0,
  };
}
