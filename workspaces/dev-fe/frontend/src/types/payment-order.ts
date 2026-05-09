// ============================================================================
// Payment Order Types — TT.OUT.MANUAL
// Tuong ung voi OpenAPI PaymentOrder schema va payment-order-v1.json
// ============================================================================

/** Khoan muc COA chi tiet (11 segment) */
export interface LineItem {
  id?: string;
  fundCode: string;
  naturalAccount: string;
  dvqhns: string;
  budgetLevel: string;
  chapter: string;
  economicSector: string;
  ndkt: string;
  area: string;
  program: string;
  fundSource: string;
  treasuryCode: string;
  reserve: string;
  description: string;
  itemAmount: number;
}

/** Thong tin nguoi chuyen tien */
export interface SenderInfo {
  name: string;
  address: string;
  accountNumber: string;
  customerCode?: string;
  bankCode: string;
  bankName: string;
  identityDoc?: string;
  identityDocIssueDate?: string;
  identityDocIssuePlace?: string;
  tpcpCode?: string;
}

/** Thong tin nguoi nhan tien */
export interface ReceiverInfo {
  name: string;
  address?: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  accountName: string;
  identityDoc?: string;
  identityDocIssueDate?: string;
  identityDocIssuePlace?: string;
}

/** Thong tin tep dinh kem */
export interface AttachmentInfo {
  id?: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

/** Model day du cua LTT */
export interface PaymentOrder {
  id: string;
  version: number;
  status: string;
  requestNumber: string;
  channel: string;
  orderType: string;
  transactionType?: string;
  senderBankCode: string;
  senderBankName: string;
  receiverBankCode: string;
  receiverBankName: string;
  paymentDate: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  originalDocNo?: string;
  originalDocDate?: string;
  feeType?: string;
  debitCurrency?: string;
  paymentCurrency?: string;
  foreignAmount?: number;
  paymentContent: string;
  makerId: string;
  makerName: string;
  createdAt: string;
  lineItems: LineItem[];
  senderInfo: SenderInfo;
  receiverInfo: ReceiverInfo;
  attachments: AttachmentInfo[];
  checkerId?: string;
  checkerName?: string;
  checkedAt?: string;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  signedAt?: string;
  providerRefId?: string;
  settlementDate?: string;
  glVoucherNo?: string;
  reversalOfId?: string;
  holdAmount?: number;
  rejectReason?: string;
  isDeleted: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

/** Tom tat LTT cho danh sach */
export interface PaymentOrderSummary {
  id: string;
  requestNumber: string;
  channel: string;
  orderType: string;
  senderBankCode: string;
  senderBankName: string;
  receiverBankCode: string;
  receiverBankName: string;
  paymentDate: string;
  amount: number;
  currency: string;
  status: string;
  makerName: string;
  createdAt: string;
  updatedAt?: string;
  version: number;
}

/** Request tao moi LTT */
export interface PaymentOrderCreateRequest {
  requestNumber?: string;
  channel: string;
  orderType: string;
  transactionType?: string;
  receiverBankCode: string;
  paymentDate: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  originalDocNo?: string;
  originalDocDate?: string;
  feeType?: string;
  debitCurrency?: string;
  paymentCurrency?: string;
  foreignAmount?: number;
  paymentContent: string;
  lineItems: LineItem[];
  senderInfo: SenderInfo;
  receiverInfo: ReceiverInfo;
}

/** Request cap nhat LTT */
export type PaymentOrderUpdateRequest = PaymentOrderCreateRequest;

/** Request tu choi */
export interface RejectRequest {
  reason: string;
}

/** Request huy */
export interface CancelRequest {
  reason: string;
}

/** Request ky so */
export interface SignRequest {
  signatureData: string;
  signerCert: string;
}

/** Request dao but toan */
export interface ReverseRequest {
  reason: string;
  attachments?: AttachmentInfo[];
}

/** Request xoa */
export interface DeleteRequest {
  reason: string;
  confirmed: boolean;
}

/** Thong tin nguoi dung (tu mock auth) */
export interface UserInfo {
  userId: string;
  userName: string;
  role: string;
  unitCode: string;
  unitName: string;
  bankCode: string;
  bankName: string;
}

/** Form mode cho S02 */
export type FormMode = 'create' | 'edit' | 'clone' | 'view';
