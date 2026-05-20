import { httpClient, uploadFile, downloadFile } from "./http-client";
import type {
  PayOutManual,
  PayOrderListItem,
  PayOrderAttachment,
  AuditLogEntry,
  ApprovalStatusEntry,
  ApprovalStatusResponse,
  CcidValidationResponse,
  CcidSegmentInput,
  LookupEntry,
  CreateOrderRequest,
  UpdateOrderRequest,
  DeleteOrderRequest,
  WorkflowActionRequest,
  ReturnRejectRequest,
  ExportRequest,
  ListOrdersParams,
  PageResponse,
  PayOrderLineRequest,
} from "../types/pay-out-manual";

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

const RESOURCE = "/pay-out-manual";

class PayOutManualClient {
  // -----------------------------------------------------------------------
  // 1. Create
  // -----------------------------------------------------------------------
  async create(
    data: CreateOrderRequest,
    idempotencyKey: string,
  ): Promise<PayOutManual> {
    const { data: result } = await httpClient<PayOutManual>(RESOURCE, {
      method: "POST",
      body: data,
      idempotencyKey,
    });
    return result;
  }

  // -----------------------------------------------------------------------
  // 2. Get by ID
  // -----------------------------------------------------------------------
  async getById(id: string): Promise<{ data: PayOutManual; etag: string }> {
    const { data, etag } = await httpClient<PayOutManual>(
      `${RESOURCE}/${encodeURIComponent(id)}`,
      { method: "GET" },
    );
    return { data, etag: etag || "" };
  }

  // -----------------------------------------------------------------------
  // 3. Update
  // -----------------------------------------------------------------------
  async update(
    id: string,
    data: UpdateOrderRequest,
    ifMatch: string,
    idempotencyKey: string,
  ): Promise<PayOutManual> {
    const { data: result } = await httpClient<PayOutManual>(
      `${RESOURCE}/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: data,
        ifMatch,
        idempotencyKey,
      },
    );
    return result;
  }

  // -----------------------------------------------------------------------
  // 4. Delete (soft)
  // -----------------------------------------------------------------------
  async delete(
    id: string,
    data: DeleteOrderRequest,
    ifMatch: string,
    idempotencyKey: string,
  ): Promise<PayOutManual> {
    const { data: result } = await httpClient<PayOutManual>(
      `${RESOURCE}/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        body: data,
        ifMatch,
        idempotencyKey,
      },
    );
    return result;
  }

  // -----------------------------------------------------------------------
  // 5. Submit (DRAFT/RETURNED_TO_MAKER -> READY_FOR_APPROVAL)
  // -----------------------------------------------------------------------
  async submit(
    id: string,
    ifMatch: string,
    idempotencyKey: string,
  ): Promise<PayOutManual> {
    const { data } = await httpClient<PayOutManual>(
      `${RESOURCE}/${encodeURIComponent(id)}/submit`,
      {
        method: "POST",
        ifMatch,
        idempotencyKey,
      },
    );
    return data;
  }

  // -----------------------------------------------------------------------
  // 6. Check-approve (READY_FOR_APPROVAL -> PENDING_APPROVER)
  // -----------------------------------------------------------------------
  async checkApprove(
    id: string,
    ifMatch: string,
    idempotencyKey: string,
    body?: WorkflowActionRequest,
  ): Promise<PayOutManual> {
    const { data } = await httpClient<PayOutManual>(
      `${RESOURCE}/${encodeURIComponent(id)}/check-approve`,
      {
        method: "POST",
        body,
        ifMatch,
        idempotencyKey,
      },
    );
    return data;
  }

  // -----------------------------------------------------------------------
  // 7. Approve (PENDING_APPROVER -> APPROVED)
  // -----------------------------------------------------------------------
  async approve(
    id: string,
    ifMatch: string,
    idempotencyKey: string,
    body?: WorkflowActionRequest,
  ): Promise<PayOutManual> {
    const { data } = await httpClient<PayOutManual>(
      `${RESOURCE}/${encodeURIComponent(id)}/approve`,
      {
        method: "POST",
        body,
        ifMatch,
        idempotencyKey,
      },
    );
    return data;
  }

  // -----------------------------------------------------------------------
  // 8. Return (READY_FOR_APPROVAL/PENDING_APPROVER -> RETURNED_TO_MAKER)
  // -----------------------------------------------------------------------
  async returnOrder(
    id: string,
    reason: string,
    ifMatch: string,
    idempotencyKey: string,
  ): Promise<PayOutManual> {
    const payload: ReturnRejectRequest = { REASON: reason };
    const { data } = await httpClient<PayOutManual>(
      `${RESOURCE}/${encodeURIComponent(id)}/return`,
      {
        method: "POST",
        body: payload,
        ifMatch,
        idempotencyKey,
      },
    );
    return data;
  }

  // -----------------------------------------------------------------------
  // 9. Reject (READY_FOR_APPROVAL/PENDING_APPROVER -> REJECTED)
  // -----------------------------------------------------------------------
  async reject(
    id: string,
    reason: string,
    ifMatch: string,
    idempotencyKey: string,
  ): Promise<PayOutManual> {
    const payload: ReturnRejectRequest = { REASON: reason };
    const { data } = await httpClient<PayOutManual>(
      `${RESOURCE}/${encodeURIComponent(id)}/reject`,
      {
        method: "POST",
        body: payload,
        ifMatch,
        idempotencyKey,
      },
    );
    return data;
  }

  // -----------------------------------------------------------------------
  // 10. Copy (clone into new DRAFT)
  // -----------------------------------------------------------------------
  async copy(id: string, idempotencyKey: string): Promise<PayOutManual> {
    const { data } = await httpClient<PayOutManual>(
      `${RESOURCE}/${encodeURIComponent(id)}/copy`,
      {
        method: "POST",
        idempotencyKey,
      },
    );
    return data;
  }

  // -----------------------------------------------------------------------
  // 11. List (paginated)
  // -----------------------------------------------------------------------
  async list(
    params: ListOrdersParams,
  ): Promise<PageResponse<PayOrderListItem>> {
    const queryParams: Record<
      string,
      string | string[] | number | boolean | undefined
    > = {};

    if (params.page !== undefined) queryParams.page = String(params.page);
    if (params.size !== undefined) queryParams.size = String(params.size);
    if (params.sort) queryParams.sort = params.sort;
    if (params.STATUS) queryParams.STATUS = params.STATUS;
    if (params.CHANNEL) queryParams.CHANNEL = params.CHANNEL;
    if (params.PAYMENT_DATE_FROM)
      queryParams.PAYMENT_DATE_FROM = params.PAYMENT_DATE_FROM;
    if (params.PAYMENT_DATE_TO)
      queryParams.PAYMENT_DATE_TO = params.PAYMENT_DATE_TO;
    if (params.AMOUNT_FROM !== undefined)
      queryParams.AMOUNT_FROM = String(params.AMOUNT_FROM);
    if (params.AMOUNT_TO !== undefined)
      queryParams.AMOUNT_TO = String(params.AMOUNT_TO);
    if (params.REF_NO) queryParams.REF_NO = params.REF_NO;
    if (params.CREATED_BY) queryParams.CREATED_BY = params.CREATED_BY;
    if (params.KBNN_ID) queryParams.KBNN_ID = params.KBNN_ID;

    const { data } = await httpClient<PageResponse<PayOrderListItem>>(
      RESOURCE,
      {
        method: "GET",
        params: queryParams,
      },
    );
    return data;
  }

  // -----------------------------------------------------------------------
  // 12. Export
  // -----------------------------------------------------------------------
  async exportOrders(params: ExportRequest): Promise<Blob> {
    const url = `${RESOURCE}/export`;
    return downloadFile(url, {
      method: "POST",
      body: params,
      idempotencyKey: crypto.randomUUID(),
    });
  }

  // -----------------------------------------------------------------------
  // 13. Upload attachment
  // -----------------------------------------------------------------------
  async uploadAttachment(
    id: string,
    file: File,
    docType: string,
    note?: string,
    idempotencyKey?: string,
  ): Promise<PayOrderAttachment> {
    const formData = new FormData();
    formData.append("FILE", file);
    formData.append("DOC_TYPE", docType);
    if (note) {
      formData.append("NOTE", note);
    }

    const { data } = await uploadFile<PayOrderAttachment>(
      `${RESOURCE}/${encodeURIComponent(id)}/attachments`,
      formData,
      { idempotencyKey: idempotencyKey || crypto.randomUUID() },
    );
    return data;
  }

  // -----------------------------------------------------------------------
  // 14. List attachments
  // -----------------------------------------------------------------------
  async listAttachments(id: string): Promise<PayOrderAttachment[]> {
    const { data } = await httpClient<PayOrderAttachment[]>(
      `${RESOURCE}/${encodeURIComponent(id)}/attachments`,
      { method: "GET" },
    );
    return data;
  }

  // -----------------------------------------------------------------------
  // 15. Download attachment
  // -----------------------------------------------------------------------
  async downloadAttachment(id: string, attachId: string): Promise<Blob> {
    return downloadFile(
      `${RESOURCE}/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachId)}`,
      { method: "GET" },
    );
  }

  // -----------------------------------------------------------------------
  // 16. Delete attachment
  // -----------------------------------------------------------------------
  async deleteAttachment(id: string, attachId: string): Promise<void> {
    await httpClient<void>(
      `${RESOURCE}/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachId)}`,
      {
        method: "DELETE",
        idempotencyKey: crypto.randomUUID(),
      },
    );
  }

  // -----------------------------------------------------------------------
  // 17. Get audit log
  // -----------------------------------------------------------------------
  async getAuditLog(
    id: string,
    page?: number,
    size?: number,
  ): Promise<PageResponse<AuditLogEntry>> {
    const queryParams: Record<
      string,
      string | string[] | number | boolean | undefined
    > = {};
    if (page !== undefined) queryParams.page = String(page);
    if (size !== undefined) queryParams.size = String(size);

    const { data } = await httpClient<PageResponse<AuditLogEntry>>(
      `${RESOURCE}/${encodeURIComponent(id)}/audit-log`,
      { method: "GET", params: queryParams },
    );
    return data;
  }

  // -----------------------------------------------------------------------
  // 18. Get approval status (workflow stepper)
  // -----------------------------------------------------------------------
  async getApprovalStatus(id: string): Promise<ApprovalStatusEntry[]> {
    const { data } = await httpClient<ApprovalStatusResponse>(
      `${RESOURCE}/${encodeURIComponent(id)}/approval-status`,
      { method: "GET" },
    );
    return data.STEPS;
  }

  // -----------------------------------------------------------------------
  // 19. Validate CCID
  // -----------------------------------------------------------------------
  async validateCcid(
    id: string,
    segments: Record<string, string>,
  ): Promise<CcidValidationResponse> {
    // If caller passes a flat segment map, wrap it as a single line
    const line: CcidSegmentInput = {
      GL_SEGMENT1: segments.GL_SEGMENT1 || "01",
      GL_SEGMENT2: segments.GL_SEGMENT2 || "",
      GL_SEGMENT3: segments.GL_SEGMENT3 || "",
      GL_SEGMENT4: segments.GL_SEGMENT4,
      GL_SEGMENT5: segments.GL_SEGMENT5,
      GL_SEGMENT6: segments.GL_SEGMENT6,
      GL_SEGMENT7: segments.GL_SEGMENT7,
      GL_SEGMENT8: segments.GL_SEGMENT8,
      GL_SEGMENT9: segments.GL_SEGMENT9,
      GL_SEGMENT10: segments.GL_SEGMENT10,
      GL_SEGMENT11: segments.GL_SEGMENT11,
      GL_SEGMENT12: segments.GL_SEGMENT12,
    };

    const { data } = await httpClient<CcidValidationResponse>(
      `${RESOURCE}/${encodeURIComponent(id)}/validate-ccid`,
      {
        method: "POST",
        body: { LINES: [line] },
      },
    );
    return data;
  }

  /** Overload: validate multiple lines at once */
  async validateCcidLines(
    id: string,
    lines: PayOrderLineRequest[],
  ): Promise<CcidValidationResponse> {
    const { data } = await httpClient<CcidValidationResponse>(
      `${RESOURCE}/${encodeURIComponent(id)}/validate-ccid`,
      {
        method: "POST",
        body: { LINES: lines },
      },
    );
    return data;
  }

  // -----------------------------------------------------------------------
  // 20. Lookup (master-data popup)
  // -----------------------------------------------------------------------
  async lookup(
    type: string,
    query?: string,
    parentCode?: string,
    page?: number,
    size?: number,
  ): Promise<PageResponse<LookupEntry>> {
    const queryParams: Record<
      string,
      string | string[] | number | boolean | undefined
    > = {};
    if (query) queryParams.q = query;
    if (parentCode) queryParams.parentCode = parentCode;
    if (page !== undefined) queryParams.page = String(page);
    if (size !== undefined) queryParams.size = String(size);

    const { data } = await httpClient<PageResponse<LookupEntry>>(
      `${RESOURCE}/lookup/${encodeURIComponent(type)}`,
      { method: "GET", params: queryParams },
    );
    return data;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const payOutManualClient = new PayOutManualClient();
export default payOutManualClient;
