import type { ApiResponse, PageResponse } from '@kb/core-utils';

// ---------------------------------------------------------------------------
// LTT Domain Types
// ---------------------------------------------------------------------------

export type LttChannel = 'INTERNAL' | 'SWIFT' | 'RTGS' | 'NAPAS';
export type LttStatus =
  | 'DRAFT'
  | 'PENDING_SUBMIT'
  | 'PENDING_CHECK'
  | 'PENDING_APPROVE'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED';

export interface LttHeader {
  id: string;
  lttCode: string;
  channel: LttChannel;
  status: LttStatus;
  senderName: string;
  senderAccount: string;
  receiverName: string;
  receiverAccount: string;
  currency: string;
  amount: number;
  valueDate: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface LttDetail {
  id: string;
  lttCode: string;
  channel: LttChannel;
  status: LttStatus;
  senderName: string;
  senderAccount: string;
  senderBank?: string;
  senderBranch?: string;
  receiverName: string;
  receiverAccount: string;
  receiverBank?: string;
  receiverBranch?: string;
  currency: string;
  amount: number;
  exchangeRate?: number;
  valueDate: string;
  description?: string;
  paymentPurpose?: string;
  feeBearer?: string;
  attachments?: AttachmentInfo[];
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AttachmentInfo {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface LttFilter {
  channel?: LttChannel;
  status?: LttStatus;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface LttCreateRequest {
  channel: LttChannel;
  senderName: string;
  senderAccount: string;
  senderBank?: string;
  senderBranch?: string;
  receiverName: string;
  receiverAccount: string;
  receiverBank?: string;
  receiverBranch?: string;
  currency: string;
  amount: number;
  exchangeRate?: number;
  valueDate: string;
  description?: string;
  paymentPurpose?: string;
  feeBearer?: string;
}

export interface LttUpdateRequest extends Partial<LttCreateRequest> {}

export interface LttCheckRequest {
  action: 'APPROVE' | 'RETURN';
  note?: string;
}

export interface LttApproveRequest {
  action: 'APPROVE' | 'RETURN' | 'REJECT';
  note?: string;
}

// ---------------------------------------------------------------------------
// API Base
// ---------------------------------------------------------------------------

const API_BASE = '/api/v1/ltt';

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function listLtt(
  filters: LttFilter = {},
): Promise<ApiResponse<PageResponse<LttHeader>>> {
  const params = new URLSearchParams();
  if (filters.channel) params.set('channel', filters.channel);
  if (filters.status) params.set('status', filters.status);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  if (filters.minAmount !== undefined)
    params.set('minAmount', String(filters.minAmount));
  if (filters.maxAmount !== undefined)
    params.set('maxAmount', String(filters.maxAmount));
  if (filters.keyword) params.set('keyword', filters.keyword);
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.size !== undefined) params.set('size', String(filters.size));
  if (filters.sort) params.set('sort', filters.sort);

  const qs = params.toString();
  return request<PageResponse<LttHeader>>(
    `${API_BASE}${qs ? `?${qs}` : ''}`,
  );
}

export async function getLtt(id: string): Promise<ApiResponse<LttDetail>> {
  return request<LttDetail>(`${API_BASE}/${id}`);
}

export async function createLtt(
  data: LttCreateRequest,
): Promise<ApiResponse<LttDetail>> {
  return request<LttDetail>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLtt(
  id: string,
  data: LttUpdateRequest,
): Promise<ApiResponse<LttDetail>> {
  return request<LttDetail>(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLtt(
  id: string,
  reason: string,
): Promise<ApiResponse<void>> {
  return request<void>(`${API_BASE}/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}

export async function submitLtt(
  id: string,
): Promise<ApiResponse<LttDetail>> {
  return request<LttDetail>(`${API_BASE}/${id}/submit`, {
    method: 'POST',
  });
}

export async function checkLtt(
  id: string,
  result: LttCheckRequest,
): Promise<ApiResponse<LttDetail>> {
  return request<LttDetail>(`${API_BASE}/${id}/check`, {
    method: 'POST',
    body: JSON.stringify(result),
  });
}

export async function approveLtt(
  id: string,
  result: LttApproveRequest,
): Promise<ApiResponse<LttDetail>> {
  return request<LttDetail>(`${API_BASE}/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(result),
  });
}

export async function copyLtt(
  id: string,
): Promise<ApiResponse<LttDetail>> {
  return request<LttDetail>(`${API_BASE}/${id}/copy`, {
    method: 'POST',
  });
}
