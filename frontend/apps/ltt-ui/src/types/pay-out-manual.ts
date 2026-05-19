/**
 * FT-001 PAY.OUT.MANUAL — TypeScript type definitions.
 * All field names use UPPER_SNAKE_CASE per spec section B4.
 * Types match openapi.yaml schemas exactly.
 */

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

/** Payment order lifecycle states (Section 5.1 of 02-design.md) */
export type OrderStatus =
  | "DRAFT"
  | "READY_FOR_APPROVAL"
  | "PENDING_APPROVER"
  | "APPROVED"
  | "RETURNED_TO_MAKER"
  | "REJECTED"
  | "DELETED";

/** Payment channel */
export type OrderChannel = "LNH" | "TTSP" | "LIEN_KHO_BAC";

/** LNH transaction sub-type. Required when CHANNEL = LNH. */
export type LnhTransactionType = "LTT01" | "LTT02" | "LTT03" | "LTT04";

/** Expense type code */
export type ExpType = "EXP01" | "EXP02" | "EXP03" | "EXP04" | "EXP05";

/** Attachment document type classification */
export type DocType =
  | "CHUNG_TU_GOC"
  | "HOP_DONG"
  | "HOA_DON"
  | "BANG_KE"
  | "VAN_BAN_KHAC";

/** Workflow action type in approval history */
export type ApprovalAction =
  | "CREATE"
  | "UPDATE"
  | "SUBMIT"
  | "CHECK_APPROVE"
  | "APPROVE"
  | "RETURN_BY_CHECKER"
  | "REJECT_BY_CHECKER"
  | "RETURN_BY_APPROVER"
  | "REJECT_BY_APPROVER"
  | "DELETE";

/** Role that performed the workflow action */
export type PerformedRole = "MAKER" | "CHECKER" | "APPROVER";

/** Export file format */
export type ExportFormat = "XLSX" | "PDF" | "CSV";

// ---------------------------------------------------------------------------
// COA Line
// ---------------------------------------------------------------------------

/** COA line request (for create/update payloads) */
export interface PayOrderLineRequest {
  GL_SEGMENT1?: string;
  GL_SEGMENT2: string;
  GL_SEGMENT3: string;
  GL_SEGMENT4?: string;
  GL_SEGMENT5?: string;
  GL_SEGMENT6?: string;
  GL_SEGMENT7?: string;
  GL_SEGMENT8?: string;
  GL_SEGMENT9?: string;
  GL_SEGMENT10?: string;
  GL_SEGMENT11?: string;
  GL_SEGMENT12?: string;
  LINE_DESCRIPTION: string;
  LINE_AMOUNT: number;
}

/** COA line response (from server, includes server-generated fields) */
export interface PayOrderLine {
  ID: string;
  ORDER_ID: string;
  LINE_NO: number;
  GL_SEGMENT1?: string;
  GL_SEGMENT2: string;
  GL_SEGMENT3: string;
  GL_SEGMENT4?: string;
  GL_SEGMENT5?: string;
  GL_SEGMENT6?: string;
  GL_SEGMENT7?: string;
  GL_SEGMENT8?: string;
  GL_SEGMENT9?: string;
  GL_SEGMENT10?: string;
  GL_SEGMENT11?: string;
  GL_SEGMENT12?: string;
  CCID_KEY?: string;
  LINE_DESCRIPTION: string;
  LINE_AMOUNT: number;
  CREATED_AT?: string;
  UPDATED_AT?: string;
}

// ---------------------------------------------------------------------------
// Main Order Type
// ---------------------------------------------------------------------------

/** PayOutManual — the full payment order (matches PayOrderDetailResponse) */
export interface PayOutManual {
  ID: string;
  VERSION: number;
  STATUS: OrderStatus;
  REF_NO: string;
  CHANNEL: OrderChannel;
  ORDER_TYPE?: string;
  LNH_TRANSACTION_TYPE?: LnhTransactionType;
  SENDER: string;
  RECEIVER: string;
  PAYMENT_DATE: string;
  AMOUNT: number;
  CURRENCY_CODE: string;
  EXCHANGE_RATE?: number;
  ORIGIN_NUM?: string;
  TRANSACTION_DATE?: string;
  EXP_TYPE?: ExpType;
  FN_CODE1?: string;
  FN_CODE2?: string;
  FN_AMOUNT?: number;
  DESCRIPTION: string;

  // Sender info (Tab B1.3)
  SENDER_NAME: string;
  SENDER_ADDRESS: string;
  SENDER_GL_SEGMENT2: string;
  SENDER_NUM?: string;
  SENDER_BANK_CODE: string;
  SENDER_IDENTIFY_ID?: string;
  SENDER_ISSUED_DATE?: string;
  SENDER_ISSUED_PLACE?: string;
  TPCP_CODE?: string;

  // Receiver info (Tab B1.4)
  RECEIVER_NAME: string;
  RECEIVER_ADDRESS?: string;
  RECEIVER_GL_SEGMENT2: string;
  RECEIVER_BANK_CODE: string;
  RECEIVER_ACCOUNT_NAME: string;
  RECEIVER_IDENTIFY_ID?: string;
  RECEIVER_ISSUED_DATE?: string;
  RECEIVER_ISSUED_PLACE?: string;

  // COA Lines
  LINES: PayOrderLine[];

  // Workflow attribution
  KBNN_ID: string;
  CREATED_BY: string;
  CREATED_AT: string;
  CREATED_IP?: string;
  UPDATED_BY?: string;
  UPDATED_AT?: string;
  UPDATED_IP?: string;
  CHECKER_ID?: string;
  CHECKER_ACTION_AT?: string;
  CHECKER_COMMENT?: string;
  APPROVER_ID?: string;
  APPROVER_ACTION_AT?: string;
  APPROVER_COMMENT?: string;

  // Soft delete info
  DELETE_REASON?: string;
  DELETED_BY?: string;
  DELETED_AT?: string;

  // Attachments summary
  ATTACHMENT_COUNT?: number;
}

// ---------------------------------------------------------------------------
// List Item (summary for list endpoint)
// ---------------------------------------------------------------------------

export interface PayOrderListItem {
  ID: string;
  VERSION: number;
  STATUS: OrderStatus;
  REF_NO: string;
  CHANNEL: OrderChannel;
  ORDER_TYPE?: string;
  SENDER?: string;
  RECEIVER?: string;
  PAYMENT_DATE: string;
  AMOUNT: number;
  CURRENCY_CODE: string;
  DESCRIPTION: string;
  KBNN_ID: string;
  CREATED_BY: string;
  CREATED_AT: string;
  UPDATED_AT?: string;
  CHECKER_ID?: string;
  APPROVER_ID?: string;
  SENDER_NAME?: string;
  RECEIVER_NAME?: string;
  ATTACHMENT_COUNT?: number;
}

// ---------------------------------------------------------------------------
// Attachment
// ---------------------------------------------------------------------------

export interface PayOrderAttachment {
  ID: string;
  ORDER_ID: string;
  FILE_NAME: string;
  DOC_TYPE: DocType;
  NOTE?: string;
  FILE_PATH: string;
  FILE_SIZE: number;
  CONTENT_TYPE: string;
  FILE_HASH: string;
  UPLOADED_BY: string;
  UPLOADED_AT: string;
  IS_DELETED?: boolean;
}

// ---------------------------------------------------------------------------
// Approval / Workflow
// ---------------------------------------------------------------------------

/** Single entry in the approval history timeline */
export interface ApprovalStep {
  STEP_NO: number;
  ACTION: ApprovalAction;
  FROM_STATUS?: OrderStatus;
  TO_STATUS: OrderStatus;
  PERFORMED_BY: string;
  PERFORMED_ROLE: PerformedRole;
  PERFORMED_AT: string;
  PERFORMED_IP?: string;
  REASON?: string;
  VERSION_BEFORE?: number;
  VERSION_AFTER?: number;
}

/** Response from GET /approval-status */
export interface ApprovalStatusResponse {
  ORDER_ID: string;
  CURRENT_STATUS: OrderStatus;
  STEPS: ApprovalStep[];
}

/** Alias for hook consumers — same shape as ApprovalStep */
export type ApprovalStatusEntry = ApprovalStep;

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  ID: number;
  ENTITY_TYPE: string;
  ENTITY_ID: string;
  ACTION: string;
  PERFORMED_BY: string;
  PERFORMED_AT: string;
  IP_ADDRESS?: string;
  USER_AGENT?: string;
  TRACE_ID?: string;
  OLD_VALUE?: string;
  NEW_VALUE?: string;
  VERSION_BEFORE?: number;
  VERSION_AFTER?: number;
  PREV_HASH?: string;
  HASH: string;
  GENERATED_BY?: string;
}

// ---------------------------------------------------------------------------
// Request Types
// ---------------------------------------------------------------------------

/** POST /api/pay-out-manual — create order */
export interface CreateOrderRequest {
  CHANNEL: OrderChannel;
  ORDER_TYPE?: string;
  LNH_TRANSACTION_TYPE?: LnhTransactionType;
  SENDER: string;
  RECEIVER: string;
  PAYMENT_DATE: string;
  AMOUNT: number;
  CURRENCY_CODE?: string;
  EXCHANGE_RATE?: number;
  ORIGIN_NUM?: string;
  TRANSACTION_DATE?: string;
  EXP_TYPE?: ExpType;
  FN_CODE1?: string;
  FN_CODE2?: string;
  FN_AMOUNT?: number;
  DESCRIPTION: string;
  LINES: PayOrderLineRequest[];

  // Sender info
  SENDER_NAME: string;
  SENDER_ADDRESS: string;
  SENDER_GL_SEGMENT2: string;
  SENDER_NUM?: string;
  SENDER_BANK_CODE: string;
  SENDER_IDENTIFY_ID?: string;
  SENDER_ISSUED_DATE?: string;
  SENDER_ISSUED_PLACE?: string;
  TPCP_CODE?: string;

  // Receiver info
  RECEIVER_NAME: string;
  RECEIVER_ADDRESS?: string;
  RECEIVER_GL_SEGMENT2: string;
  RECEIVER_BANK_CODE: string;
  RECEIVER_ACCOUNT_NAME: string;
  RECEIVER_IDENTIFY_ID?: string;
  RECEIVER_ISSUED_DATE?: string;
  RECEIVER_ISSUED_PLACE?: string;
}

/** PUT /api/pay-out-manual/{id} — update order */
export interface UpdateOrderRequest {
  CHANNEL?: OrderChannel;
  ORDER_TYPE?: string;
  LNH_TRANSACTION_TYPE?: LnhTransactionType;
  SENDER?: string;
  RECEIVER?: string;
  PAYMENT_DATE?: string;
  AMOUNT?: number;
  CURRENCY_CODE?: string;
  EXCHANGE_RATE?: number;
  ORIGIN_NUM?: string;
  TRANSACTION_DATE?: string;
  EXP_TYPE?: ExpType;
  FN_CODE1?: string;
  FN_CODE2?: string;
  FN_AMOUNT?: number;
  DESCRIPTION?: string;
  LINES?: PayOrderLineRequest[];

  SENDER_NAME?: string;
  SENDER_ADDRESS?: string;
  SENDER_GL_SEGMENT2?: string;
  SENDER_NUM?: string;
  SENDER_BANK_CODE?: string;
  SENDER_IDENTIFY_ID?: string;
  SENDER_ISSUED_DATE?: string;
  SENDER_ISSUED_PLACE?: string;
  TPCP_CODE?: string;

  RECEIVER_NAME?: string;
  RECEIVER_ADDRESS?: string;
  RECEIVER_GL_SEGMENT2?: string;
  RECEIVER_BANK_CODE?: string;
  RECEIVER_ACCOUNT_NAME?: string;
  RECEIVER_IDENTIFY_ID?: string;
  RECEIVER_ISSUED_DATE?: string;
  RECEIVER_ISSUED_PLACE?: string;
}

/** DELETE /api/pay-out-manual/{id} — soft-delete order */
export interface DeleteOrderRequest {
  DELETE_REASON: string;
  CONFIRMED: boolean;
}

/** POST submit / check-approve / approve — optional comment body */
export interface WorkflowActionRequest {
  COMMENT?: string;
}

/** POST return / reject — reason required */
export interface ReturnRejectRequest {
  REASON: string;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export interface ExportFilters {
  STATUS?: OrderStatus[];
  CHANNEL?: OrderChannel;
  PAYMENT_DATE_FROM?: string;
  PAYMENT_DATE_TO?: string;
  AMOUNT_FROM?: number;
  AMOUNT_TO?: number;
  REF_NO?: string;
  CREATED_BY?: string;
  KBNN_ID?: string;
}

export interface ExportRequest {
  FORMAT: ExportFormat;
  FILTERS?: ExportFilters;
  COLUMNS?: string[];
}

// ---------------------------------------------------------------------------
// List / Pagination
// ---------------------------------------------------------------------------

export interface ListOrdersParams {
  page?: number;
  size?: number;
  sort?: string[];
  STATUS?: string;
  CHANNEL?: OrderChannel;
  PAYMENT_DATE_FROM?: string;
  PAYMENT_DATE_TO?: string;
  AMOUNT_FROM?: number;
  AMOUNT_TO?: number;
  REF_NO?: string;
  CREATED_BY?: string;
  KBNN_ID?: string;
}

export interface PaginationMeta {
  TOTAL_ELEMENTS: number;
  TOTAL_PAGES: number;
  NUMBER: number;
  SIZE: number;
}

export interface PageResponse<T> {
  CONTENT: T[];
  PAGE: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export interface ErrorDetail {
  FIELD?: string;
  MESSAGE?: string;
  [key: string]: unknown;
}

export interface ErrorResponse {
  TRACE_ID: string;
  TIMESTAMP: string;
  CODE: string;
  MESSAGE: string;
  DETAILS?: ErrorDetail[];
}

// ---------------------------------------------------------------------------
// CCID Validation
// ---------------------------------------------------------------------------

export interface CcidSegmentInput {
  GL_SEGMENT1?: string;
  GL_SEGMENT2: string;
  GL_SEGMENT3: string;
  GL_SEGMENT4?: string;
  GL_SEGMENT5?: string;
  GL_SEGMENT6?: string;
  GL_SEGMENT7?: string;
  GL_SEGMENT8?: string;
  GL_SEGMENT9?: string;
  GL_SEGMENT10?: string;
  GL_SEGMENT11?: string;
  GL_SEGMENT12?: string;
}

export interface CcidLineError {
  SEGMENT: string;
  MESSAGE: string;
}

export interface CcidLineResult {
  LINE_INDEX: number;
  CCID_KEY?: string;
  VALID: boolean;
  ERRORS?: CcidLineError[];
}

export interface CcidValidationResponse {
  VALID: boolean;
  RESULTS: CcidLineResult[];
}

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

export interface LookupEntry {
  CODE: string;
  NAME: string;
  PARENT_CODE?: string;
  EXTRA?: Record<string, unknown>;
}
