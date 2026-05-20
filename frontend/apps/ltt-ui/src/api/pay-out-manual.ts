import { apiClient } from "./client";
import type {
  PayOrderRequest,
  PayOrderResponse,
  PayOrderSummary,
  PagedResponse,
  AttachmentResponse,
  ApprovalStatusResponse,
  AuditLogEntry,
  LookupResult,
} from "../types/pay-order";

export interface ListParams {
  status?: string[];
  channel?: string[];
  refNo?: string;
  receiverName?: string;
  page?: number;
  size?: number;
  sort?: string;
  includeDeleted?: boolean;
}

export const payOutManualApi = {
  create: (data: PayOrderRequest) =>
    apiClient.post<PayOrderResponse>("/pay-out-manual", data),

  getById: (id: string) =>
    apiClient.get<PayOrderResponse>(`/pay-out-manual/${id}`),

  update: (id: string, data: PayOrderRequest, version: number) =>
    apiClient.put<PayOrderResponse>(`/pay-out-manual/${id}`, data, {
      headers: { "If-Match": `"${version}"`, "X-Idempotency-Key": undefined },
    }),

  delete: (id: string, deleteReason: string, version: number) =>
    apiClient.delete(`/pay-out-manual/${id}`, {
      data: { deleteReason, confirmed: true },
      headers: { "If-Match": `"${version}"` },
    }),

  submit: (id: string, version: number, comment?: string) =>
    apiClient.post(
      `/pay-out-manual/${id}/submit`,
      { comment },
      {
        headers: { "If-Match": `"${version}"` },
      },
    ),

  checkApprove: (id: string, version: number, comment?: string) =>
    apiClient.post(
      `/pay-out-manual/${id}/check-approve`,
      { comment },
      {
        headers: { "If-Match": `"${version}"` },
      },
    ),

  approve: (id: string, version: number, comment?: string) =>
    apiClient.post(
      `/pay-out-manual/${id}/approve`,
      { comment },
      {
        headers: { "If-Match": `"${version}"` },
      },
    ),

  return: (id: string, version: number, reason: string) =>
    apiClient.post(
      `/pay-out-manual/${id}/return`,
      { reason },
      {
        headers: { "If-Match": `"${version}"` },
      },
    ),

  reject: (id: string, version: number, reason: string) =>
    apiClient.post(
      `/pay-out-manual/${id}/reject`,
      { reason },
      {
        headers: { "If-Match": `"${version}"` },
      },
    ),

  copy: (id: string, paymentDate?: string) =>
    apiClient.post<PayOrderResponse>(`/pay-out-manual/${id}/copy`, {
      paymentDate,
    }),

  list: (params: ListParams) =>
    apiClient.get<PagedResponse<PayOrderSummary>>("/pay-out-manual", {
      params,
    }),

  export: (format: "EXCEL" | "CSV" | "PDF", filter?: ListParams) =>
    apiClient.post(
      "/pay-out-manual/export",
      { format, filter },
      { responseType: "blob" },
    ),

  uploadAttachment: (orderId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<AttachmentResponse>(
      `/pay-out-manual/${orderId}/attachments`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  listAttachments: (orderId: string) =>
    apiClient.get<AttachmentResponse[]>(
      `/pay-out-manual/${orderId}/attachments`,
    ),

  downloadAttachment: (orderId: string, attachId: string) =>
    apiClient.get(`/pay-out-manual/${orderId}/attachments/${attachId}`, {
      responseType: "blob",
    }),

  deleteAttachment: (orderId: string, attachId: string) =>
    apiClient.delete(`/pay-out-manual/${orderId}/attachments/${attachId}`),

  getAuditLog: (orderId: string, page = 0, size = 20) =>
    apiClient.get<PagedResponse<AuditLogEntry>>(
      `/pay-out-manual/${orderId}/audit-log`,
      {
        params: { page, size },
      },
    ),

  getApprovalStatus: (orderId: string) =>
    apiClient.get<ApprovalStatusResponse>(
      `/pay-out-manual/${orderId}/approval-status`,
    ),

  validateCcid: (orderId: string, segments: string[]) =>
    apiClient.post(`/pay-out-manual/${orderId}/validate-ccid`, { segments }),

  lookup: (type: string, q?: string, page = 0, size = 20) =>
    apiClient.get<LookupResult>(`/pay-out-manual/lookup/${type}`, {
      params: { q, page, size },
    }),
};
