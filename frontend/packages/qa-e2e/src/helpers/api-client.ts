/**
 * @kb/qa-e2e/helpers/api-client
 *
 * Typed API helper class wrapping fetch for all 20 FT-001 endpoints.
 * Mirrors the FE API client interface for consistent request/response handling.
 *
 * Endpoints reference: features/FT-001/02-design.md Section 2.1
 * Auth: JWT Bearer token injection via constructor.
 * Concurrency: X-Idempotency-Key on mutating requests (ADR-0005).
 * Optimistic lock: If-Match header on PUT/DELETE/state-actions (ADR-0004).
 */

import { v4 as uuidv4 } from "uuid";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Channel = "LNH" | "TTSP" | "LIEN_KHO_BAC";
export type OrderStatus =
  | "DRAFT"
  | "READY_FOR_APPROVAL"
  | "PENDING_APPROVER"
  | "APPROVED"
  | "RETURNED_TO_MAKER"
  | "REJECTED"
  | "DELETED";

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

export type LookupType = "BANK" | "USER" | "DVQHNS" | "CURRENCY" | "COA";

export type DocType =
  | "CHUNG_TU_GOC"
  | "HOP_DONG"
  | "HOA_DON"
  | "BANG_KE"
  | "VAN_BAN_KHAC";

/** COA line segment structure — 12 segments */
export interface CoaLine {
  id?: string;
  lineNo: number;
  glSegment1?: string;
  glSegment2: string;
  glSegment3: string;
  glSegment4?: string;
  glSegment5?: string;
  glSegment6?: string;
  glSegment7?: string;
  glSegment8?: string;
  glSegment9?: string;
  glSegment10?: string;
  glSegment11?: string;
  glSegment12?: string;
  ccidKey?: string;
  lineDescription: string;
  lineAmount: number;
}

/** Pay Order header — maps to LTT_PAY_ORDER columns */
export interface PayOrder {
  id: string;
  version: number;
  status: OrderStatus;
  refNo: string;
  channel: Channel;
  orderType?: string;
  lnhTransactionType?: string;
  sender: string;
  receiver: string;
  paymentDate: string;
  amount: number;
  currencyCode: string;
  exchangeRate?: number;
  originNum?: string;
  transactionDate?: string;
  expType?: string;
  fnCode1?: string;
  fnCode2?: string;
  fnAmount?: number;
  description: string;
  // Tab B1.3: Sender info
  senderName: string;
  senderAddress: string;
  senderGlSegment2: string;
  senderNum?: string;
  senderBankCode: string;
  senderIdentifyId?: string;
  senderIssuedDate?: string;
  senderIssuedPlace?: string;
  tpcpCode?: string;
  // Tab B1.4: Receiver info
  receiverName: string;
  receiverAddress?: string;
  receiverGlSegment2: string;
  receiverBankCode: string;
  receiverAccountName: string;
  receiverIdentifyId?: string;
  receiverIssuedDate?: string;
  receiverIssuedPlace?: string;
  // Workflow attribution
  kbnnId: string;
  createdBy: string;
  createdAt: string;
  createdIp?: string;
  updatedBy?: string;
  updatedAt?: string;
  updatedIp?: string;
  checkerId?: string;
  checkerActionAt?: string;
  checkerComment?: string;
  approverId?: string;
  approverActionAt?: string;
  approverComment?: string;
  // Soft delete
  deleteReason?: string;
  deletedBy?: string;
  deletedAt?: string;
  deletedIp?: string;
  // Lines
  lines?: CoaLine[];
}

/** Payload for creating a new pay order */
export interface CreatePayOrderPayload {
  channel: Channel;
  orderType?: string;
  lnhTransactionType?: string;
  sender: string;
  receiver: string;
  paymentDate: string;
  amount: number;
  currencyCode?: string;
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
  kbnnId: string;
  lines?: Omit<CoaLine, "id">[];
}

/** Payload for updating a pay order */
export interface UpdatePayOrderPayload extends Partial<CreatePayOrderPayload> {
  version: number;
}

/** Delete payload */
export interface DeletePayOrderPayload {
  deleteReason: string;
  confirmed: boolean;
}

/** Return/Reject payload */
export interface ReturnRejectPayload {
  reason: string;
}

/** Attachment metadata */
export interface Attachment {
  id: string;
  orderId: string;
  fileName: string;
  docType: DocType;
  note?: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  fileHash: string;
  uploadedBy: string;
  uploadedAt: string;
  isDeleted: boolean;
}

/** Approval history entry */
export interface ApprovalEntry {
  id: string;
  orderId: string;
  stepNo: number;
  action: ApprovalAction;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  performedBy: string;
  performedRole: "MAKER" | "CHECKER" | "APPROVER";
  performedAt: string;
  performedIp?: string;
  reason?: string;
  versionBefore?: number;
  versionAfter?: number;
}

/** Audit log entry */
export interface AuditLogEntry {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  ipAddress?: string;
  traceId?: string;
  oldValue?: string;
  newValue?: string;
  versionBefore?: number;
  versionAfter?: number;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** List filter params */
export interface ListFilterParams {
  status?: OrderStatus[];
  channel?: Channel[];
  fromDate?: string;
  toDate?: string;
  dateField?: string;
  amountFrom?: number;
  amountTo?: number;
  refNo?: string;
  sender?: string;
  kbnnId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  includeDeleted?: boolean;
}

/** Standard error response */
export interface ApiErrorResponse {
  traceId: string;
  timestamp: string;
  code: string;
  message: string;
  details?: Array<Record<string, unknown>>;
}

/** CCID validation request */
export interface CcidValidationRequest {
  lines: Array<{
    glSegment1?: string;
    glSegment2: string;
    glSegment3: string;
    glSegment4?: string;
    glSegment5?: string;
    glSegment6?: string;
    glSegment7?: string;
    glSegment8?: string;
    glSegment9?: string;
    glSegment10?: string;
    glSegment11?: string;
    glSegment12?: string;
  }>;
}

/** CCID validation result */
export interface CcidValidationResult {
  valid: boolean;
  errors?: Array<{
    lineNo: number;
    segments: string;
    message: string;
  }>;
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

export class KbApiClient {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.authToken = authToken;
  }

  // -- Internal helpers -----------------------------------------------------

  private headers(extra?: Record<string, string>): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.authToken}`,
      "X-Request-Id": uuidv4(),
      ...extra,
    };
  }

  private idempotencyHeaders(): Record<string, string> {
    return { "X-Idempotency-Key": uuidv4() };
  }

  private ifMatchHeaders(version: number): Record<string, string> {
    return { "If-Match": `"${version}"` };
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      headers?: Record<string, string>;
      expectStatus?: number;
    },
  ): Promise<{ status: number; body: T; headers: Headers }> {
    const url = `${this.baseUrl}${path}`;
    const resp = await fetch(url, {
      method,
      headers: this.headers(options?.headers),
      body:
        options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    let body: T;
    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = (await resp.json()) as T;
    } else {
      body = {} as T;
    }

    if (options?.expectStatus && resp.status !== options.expectStatus) {
      const err = body as unknown as ApiErrorResponse;
      throw Object.assign(
        new Error(
          err.message || `Expected ${options.expectStatus}, got ${resp.status}`,
        ),
        { status: resp.status, body: err },
      );
    }

    return { status: resp.status, body, headers: resp.headers };
  }

  // -- 1. POST /api/pay-out-manual (Create) --------------------------------

  async createOrder(
    payload: CreatePayOrderPayload,
  ): Promise<{ status: number; body: PayOrder | ApiErrorResponse }> {
    return this.request<PayOrder | ApiErrorResponse>(
      "POST",
      "/api/pay-out-manual",
      {
        body: payload,
        headers: this.idempotencyHeaders(),
      },
    );
  }

  /** Create with explicit idempotency key for testing idempotency */
  async createOrderWithKey(
    payload: CreatePayOrderPayload,
    idempotencyKey: string,
  ): Promise<{ status: number; body: PayOrder | ApiErrorResponse }> {
    return this.request<PayOrder | ApiErrorResponse>(
      "POST",
      "/api/pay-out-manual",
      {
        body: payload,
        headers: { "X-Idempotency-Key": idempotencyKey },
      },
    );
  }

  // -- 2. GET /api/pay-out-manual/{id} (View) ------------------------------

  async getOrder(id: string): Promise<{
    status: number;
    body: PayOrder | ApiErrorResponse;
    etag?: string;
  }> {
    const result = await this.request<PayOrder | ApiErrorResponse>(
      "GET",
      `/api/pay-out-manual/${id}`,
    );
    return {
      ...result,
      etag: result.headers.get("ETag") ?? undefined,
    };
  }

  // -- 3. PUT /api/pay-out-manual/{id} (Edit) ------------------------------

  async updateOrder(
    id: string,
    payload: UpdatePayOrderPayload,
  ): Promise<{ status: number; body: PayOrder | ApiErrorResponse }> {
    return this.request<PayOrder | ApiErrorResponse>(
      "PUT",
      `/api/pay-out-manual/${id}`,
      {
        body: payload,
        headers: {
          ...this.ifMatchHeaders(payload.version),
          ...this.idempotencyHeaders(),
        },
      },
    );
  }

  // -- 4. DELETE /api/pay-out-manual/{id} (Soft delete) --------------------

  async deleteOrder(
    id: string,
    payload: DeletePayOrderPayload,
    version: number,
  ): Promise<{ status: number; body: PayOrder | ApiErrorResponse }> {
    return this.request<PayOrder | ApiErrorResponse>(
      "DELETE",
      `/api/pay-out-manual/${id}`,
      {
        body: payload,
        headers: {
          ...this.ifMatchHeaders(version),
          ...this.idempotencyHeaders(),
        },
      },
    );
  }

  // -- 5. POST /api/pay-out-manual/{id}/submit (Submit) --------------------

  async submitOrder(
    id: string,
    version: number,
  ): Promise<{ status: number; body: PayOrder | ApiErrorResponse }> {
    return this.request<PayOrder | ApiErrorResponse>(
      "POST",
      `/api/pay-out-manual/${id}/submit`,
      {
        headers: {
          ...this.ifMatchHeaders(version),
          ...this.idempotencyHeaders(),
        },
      },
    );
  }

  // -- 6. POST /api/pay-out-manual/{id}/check-approve (Checker) ------------

  async checkApprove(
    id: string,
    version: number,
  ): Promise<{ status: number; body: PayOrder | ApiErrorResponse }> {
    return this.request<PayOrder | ApiErrorResponse>(
      "POST",
      `/api/pay-out-manual/${id}/check-approve`,
      {
        headers: {
          ...this.ifMatchHeaders(version),
          ...this.idempotencyHeaders(),
        },
      },
    );
  }

  // -- 7. POST /api/pay-out-manual/{id}/approve (Approver) -----------------

  async approve(
    id: string,
    version: number,
  ): Promise<{ status: number; body: PayOrder | ApiErrorResponse }> {
    return this.request<PayOrder | ApiErrorResponse>(
      "POST",
      `/api/pay-out-manual/${id}/approve`,
      {
        headers: {
          ...this.ifMatchHeaders(version),
          ...this.idempotencyHeaders(),
        },
      },
    );
  }

  // -- 8. POST /api/pay-out-manual/{id}/return (Return) --------------------

  async returnOrder(
    id: string,
    payload: ReturnRejectPayload,
    version: number,
  ): Promise<{ status: number; body: PayOrder | ApiErrorResponse }> {
    return this.request<PayOrder | ApiErrorResponse>(
      "POST",
      `/api/pay-out-manual/${id}/return`,
      {
        body: payload,
        headers: {
          ...this.ifMatchHeaders(version),
          ...this.idempotencyHeaders(),
        },
      },
    );
  }

  // -- 9. POST /api/pay-out-manual/{id}/reject (Reject) --------------------

  async rejectOrder(
    id: string,
    payload: ReturnRejectPayload,
    version: number,
  ): Promise<{ status: number; body: PayOrder | ApiErrorResponse }> {
    return this.request<PayOrder | ApiErrorResponse>(
      "POST",
      `/api/pay-out-manual/${id}/reject`,
      {
        body: payload,
        headers: {
          ...this.ifMatchHeaders(version),
          ...this.idempotencyHeaders(),
        },
      },
    );
  }

  // -- 10. POST /api/pay-out-manual/{id}/copy (Copy) -----------------------

  async copyOrder(
    id: string,
  ): Promise<{ status: number; body: PayOrder | ApiErrorResponse }> {
    return this.request<PayOrder | ApiErrorResponse>(
      "POST",
      `/api/pay-out-manual/${id}/copy`,
      {
        headers: this.idempotencyHeaders(),
      },
    );
  }

  /** Copy with explicit idempotency key for testing */
  async copyOrderWithKey(
    id: string,
    idempotencyKey: string,
  ): Promise<{ status: number; body: PayOrder | ApiErrorResponse }> {
    return this.request<PayOrder | ApiErrorResponse>(
      "POST",
      `/api/pay-out-manual/${id}/copy`,
      {
        headers: { "X-Idempotency-Key": idempotencyKey },
      },
    );
  }

  // -- 11. GET /api/pay-out-manual (List) -----------------------------------

  async listOrders(params?: ListFilterParams): Promise<{
    status: number;
    body: PaginatedResponse<PayOrder> | ApiErrorResponse;
  }> {
    const query = new URLSearchParams();
    if (params) {
      if (params.status?.length) query.set("status", params.status.join(","));
      if (params.channel?.length)
        query.set("channel", params.channel.join(","));
      if (params.fromDate) query.set("fromDate", params.fromDate);
      if (params.toDate) query.set("toDate", params.toDate);
      if (params.dateField) query.set("dateField", params.dateField);
      if (params.amountFrom !== undefined)
        query.set("amountFrom", String(params.amountFrom));
      if (params.amountTo !== undefined)
        query.set("amountTo", String(params.amountTo));
      if (params.refNo) query.set("refNo", params.refNo);
      if (params.sender) query.set("sender", params.sender);
      if (params.kbnnId) query.set("kbnnId", params.kbnnId);
      if (params.page !== undefined) query.set("page", String(params.page));
      if (params.pageSize !== undefined)
        query.set("pageSize", String(params.pageSize));
      if (params.sortBy) query.set("sortBy", params.sortBy);
      if (params.sortDir) query.set("sortDir", params.sortDir);
      if (params.includeDeleted) query.set("includeDeleted", "true");
    }
    const qs = query.toString();
    const path = `/api/pay-out-manual${qs ? `?${qs}` : ""}`;
    return this.request<PaginatedResponse<PayOrder> | ApiErrorResponse>(
      "GET",
      path,
    );
  }

  // -- 12. POST /api/pay-out-manual/export (Export) -------------------------

  async exportOrders(
    params?: ListFilterParams,
  ): Promise<{ status: number; body: Blob | ApiErrorResponse }> {
    const resp = await fetch(`${this.baseUrl}/api/pay-out-manual/export`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(params ?? {}),
    });
    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = (await resp.json()) as ApiErrorResponse;
      return { status: resp.status, body };
    }
    const blob = await resp.blob();
    return { status: resp.status, body: blob };
  }

  // -- 13. POST /api/pay-out-manual/{id}/attachments (Upload) --------------

  async uploadAttachment(
    id: string,
    file: File,
    docType: DocType,
    note?: string,
  ): Promise<{ status: number; body: Attachment | ApiErrorResponse }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);
    if (note) formData.append("note", note);

    const resp = await fetch(
      `${this.baseUrl}/api/pay-out-manual/${id}/attachments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          "X-Idempotency-Key": uuidv4(),
          "X-Request-Id": uuidv4(),
        },
        body: formData,
      },
    );
    const body = contentTypeIncludes(resp)
      ? await resp.json()
      : ({} as Attachment);
    return { status: resp.status, body };
  }

  // -- 14. GET /api/pay-out-manual/{id}/attachments (List attachments) ------

  async listAttachments(
    id: string,
  ): Promise<{ status: number; body: Attachment[] | ApiErrorResponse }> {
    return this.request<Attachment[] | ApiErrorResponse>(
      "GET",
      `/api/pay-out-manual/${id}/attachments`,
    );
  }

  // -- 15. GET /api/pay-out-manual/{id}/attachments/{attachId} (Download) ---

  async downloadAttachment(
    id: string,
    attachId: string,
  ): Promise<{ status: number; body: Blob; headers: Headers }> {
    const resp = await fetch(
      `${this.baseUrl}/api/pay-out-manual/${id}/attachments/${attachId}`,
      {
        method: "GET",
        headers: this.headers(),
      },
    );
    return {
      status: resp.status,
      body: await resp.blob(),
      headers: resp.headers,
    };
  }

  // -- 16. DELETE /api/pay-out-manual/{id}/attachments/{attachId} -----------

  async deleteAttachment(
    id: string,
    attachId: string,
  ): Promise<{
    status: number;
    body: ApiErrorResponse | Record<string, unknown>;
  }> {
    return this.request<ApiErrorResponse | Record<string, unknown>>(
      "DELETE",
      `/api/pay-out-manual/${id}/attachments/${attachId}`,
      { headers: this.idempotencyHeaders() },
    );
  }

  // -- 17. GET /api/pay-out-manual/{id}/audit-log ---------------------------

  async getAuditLog(
    id: string,
  ): Promise<{ status: number; body: AuditLogEntry[] | ApiErrorResponse }> {
    return this.request<AuditLogEntry[] | ApiErrorResponse>(
      "GET",
      `/api/pay-out-manual/${id}/audit-log`,
    );
  }

  // -- 18. GET /api/pay-out-manual/{id}/approval-status ---------------------

  async getApprovalStatus(
    id: string,
  ): Promise<{ status: number; body: ApprovalEntry[] | ApiErrorResponse }> {
    return this.request<ApprovalEntry[] | ApiErrorResponse>(
      "GET",
      `/api/pay-out-manual/${id}/approval-status`,
    );
  }

  // -- 19. POST /api/pay-out-manual/{id}/validate-ccid ---------------------

  async validateCcid(
    id: string,
    payload: CcidValidationRequest,
  ): Promise<{
    status: number;
    body: CcidValidationResult | ApiErrorResponse;
  }> {
    return this.request<CcidValidationResult | ApiErrorResponse>(
      "POST",
      `/api/pay-out-manual/${id}/validate-ccid`,
      { body: payload },
    );
  }

  // -- 20. GET /api/pay-out-manual/lookup/{type} ----------------------------

  async lookup(
    type: LookupType,
    query?: string,
  ): Promise<{
    status: number;
    body: Array<Record<string, unknown>> | ApiErrorResponse;
  }> {
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    return this.request<Array<Record<string, unknown>> | ApiErrorResponse>(
      "GET",
      `/api/pay-out-manual/lookup/${type}${qs}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function contentTypeIncludes(resp: Response): boolean {
  const ct = resp.headers.get("content-type") || "";
  return ct.includes("application/json");
}
