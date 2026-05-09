// ============================================================================
// Validation Rules — Zod schemas cho 36 VAL rules
// Thong bao loi tieng Viet
// ============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// VAL-002: Do dai toi da
// ---------------------------------------------------------------------------
const MAX_REQUEST_NUMBER = 30;
const MAX_PAYMENT_CONTENT = 500;
const MAX_DESCRIPTION = 250;
const MAX_ADDRESS = 200;
const MAX_NAME = 200;
const MAX_IDENTITY_DOC = 20;
const MAX_REASON = 500;
const MIN_REASON = 10;

// ---------------------------------------------------------------------------
// VAL-005: Truong bat buoc khi submit
// ---------------------------------------------------------------------------
export const lineItemSchema = z.object({
  id: z.string().optional(),
  fundCode: z.string().max(2, 'Ma quy toi da 2 ky tu'),
  naturalAccount: z.string().max(4, 'TK tu nhien toi da 4 ky tu'),
  dvqhns: z.string().max(7, 'DVQHNS toi da 7 ky tu'),
  budgetLevel: z.string().max(1, 'Cap NS toi da 1 ky tu'),
  chapter: z.string().max(3, 'Chuong toi da 3 ky tu'),
  economicSector: z.string().max(3, 'Nganh KT toi da 3 ky tu'),
  ndkt: z.string().max(4, 'NDKT toi da 4 ky tu'),
  area: z.string().max(5, 'Dia ban toi da 5 ky tu'),
  program: z.string().max(5, 'CTMT toi da 5 ky tu'),
  fundSource: z.string().max(2, 'Ma nguon kinh phi toi da 2 ky tu'),
  treasuryCode: z.string().max(4, 'Ma kho bac toi da 4 ky tu'),
  reserve: z.string().max(3, 'Ma du phong toi da 3 ky tu'),
  description: z
    .string()
    .min(1, 'Dien giai khoan muc bat buoc (VAL-023)')
    .max(MAX_DESCRIPTION, `Dien giai toi da ${MAX_DESCRIPTION} ky tu (VAL-023)`),
  itemAmount: z
    .number({ invalid_type_error: 'So tien phai la so' })
    .positive('So tien phai lon hon 0 (VAL-014)'),
});

export const senderInfoSchema = z.object({
  name: z.string().min(1, 'Ten nguoi chuyen bat buoc').max(MAX_NAME),
  address: z.string().min(1, 'Dia chi nguoi chuyen bat buoc').max(MAX_ADDRESS),
  accountNumber: z.string().min(1, 'Tai khoan nguoi chuyen bat buoc'),
  customerCode: z.string().optional(),
  bankCode: z.string().min(1, 'Mo tai NH/KB bat buoc'),
  bankName: z.string().optional(),
  identityDoc: z.string().max(MAX_IDENTITY_DOC, 'Dinh dang giay to khong hop le (VAL-025)').optional(),
  identityDocIssueDate: z.string().optional(),
  identityDocIssuePlace: z.string().optional(),
  tpcpCode: z.string().optional(),
}).superRefine((data, ctx) => {
  // VAL-026: Neu co identityDoc thi phai co issueDate va issuePlace
  if (data.identityDoc && data.identityDoc.length > 0) {
    if (!data.identityDocIssueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui long nhap Ngay cap khi da nhap so giay to (VAL-026)',
        path: ['identityDocIssueDate'],
      });
    }
    if (!data.identityDocIssuePlace) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui long nhap Noi cap khi da nhap so giay to (VAL-026)',
        path: ['identityDocIssuePlace'],
      });
    }
  }
});

export const receiverInfoSchema = z.object({
  name: z.string().min(1, 'Ten nguoi nhan bat buoc').max(MAX_NAME),
  address: z.string().max(MAX_ADDRESS).optional(),
  accountNumber: z.string().min(1, 'Tai khoan nguoi nhan bat buoc'),
  bankCode: z.string().min(1, 'Mo tai NH/KB bat buoc'),
  bankName: z.string().optional(),
  accountName: z.string().min(1, 'Ten tai khoan nguoi nhan bat buoc'),
  identityDoc: z.string().max(MAX_IDENTITY_DOC, 'Dinh dang giay to khong hop le (VAL-025)').optional(),
  identityDocIssueDate: z.string().optional(),
  identityDocIssuePlace: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.identityDoc && data.identityDoc.length > 0) {
    if (!data.identityDocIssueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui long nhap Ngay cap khi da nhap so giay to (VAL-026)',
        path: ['identityDocIssueDate'],
      });
    }
    if (!data.identityDocIssuePlace) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui long nhap Noi cap khi da nhap so giay to (VAL-026)',
        path: ['identityDocIssuePlace'],
      });
    }
  }
});

// ---------------------------------------------------------------------------
// PaymentOrder Create/Update schema
// ---------------------------------------------------------------------------
export const paymentOrderFormSchema = z.object({
  requestNumber: z.string().max(MAX_REQUEST_NUMBER, `So YCTT toi da ${MAX_REQUEST_NUMBER} ky tu`).optional(),
  channel: z.string().min(1, 'Kenh thanh toan bat buoc (VAL-005)'),
  orderType: z.string().min(1, 'Loai lenh bat buoc (VAL-005)'),
  transactionType: z.string().optional(),
  receiverBankCode: z.string().min(1, 'Ma NH nhan bat buoc (VAL-005)'),
  paymentDate: z.string().min(1, 'Ngay thanh toan bat buoc (VAL-005)'),
  amount: z
    .number({ invalid_type_error: 'So tien phai la so' })
    .positive('So tien phai lon hon 0 (VAL-014)'),
  currency: z.string().min(1, 'Loai tien bat buoc (VAL-005)'),
  exchangeRate: z.number().positive('Ty gia phai lon hon 0 (VAL-016)').optional(),
  originalDocNo: z.string().max(MAX_REQUEST_NUMBER).optional(),
  originalDocDate: z.string().optional(),
  feeType: z.string().optional(),
  debitCurrency: z.string().optional(),
  paymentCurrency: z.string().optional(),
  foreignAmount: z.number().positive().optional(),
  paymentContent: z
    .string()
    .min(1, 'Noi dung thanh toan bat buoc (VAL-005)')
    .max(MAX_PAYMENT_CONTENT, `Noi dung thanh toan toi da ${MAX_PAYMENT_CONTENT} ky tu (VAL-002)`),
  lineItems: z
    .array(lineItemSchema)
    .min(1, 'Phai co it nhat 1 khoan muc (VAL-005)'),
  senderInfo: senderInfoSchema,
  receiverInfo: receiverInfoSchema,
}).superRefine((data, ctx) => {
  // VAL-004: So tien tu phai nho hon so tien den
  // VAL-015: Tong tien chi tiet khac tong tien LTT
  const totalItemAmount = data.lineItems.reduce((sum, item) => sum + item.itemAmount, 0);
  if (Math.abs(totalItemAmount - data.amount) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tong tien chi tiet khac tong tien LTT (VAL-015)',
      path: ['amount'],
    });
  }

  // VAL-016: Ngoai te phai co ty gia
  if (data.currency !== 'VND' && (!data.exchangeRate || data.exchangeRate <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui long nhap ty gia hop le voi ngoai te (VAL-016)',
      path: ['exchangeRate'],
    });
  }

  // VAL-009: NH chuyen va NH nhan khong trung nhau — checked at sender bank vs receiver bank
  // (sender bank is autofilled from user, so we check receiverBankCode)
  // This cross-validation is handled in coa-validator.ts for more context
});

// ---------------------------------------------------------------------------
// Draft schema (relaxed — only check critical fields)
// ---------------------------------------------------------------------------
export const paymentOrderDraftSchema = z.object({
  channel: z.string().min(1, 'Kenh thanh toan bat buoc'),
  orderType: z.string().min(1, 'Loai lenh bat buoc'),
  receiverBankCode: z.string().optional(),
  paymentDate: z.string().optional(),
  amount: z.number().positive('So tien phai lon hon 0').optional(),
  currency: z.string().optional(),
  paymentContent: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
  senderInfo: senderInfoSchema.optional(),
  receiverInfo: receiverInfoSchema.optional(),
  requestNumber: z.string().optional(),
  transactionType: z.string().optional(),
  exchangeRate: z.number().optional(),
  originalDocNo: z.string().optional(),
  originalDocDate: z.string().optional(),
  feeType: z.string().optional(),
  debitCurrency: z.string().optional(),
  paymentCurrency: z.string().optional(),
  foreignAmount: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Reject/Cancel reason schema (VAL-030)
// ---------------------------------------------------------------------------
export const reasonSchema = z.object({
  reason: z
    .string()
    .min(MIN_REASON, `Vui long nhap ly do toi thieu ${MIN_REASON} ky tu (VAL-030)`)
    .max(MAX_REASON, `Ly do toi da ${MAX_REASON} ky tu`),
});

// ---------------------------------------------------------------------------
// Delete confirm schema (VAL-030 + VAL-035)
// ---------------------------------------------------------------------------
export const deleteConfirmSchema = z.object({
  reason: z
    .string()
    .min(MIN_REASON, `Vui long nhap ly do xoa toi thieu ${MIN_REASON} ky tu (VAL-030)`)
    .max(MAX_REASON, `Ly do toi da ${MAX_REASON} ky tu`),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Vui long tick xac nhan da ra soat (VAL-035)' }),
  }),
});

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------
export type PaymentOrderFormData = z.infer<typeof paymentOrderFormSchema>;
export type PaymentOrderDraftData = z.infer<typeof paymentOrderDraftSchema>;
export type ReasonFormData = z.infer<typeof reasonSchema>;
export type DeleteConfirmFormData = z.infer<typeof deleteConfirmSchema>;
export type LineItemFormData = z.infer<typeof lineItemSchema>;
