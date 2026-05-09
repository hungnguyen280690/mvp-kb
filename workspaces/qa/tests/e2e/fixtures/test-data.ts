// ============================================================================
// E2E Test Data Factories — Playwright
// Module: TT.OUT.MANUAL
// Generated: 2026-05-10 | Stage 4 — QA
// ============================================================================

import { faker } from '@faker-js/faker/locale/vi';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const users = {
  maker: {
    id: 'maker01',
    name: 'Nguyen Van A',
    role: 'MAKER',
    unitCode: '01101',
    bankCode: '01101001',
    email: 'nguyen.van.a@kbnn.gov.vn',
    password: 'Test@12345',
  },
  checker: {
    id: 'checker01',
    name: 'Tran Thi B',
    role: 'CHECKER',
    unitCode: '01101',
    bankCode: '01101001',
    email: 'tran.thi.b@kbnn.gov.vn',
    password: 'Test@12345',
  },
  approver: {
    id: 'approver01',
    name: 'Le Van C',
    role: 'APPROVER',
    unitCode: '01101',
    bankCode: '01101001',
    email: 'le.van.c@kbnn.gov.vn',
    password: 'Test@12345',
  },
  maker2: {
    id: 'maker02',
    name: 'Pham Van D',
    role: 'MAKER',
    unitCode: '01101',
    bankCode: '01101001',
    email: 'pham.van.d@kbnn.gov.vn',
    password: 'Test@12345',
  },
  admin: {
    id: 'admin01',
    name: 'Admin User',
    role: 'ADMIN',
    unitCode: '01101',
    bankCode: '01101001',
    email: 'admin@kbnn.gov.vn',
    password: 'Admin@12345',
  },
};

// ---------------------------------------------------------------------------
// Payment Order Factory
// ---------------------------------------------------------------------------
export function createPaymentOrder(overrides: Record<string, unknown> = {}) {
  const defaults = {
    channel: 'LNH',
    orderType: 'OT-LNH-LCC',
    transactionType: 'TX-LCC',
    receiverBankCode: '01101002',
    receiverBankName: 'KBNN Cục DB - Chi nhánh',
    paymentDate: '2026-05-10',
    amount: 150000000.00,
    currency: 'VND',
    exchangeRate: null,
    paymentContent: `Thanh toan hop dong mua sam thiet bi van phong - ${faker.string.alphanumeric(8)}`,
    lineItems: [
      {
        fundCode: '01',
        naturalAccount: '1121',
        dvqhns: '1054321',
        budgetLevel: '1',
        chapter: '168',
        economicSector: '080',
        ndkt: '6000',
        area: '00001',
        program: '00000',
        fundSource: '14',
        treasuryCode: '0010',
        reserve: '000',
        description: 'Mua sam thiet bi van phong',
        itemAmount: 150000000.00,
      },
    ],
    senderInfo: {
      name: 'KBNN Cục DB',
      address: '01 Dai Lo Thang Long, Ha Noi',
      accountNumber: '011010010001',
      customerCode: 'KB001',
      bankCode: '01101001',
      bankName: 'KBNN Cục DB',
    },
    receiverInfo: {
      name: 'Cong ty ABC',
      address: '123 Nguyen Trai, Ha Noi',
      accountNumber: '011010020001',
      bankCode: '01101002',
      bankName: 'KBNN Cục DB - Chi nhánh',
      accountName: 'Cong ty ABC',
    },
  };

  return { ...defaults, ...overrides };
}

// ---------------------------------------------------------------------------
// SP Channel Payment Order
// ---------------------------------------------------------------------------
export function createSpPaymentOrder(overrides: Record<string, unknown> = {}) {
  return createPaymentOrder({
    channel: 'SP',
    orderType: 'OT-SP-CK',
    transactionType: null,
    receiverBankCode: '970415',
    receiverBankName: 'Ngan hang TMCP Dau tu va Phat trien VN',
    originalDocNo: 'SP-CT-2026-0001',
    originalDocDate: '2026-05-10',
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// LKB Channel Payment Order
// ---------------------------------------------------------------------------
export function createLkbPaymentOrder(overrides: Record<string, unknown> = {}) {
  return createPaymentOrder({
    channel: 'LKB',
    orderType: 'OT-LKB-CK',
    transactionType: null,
    receiverBankCode: '01101003',
    receiverBankName: 'KBNN Tinh Ha Tay',
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Foreign Currency Payment Order
// ---------------------------------------------------------------------------
export function createForeignCurrencyOrder(overrides: Record<string, unknown> = {}) {
  return createPaymentOrder({
    currency: 'USD',
    exchangeRate: 25300,
    amount: 10000.00,
    feeType: 'FE-SHA',
    debitCurrency: 'VND',
    paymentCurrency: 'USD',
    foreignAmount: 10000.00,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Invalid Payment Orders (for validation testing)
// ---------------------------------------------------------------------------
export const invalidOrders = {
  emptyReceiverBank: createPaymentOrder({ receiverBankCode: '' }),
  zeroAmount: createPaymentOrder({ amount: 0 }),
  negativeAmount: createPaymentOrder({ amount: -100000 }),
  sameSenderReceiverBank: createPaymentOrder({ receiverBankCode: '01101001' }),
  missingPaymentContent: createPaymentOrder({ paymentContent: '' }),
  missingTransactionTypeForLNH: createPaymentOrder({ transactionType: null }),
  missingOriginalDocForSP: createSpPaymentOrder({ originalDocNo: null }),
  missingExchangeRateForFx: createForeignCurrencyOrder({ exchangeRate: null }),
  emptyLineItems: createPaymentOrder({ lineItems: [] }),
  mismatchedLineItemTotal: createPaymentOrder({
    lineItems: [{ ...createPaymentOrder().lineItems[0], itemAmount: 100000000 }],
  }),
};

// ---------------------------------------------------------------------------
// Reject/Cancel Reasons
// ---------------------------------------------------------------------------
export const reasons = {
  valid: 'Thong tin nguoi thuong khong chinh xac, can kiem tra lai ky',
  tooShort: 'Sai',
  tooLong: 'A'.repeat(501),
  empty: '',
};

// ---------------------------------------------------------------------------
// Vietnamese UI Text (for assertion)
// ---------------------------------------------------------------------------
export const uiText = {
  // Buttons
  btnCreate: 'Lập LTT',
  btnSaveDraft: 'Lưu nháp',
  btnSubmit: 'Gửi kiểm soát',
  btnEdit: 'Sửa',
  btnDelete: 'Xoá',
  btnApproveCheck: 'Phê duyệt KS',
  btnApprove: 'Phê duyệt',
  btnReject: 'Từ chối',
  btnSign: 'Ký số',
  btnSend: 'Gửi NH',
  btnCancel: 'Huỷ',
  btnReverse: 'Đảo lệnh',
  btnConfirm: 'Xác nhận',
  btnSearch: 'Tìm kiếm',

  // Messages
  saveDraftSuccess: 'Lưu nháp thành công',
  submitSuccess: 'Gửi kiểm soát thành công',
  approveSuccess: 'Phê duyệt thành công',
  rejectSuccess: 'Từ chối thành công',
  signSuccess: 'Ký số thành công',
  sendSuccess: 'Gửi NH thành công',
  cancelSuccess: 'Huỷ thành công',
  deleteSuccess: 'Xoá thành công',

  // Errors
  requiredField: 'Vui lòng nhập',
  invalidAmount: 'Số tiền phải lớn hơn 0',
  sameBankError: 'NH chuyển và NH nhận không được trùng nhau',
  rejectReasonMinLength: 'Vui lòng nhập lý do tối thiểu 10 ký tự',
  expiredCert: 'Chứng thư số đã hết hạn',
  wrongCert: 'Chứng thư số không đúng cá nhân',
  optimisticLockError: 'Bản ghi đã bị thay đổi từ phiên khác',
  insufficientBalance: 'Số dư không đủ',
  coaInvalid: 'Tổ hợp COA không hợp lệ',
  valGeneric: 'Giá trị không nằm trong danh mục',
  valFieldTooLong: 'Vượt quá số ký tự cho phép',
  valDateInvalid: 'Ngày không hợp lệ',
  valDateRange: 'Khoảng thời gian không hợp lệ',
  valTransactionTypeRequired: 'Loại giao dịch là bắt buộc với kênh LNH',
  valOriginalDocRequired: 'Vui lòng nhập số chứng từ gốc cho kênh TTSP',
  valFxRateRequired: 'Vui lòng nhập tỷ giá hợp lệ với ngoại tệ',
  valLineItemTotal: 'Tổng tiền chi tiết khác tổng tiền LTT',
  valFileTooLarge: 'File đính kèm vượt giới hạn hoặc sai định dạng',
  valDVQHNS: 'Mã DVQHNS không hợp lệ hoặc đang bị khoá',
  valBudgetLevel: 'Cấp NS / Chương không khớp với mã quỹ',
  valNDKT: 'NDKT không hợp lệ với loại lệnh đã chọn',
  valAccountChecksum: 'Số tài khoản không hợp lệ',
  valIdentityDoc: 'Định dạng giấy tờ không hợp lệ',
  valIdentityDocDatePlace: 'Vui lòng nhập đầy đủ Ngày cấp và Nơi cấp',
  valTPCP: 'Mã TPCP bắt buộc và phải đúng định dạng',
  valOverLimit: 'Số tiền vượt hạn mức được phép duyệt',
  valLineItemDesc: 'Diễn giải bắt buộc và tối đa 250 ký tự',
  sodViolation: 'phân tách trách nhiệm',
  editNotAllowed: 'không cho phép Sửa/Xoá',
  editOwnOnly: 'Chỉ Người lập gốc mới được phép Sửa/Xoá LTT này',
  lockedByOther: 'đang được',
  notFound: 'Không tìm thấy LTT',
  cutoffWarning: 'ngày làm việc kế tiếp',

  // Statuses (Vietnamese)
  statusDraft: 'Nháp',
  statusSubmitted: 'Đã gửi KS',
  statusInControl: 'Đã kiểm soát',
  statusReturnedToMaker: 'Trả lại NL',
  statusReturnedToChecker: 'Trả lại KS',
  statusApproved: 'Đã phê duyệt',
  statusSigned: 'Đã ký số',
  statusSent: 'Đã gửi NH',
  statusSendFailed: 'Gửi thất bại',
  statusConfirmed: 'Đã xác nhận',
  statusPosted: 'Đã ghi sổ',
  statusPostFailed: 'Ghi sổ thất bại',
  statusCancelled: 'Đã huỷ',
  statusReversed: 'Đã đảo',
  statusBlocked: 'Bị chặn',

  // Roles
  roleMaker: 'Người lập',
  roleChecker: 'Người kiểm soát',
  roleApprover: 'Người phê duyệt',

  // Tabs
  tabAuditHistory: 'Lịch sử xử lý',

  // Pagination
  paginationInfo: (page: number, size: number, total: number) =>
    `Trang ${page + 1} / ${Math.ceil(total / size)}`,
};

// ---------------------------------------------------------------------------
// API Endpoints
// ---------------------------------------------------------------------------
export const apiEndpoints = {
  baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
  apiBase: '/api/internal/v1',
  login: '/api/auth/login',
  paymentOrders: '/payment-orders',
  paymentOrderById: (id: string) => `/payment-orders/${id}`,
  submit: (id: string) => `/payment-orders/${id}/submit`,
  approve: (id: string) => `/payment-orders/${id}/approve`,
  reject: (id: string) => `/payment-orders/${id}/reject`,
  sign: (id: string) => `/payment-orders/${id}/sign`,
  send: (id: string) => `/payment-orders/${id}/send`,
  cancel: (id: string) => `/payment-orders/${id}/cancel`,
  reverse: (id: string) => `/payment-orders/${id}/reverse`,
  auditTrail: (id: string) => `/payment-orders/${id}/audit-trail`,
  channels: '/dm/channels',
  coaSegments: '/dm/coa-segments',
  balance: '/balance',
};

export default {
  users,
  createPaymentOrder,
  createSpPaymentOrder,
  createLkbPaymentOrder,
  createForeignCurrencyOrder,
  invalidOrders,
  reasons,
  uiText,
  apiEndpoints,
};
