// ============================================================================
// API Types — TT.OUT.MANUAL
// Response types tu OpenAPI api-internal-v1.yaml
// ============================================================================

/** Phan trang danh sach LTT — match Spring Data Page format */
export interface PaymentOrderListResponse {
  content: import('./payment-order').PaymentOrderSummary[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Audit log entry */
export interface AuditEntry {
  id: string;
  paymentOrderId: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  previousStatus?: string;
  newStatus?: string;
  version?: number;
  diffs?: {
    field: string;
    oldValue?: string;
    newValue?: string;
  }[];
  reason?: string;
  ipAddress?: string;
  auditHash: string;
}

/** Phan trang audit trail */
export interface AuditTrailResponse {
  content: AuditEntry[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

/** Response xoa LTT */
export interface DeleteResponse {
  id: string;
  status: string;
  deletedAt: string;
}

/** Thong tin so du */
export interface BalanceResponse {
  accountNumber: string;
  currency: string;
  balance: number;
  holdAmount: number;
  availableBalance: number;
  asOfTimestamp: string;
}

/** Danh muc item */
export interface RefDataItem {
  code: string;
  name: string;
  description?: string;
  status: string;
}

/** COA segment item */
export interface CoaSegmentItem {
  code: string;
  name: string;
  channel?: string;
  status: string;
  description?: string;
}

/** COA segments response */
export interface CoaSegmentsResponse {
  segmentType: string;
  items: CoaSegmentItem[];
}

/** Loi response chung */
export interface ErrorResponse {
  code: string;
  message: string;
  traceId?: string;
  timestamp?: string;
}

/** Loi validate nghiep vu */
export interface ValidationErrorResponse {
  code: string;
  message: string;
  traceId?: string;
  timestamp?: string;
  violations: {
    rule: string;
    field: string;
    message: string;
  }[];
}

/** Param tra cuu danh sach LTT */
export interface PaymentOrderListParams {
  page?: number;
  size?: number;
  sort?: string;
  channel?: string;
  orderType?: string;
  status?: string;
  unitCode?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  requestNumber?: string;
  senderBankCode?: string;
  receiverBankCode?: string;
  amountFrom?: number;
  amountTo?: number;
}
