// ============================================================================
// Enums — TT.OUT.MANUAL
// Trang thai LTT, Kenh, Loai lenh — sinh tu states.yaml
// ============================================================================

/** 15 trang thai LTT tu states.yaml */
export enum LttState {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_CONTROL = 'IN_CONTROL',
  RETURNED_TO_MAKER = 'RETURNED_TO_MAKER',
  RETURNED_TO_CHECKER = 'RETURNED_TO_CHECKER',
  APPROVED = 'APPROVED',
  SIGNED = 'SIGNED',
  SENT = 'SENT',
  SEND_FAILED = 'SEND_FAILED',
  CONFIRMED = 'CONFIRMED',
  POSTED = 'POSTED',
  POST_FAILED = 'POST_FAILED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
  BLOCKED = 'BLOCKED',
}

/** Kenh thanh toan */
export enum Channel {
  LNH = 'LNH',
  SP = 'SP',
  LKB = 'LKB',
}

/** Loai giao dich (chi LNH) */
export enum TransactionType {
  INTERNAL = 'INTERNAL',
  CROSS_BORDER = 'CROSS_BORDER',
}

/** Vai tro nguoi dung */
export enum UserRole {
  MAKER = 'MAKER',
  CHECKER = 'CHECKER',
  APPROVER = 'APPROVER',
  ADMIN = 'ADMIN',
}

/** Trang thai final */
export const FINAL_STATES: LttState[] = [
  LttState.POSTED,
  LttState.CANCELLED,
  LttState.REVERSED,
];

/** Trang thai cho Maker sua/xoa */
export const EDITABLE_STATES: LttState[] = [
  LttState.DRAFT,
  LttState.RETURNED_TO_MAKER,
];

/** Trang thai cho Checker thao tac */
export const CHECKER_STATES: LttState[] = [
  LttState.SUBMITTED,
  LttState.RETURNED_TO_CHECKER,
];

/** Trang thai cho Approver thao tac */
export const APPROVER_STATES: LttState[] = [
  LttState.IN_CONTROL,
  LttState.APPROVED,
  LttState.SIGNED,
  LttState.SEND_FAILED,
  LttState.POSTED,
];

/** Label cho trang thai (tieng Viet) */
export const STATE_LABELS: Record<LttState, string> = {
  [LttState.DRAFT]: 'Nhap',
  [LttState.SUBMITTED]: 'Cho kiem soat',
  [LttState.IN_CONTROL]: 'Cho phe duyet',
  [LttState.RETURNED_TO_MAKER]: 'Tra lai nguoi lap',
  [LttState.RETURNED_TO_CHECKER]: 'Tra lai kiem soat',
  [LttState.APPROVED]: 'Da phe duyet',
  [LttState.SIGNED]: 'Da ky so',
  [LttState.SENT]: 'Da gui',
  [LttState.SEND_FAILED]: 'Gui loi',
  [LttState.CONFIRMED]: 'Da xac nhan',
  [LttState.POSTED]: 'Da hach toan',
  [LttState.POST_FAILED]: 'Hach toan loi',
  [LttState.CANCELLED]: 'Da huy',
  [LttState.REVERSED]: 'Da dao',
  [LttState.BLOCKED]: 'Bi khoa',
};

/** Mau cho trang thai */
export const STATE_COLORS: Record<LttState, string> = {
  [LttState.DRAFT]: 'bg-gray-100 text-gray-800',
  [LttState.SUBMITTED]: 'bg-blue-100 text-blue-800',
  [LttState.IN_CONTROL]: 'bg-indigo-100 text-indigo-800',
  [LttState.RETURNED_TO_MAKER]: 'bg-orange-100 text-orange-800',
  [LttState.RETURNED_TO_CHECKER]: 'bg-yellow-100 text-yellow-800',
  [LttState.APPROVED]: 'bg-green-100 text-green-800',
  [LttState.SIGNED]: 'bg-teal-100 text-teal-800',
  [LttState.SENT]: 'bg-cyan-100 text-cyan-800',
  [LttState.SEND_FAILED]: 'bg-red-100 text-red-800',
  [LttState.CONFIRMED]: 'bg-emerald-100 text-emerald-800',
  [LttState.POSTED]: 'bg-green-200 text-green-900',
  [LttState.POST_FAILED]: 'bg-red-200 text-red-900',
  [LttState.CANCELLED]: 'bg-gray-200 text-gray-600',
  [LttState.REVERSED]: 'bg-purple-100 text-purple-800',
  [LttState.BLOCKED]: 'bg-red-300 text-red-900',
};
