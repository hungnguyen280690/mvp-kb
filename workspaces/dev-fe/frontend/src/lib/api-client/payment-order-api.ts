// ============================================================================
// Payment Order API — all endpoints matching api-internal-v1.yaml
// ============================================================================

import httpClient, { extractETag, ifMatchHeader } from './http-client';
import type {
  PaymentOrder,
  PaymentOrderCreateRequest,
  PaymentOrderUpdateRequest,
  PaymentOrderListResponse,
  PaymentOrderListParams,
  DeleteRequest,
  DeleteResponse,
  RejectRequest,
  CancelRequest,
  SignRequest,
  ReverseRequest,
  AuditTrailResponse,
} from '@/types';

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/** Tra cuu danh sach LTT */
export async function listPaymentOrders(
  params?: PaymentOrderListParams
): Promise<PaymentOrderListResponse> {
  const response = await httpClient.get<PaymentOrderListResponse>('/payment-orders', {
    params,
  });
  return response.data;
}

/** Tao moi LTT (Lap lenh) — returns { data, etag } */
export async function createPaymentOrder(
  request: PaymentOrderCreateRequest
): Promise<{ data: PaymentOrder; etag: string }> {
  const response = await httpClient.post<PaymentOrder>('/payment-orders', request);
  return { data: response.data, etag: extractETag(response) };
}

/** Xem chi tiet LTT */
export async function getPaymentOrder(
  id: string
): Promise<{ data: PaymentOrder; etag: string }> {
  const response = await httpClient.get<PaymentOrder>(`/payment-orders/${id}`);
  return { data: response.data, etag: extractETag(response) };
}

/** Cap nhat LTT nhap (DRAFT / RETURNED_TO_MAKER) */
export async function updatePaymentOrder(
  id: string,
  request: PaymentOrderUpdateRequest,
  version: number
): Promise<{ data: PaymentOrder; etag: string }> {
  const response = await httpClient.put<PaymentOrder>(
    `/payment-orders/${id}`,
    request,
    { headers: ifMatchHeader(version) }
  );
  return { data: response.data, etag: extractETag(response) };
}

/** Xoa LTT nhap (soft-delete) */
export async function deletePaymentOrder(
  id: string,
  request: DeleteRequest,
  version: number
): Promise<DeleteResponse> {
  const response = await httpClient.delete<DeleteResponse>(`/payment-orders/${id}`, {
    headers: ifMatchHeader(version),
    data: request,
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// Workflow Actions
// ---------------------------------------------------------------------------

/** Gui kiem soat LTT (DRAFT -> SUBMITTED) */
export async function submitPaymentOrder(id: string): Promise<PaymentOrder> {
  const response = await httpClient.post<PaymentOrder>(
    `/payment-orders/${id}/submit`
  );
  return response.data;
}

/** Phe duyet LTT (Checker: SUBMITTED -> IN_CONTROL, Approver: IN_CONTROL -> APPROVED) */
export async function approvePaymentOrder(id: string): Promise<PaymentOrder> {
  const response = await httpClient.post<PaymentOrder>(
    `/payment-orders/${id}/approve`
  );
  return response.data;
}

/** Tu choi LTT */
export async function rejectPaymentOrder(
  id: string,
  request: RejectRequest
): Promise<PaymentOrder> {
  const response = await httpClient.post<PaymentOrder>(
    `/payment-orders/${id}/reject`,
    request
  );
  return response.data;
}

/** Ky so LTT (APPROVED -> SIGNED) */
export async function signPaymentOrder(
  id: string,
  request: SignRequest
): Promise<PaymentOrder> {
  const response = await httpClient.post<PaymentOrder>(
    `/payment-orders/${id}/sign`,
    request
  );
  return response.data;
}

/** Gui LTT sang NHNN/KB (SIGNED -> SENT) */
export async function sendPaymentOrder(id: string): Promise<PaymentOrder> {
  const response = await httpClient.post<PaymentOrder>(
    `/payment-orders/${id}/send`
  );
  return response.data;
}

/** Huy LTT (SIGNED -> CANCELLED) */
export async function cancelPaymentOrder(
  id: string,
  request: CancelRequest
): Promise<PaymentOrder> {
  const response = await httpClient.post<PaymentOrder>(
    `/payment-orders/${id}/cancel`,
    request
  );
  return response.data;
}

/** Tao but toan dao (POSTED -> REVERSED) */
export async function reversePaymentOrder(
  id: string,
  request: ReverseRequest
): Promise<PaymentOrder> {
  const response = await httpClient.post<PaymentOrder>(
    `/payment-orders/${id}/reverse`,
    request
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Audit Trail
// ---------------------------------------------------------------------------

/** Xem lich su thao tac LTT */
export async function getAuditTrail(
  id: string,
  page?: number,
  size?: number
): Promise<AuditTrailResponse> {
  const response = await httpClient.get<AuditTrailResponse>(
    `/payment-orders/${id}/audit-trail`,
    { params: { page: page ?? 0, size: size ?? 50 } }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Balance
// ---------------------------------------------------------------------------

/** Kiem tra so du tai khoan */
export async function getBalance(
  accountNumber: string,
  currency?: string,
  asOfDate?: string
): Promise<import('@/types').BalanceResponse> {
  const response = await httpClient.get<import('@/types').BalanceResponse>(
    '/balance',
    { params: { accountNumber, currency: currency || 'VND', asOfDate } }
  );
  return response.data;
}
