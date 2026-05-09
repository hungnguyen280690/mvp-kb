// ============================================================================
// HTTP Client — Axios instance with interceptors
// Auth header, error handling, 409 conflict, optimistic lock
// ============================================================================

import axios, { type AxiosError, type AxiosResponse } from 'axios';

// UUID generator using crypto API
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/internal/v1';

const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — inject auth headers
// ---------------------------------------------------------------------------
httpClient.interceptors.request.use(
  (config) => {
    // Inject X-User-Id and X-User-Role from auth storage
    const authUser = localStorage.getItem('vdbas_auth_user');
    if (authUser) {
      try {
        const user = JSON.parse(authUser);
        config.headers['X-User-Id'] = user.userId;
        config.headers['X-User-Role'] = user.role;
      } catch {
        // ignore parse errors
      }
    }

    // Inject X-Request-Id for tracing
    config.headers['X-Request-Id'] = generateUUID();

    // Inject Idempotency-Key for POST requests if not already set
    if (config.method === 'post' && !config.headers['Idempotency-Key']) {
      config.headers['Idempotency-Key'] = generateUUID();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — extract ETag, handle errors
// ---------------------------------------------------------------------------
httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Khong the ket noi den server. Vui long kiem tra mang.',
      });
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Unauthorized — redirect to login
        localStorage.removeItem('vdbas_auth_user');
        window.location.href = '/login';
        break;

      case 409:
        // Conflict — optimistic lock / version mismatch
        return Promise.reject({
          code: '409',
          message: (data as Record<string, string>)?.message || 'Ban ghi da bi thay doi tu phien khac. Vui long tai lai truoc khi tiep tuc.',
          isConflict: true,
        });

      case 412:
        // Precondition failed — state not allowed
        return Promise.reject({
          code: '412',
          message: (data as Record<string, string>)?.message || 'LTT dang o trang thai khong cho phep thao tac nay.',
        });

      case 422:
        // Validation error
        return Promise.reject({
          code: '422',
          message: (data as Record<string, string>)?.message || 'Validate that bai.',
          violations: (data as Record<string, unknown>)?.violations || [],
          isValidationError: true,
        });

      case 423:
        // Locked
        return Promise.reject({
          code: '423',
          message: (data as Record<string, string>)?.message || 'LTT dang duoc user khac chinh sua, vui long thu lai sau.',
          isLocked: true,
        });

      default:
        return Promise.reject(data || { code: String(status), message: 'Loi he thong.' });
    }
  }
);

// ---------------------------------------------------------------------------
// Helper — extract ETag from response
// ---------------------------------------------------------------------------
export function extractETag(response: AxiosResponse): string {
  return response.headers['etag'] || '';
}

// ---------------------------------------------------------------------------
// Helper — build If-Match header
// ---------------------------------------------------------------------------
export function ifMatchHeader(version: number | string): Record<string, string> {
  return { 'If-Match': String(version) };
}

export default httpClient;
