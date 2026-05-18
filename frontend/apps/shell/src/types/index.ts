// ===== User Role =====
export type UserRole = 'MAKER' | 'CHECKER' | 'APPROVER' | 'ADMIN';

export interface RoleInfo {
  role: UserRole;
  label: string;
  shortLabel: string;
  color: string;
}

export const ROLES: RoleInfo[] = [
  { role: 'MAKER', label: 'Người lập', shortLabel: 'MK', color: '#2563eb' },
  { role: 'CHECKER', label: 'Người kiểm soát', shortLabel: 'CK', color: '#d97706' },
  { role: 'APPROVER', label: 'Người phê duyệt', shortLabel: 'AP', color: '#059669' },
  { role: 'ADMIN', label: 'Quản trị hệ thống', shortLabel: 'AD', color: '#7c3aed' },
];

// ===== Payment Order Status =====
export type PaymentOrderStatus =
  | 'DRAFT'
  | 'READY_FOR_APPROVAL'
  | 'PENDING_APPROVER'
  | 'APPROVED'
  | 'RETURNED_TO_MAKER'
  | 'REJECTED'
  | 'DELETED';

export type Channel = 'LNH' | 'TTSP';

export type CurrencyCode = 'VND' | 'USD' | 'EUR' | 'JPY';

export type TransactionType =
  | 'LENH_THONG_THUONG'
  | 'LENH_TRAI_PHIEU_CHINH_PHU'
  | 'LENH_THU_NSNN'
  | 'LENH_CHUYEN_KHOAN'
  | 'LENH_CHI_TM_KBNN'
  | 'LENH_CHI_TM_KH'
  | 'TT_NGOAI_TE';

// ===== Payment Order (List View) =====
export interface PaymentOrderListItem {
  id: string;
  refNo: string;
  channel: Channel;
  transactionType: TransactionType;
  createdDate: string;
  paymentDate: string;
  senderCode: string;
  senderName: string;
  receiverCode: string;
  receiverName: string;
  amount: number;
  currency: CurrencyCode;
  status: PaymentOrderStatus;
  createdBy: string;
  checkedBy: string;
  approvedBy: string;
  version: number;
}

// ===== Payment Order (Full Detail) =====
export interface PaymentOrderDetail extends PaymentOrderListItem {
  description: string;
  orginNum: string;
  transactionDate: string;
  sender: SenderInfo;
  receiver: ReceiverInfo;
  details: AccountingDetail[];
  attachments: Attachment[];
  approvalHistory: ApprovalHistoryEntry[];
  auditLog: AuditLogEntry[];
}

// ===== Sender Info =====
export interface SenderInfo {
  name: string;
  address: string;
  account: string;
  customerCode: string;
  bankCode: string;
  identifyId: string;
  issuedDate: string;
  issuedPlace: string;
  tpcpCode: string;
}

// ===== Receiver Info =====
export interface ReceiverInfo {
  name: string;
  address: string;
  account: string;
  bankName: string;
  bankCode: string;
  identifyId: string;
  issuedDate: string;
  issuedPlace: string;
}

// ===== Accounting Detail Line =====
export interface AccountingDetail {
  lineNo: number;
  glSegment1: string; // Ma quy
  glSegment2: string; // TK tu nhien
  glSegment3: string; // DVQHNS
  glSegment4: string; // Cap NS
  glSegment5: string; // Chuong
  glSegment6: string; // Nganh KT
  glSegment7: string; // NDKT
  glSegment8: string; // DB
  glSegment9: string; // CTMT
  glSegment10: string; // MN
  glSegment11: string; // Kho bac
  glSegment12: string; // DP
  description: string;
  amount: number;
}

// ===== Attachment =====
export interface Attachment {
  id: string;
  fileName: string;
  docType: string;
  note: string;
  fileSize: number;
  uploadedBy: string;
  uploadedDate: string;
  status: 'ACTIVE' | 'DELETED';
}

// ===== Approval History =====
export interface ApprovalHistoryEntry {
  id: string;
  actionDate: string;
  actor: string;
  actorName: string;
  actorRole: 'MAKER' | 'CHECKER' | 'APPROVER' | 'SYSTEM';
  action: string;
  statusFrom: PaymentOrderStatus;
  statusTo: PaymentOrderStatus;
  version: number;
  note: string;
  clientIp: string;
  hostName: string;
}

// ===== Audit Log =====
export interface AuditLogEntry {
  id: string;
  actionDate: string;
  actor: string;
  actorName: string;
  actorRole: string;
  action: string;
  statusFrom: string;
  statusTo: string;
  version: number;
  note: string;
  clientIp: string;
  changes: FieldChange[];
}

export interface FieldChange {
  field: string;
  oldValue: string;
  newValue: string;
}

// ===== Form State =====
export interface PaymentOrderFormData {
  channel: Channel;
  transactionType: TransactionType;
  senderCode: string;
  receiverCode: string;
  refNo: string;
  paymentDate: string;
  amount: number;
  currency: CurrencyCode;
  description: string;
  orginNum: string;
  transactionDate: string;
  sender: SenderInfo;
  receiver: ReceiverInfo;
  details: AccountingDetail[];
}

// ===== Filter State =====
export interface FilterState {
  channel: string;
  transactionType: string;
  refNo: string;
  status: string;
  senderCode: string;
  receiverCode: string;
  dateType: string;
  fromDate: string;
  toDate: string;
  amountFrom: string;
  amountTo: string;
  currency: string;
  createdBy: string;
}
