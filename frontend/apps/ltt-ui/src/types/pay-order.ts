export type PayOrderStatus =
  | "DRAFT"
  | "READY_FOR_APPROVAL"
  | "PENDING_APPROVER"
  | "APPROVED"
  | "RETURNED_TO_MAKER"
  | "REJECTED"
  | "DELETED";

export type ChannelCode = "LNH" | "TTSP" | "LIEN_KHO_BAC";

export interface PayOrderLineRequest {
  lineNum: number;
  lineAmount: number;
  lineDescription?: string;
  ccidSegment1: string;
  ccidSegment2: string;
  ccidSegment3: string;
  ccidSegment4: string;
  ccidSegment5: string;
  ccidSegment6: string;
  ccidSegment7: string;
  ccidSegment8: string;
  ccidSegment9: string;
  ccidSegment10: string;
  ccidSegment11: string;
  ccidSegment12: string;
}

export interface PayOrderLineResponse extends PayOrderLineRequest {
  id: string;
  ccidValid: boolean;
}

export interface PayOrderRequest {
  channel: ChannelCode;
  orderType?: string;
  lnhTransactionType?: string;
  sender: string;
  receiver: string;
  paymentDate: string; // ISO date string
  currencyCode: string;
  exchangeRate?: number;
  originNum?: string;
  transactionDate?: string;
  expType?: string;
  fnCode1?: string;
  fnCode2?: string;
  fnAmount?: number;
  description: string;
  senderName: string;
  senderAddress: string;
  senderGlSegment2: string;
  senderNum?: string;
  senderBankCode: string;
  senderIdentifyId?: string;
  senderIssuedDate?: string;
  senderIssuedPlace?: string;
  tpcpCode?: string;
  receiverName: string;
  receiverAddress?: string;
  receiverGlSegment2: string;
  receiverBankCode: string;
  receiverAccountName: string;
  receiverIdentifyId?: string;
  receiverIssuedDate?: string;
  receiverIssuedPlace?: string;
  lines: PayOrderLineRequest[];
}

export interface PayOrderResponse extends PayOrderRequest {
  id: string;
  version: number;
  status: PayOrderStatus;
  refNo: string;
  amount: number;
  kbnnId: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  checkerId?: string;
  checkerActionAt?: string;
  checkerComment?: string;
  approverId?: string;
  approverActionAt?: string;
  approverComment?: string;
  deleteReason?: string;
  deletedBy?: string;
  deletedAt?: string;
  attachmentCount: number;
  lines: PayOrderLineResponse[];
}

export interface PayOrderSummary {
  id: string;
  version: number;
  status: PayOrderStatus;
  refNo: string;
  channel: ChannelCode;
  paymentDate: string;
  amount: number;
  currencyCode: string;
  receiverName: string;
  description: string;
  createdBy: string;
  createdAt: string;
  kbnnId: string;
  attachmentCount: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface AttachmentResponse {
  id: string;
  orderId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  sha256: string;
  uploadedBy: string;
  uploadedAt: string;
  isDeleted: boolean;
}

export interface ApprovalStep {
  step: "MAKER" | "CHECKER" | "APPROVER";
  userId?: string;
  userName?: string;
  actionAt?: string;
  action?: string;
  comment?: string;
  isCompleted: boolean;
}

export interface ApprovalStatusResponse {
  orderId: string;
  status: PayOrderStatus;
  steps: ApprovalStep[];
  currentStep?: string;
}

export interface AuditLogEntry {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  ipAddress?: string;
  versionBefore?: number;
  versionAfter?: number;
  payload?: unknown;
}

export interface LookupItem {
  code: string;
  name: string;
  extra?: Record<string, unknown>;
}
export interface LookupResult {
  content: LookupItem[];
  totalElements: number;
}
