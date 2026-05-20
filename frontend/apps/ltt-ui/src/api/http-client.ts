import { throwApiError } from "./error";

// ---------------------------------------------------------------------------
// Auth token provider
// ---------------------------------------------------------------------------

/**
 * Retrieve the current JWT bearer token.
 * Replace this implementation with your actual SSO/token-store logic.
 */
export function getAuthToken(): string | null {
  // Common pattern: token stored by the shell/host MFE
  const key = "vdbas_access_token";
  try {
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Base HTTP client
// ---------------------------------------------------------------------------

export interface RequestOptions {
  /** HTTP method */
  method?: string;
  /** JSON body — will be serialized automatically */
  body?: unknown;
  /** URL search params appended to the path */
  params?: Record<string, string | string[] | number | boolean | undefined>;
  /** Idempotency key for POST/PUT/DELETE (X-Idempotency-Key header) */
  idempotencyKey?: string;
  /** ETag value for optimistic locking (If-Match header) */
  ifMatch?: string;
  /** Extra headers */
  headers?: HeadersInit;
  /** Abort signal */
  signal?: AbortSignal;
}

/** Base URL resolved from env, falling back to /v1 */
const BASE_URL: string =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) || "/v1";

/**
 * Low-level fetch wrapper that handles:
 *  - Base URL prepending
 *  - Authorization header
 *  - X-Request-Id generation
 *  - X-Idempotency-Key forwarding
 *  - If-Match / ETag handling
 *  - Query-string building
 *  - Typed error parsing
 */
export async function httpClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; etag?: string; response: Response }> {
  const {
    body,
    params,
    idempotencyKey,
    ifMatch,
    headers: extraHeaders,
    ...rest
  } = options;

  // Build URL with query params
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Build headers
  const headers = new Headers(extraHeaders as HeadersInit | undefined);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("X-Request-Id", crypto.randomUUID());

  if (idempotencyKey) {
    headers.set("X-Idempotency-Key", idempotencyKey);
  }

  if (ifMatch) {
    headers.set("If-Match", ifMatch);
  }

  // Execute request
  const response = await fetch(url.toString(), {
    method: rest.method,
    signal: rest.signal,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle errors
  if (!response.ok) {
    await throwApiError(response);
  }

  // Parse response
  const contentType = response.headers.get("Content-Type") || "";
  const etag = response.headers.get("ETag") || undefined;

  if (
    contentType.includes("application/json") ||
    contentType.includes("application/ld+json")
  ) {
    const data = (await response.json()) as T;
    return { data, etag, response };
  }

  // For binary responses (file download) return raw Response
  return { data: response as unknown as T, etag, response };
}

/**
 * Multipart form upload helper.
 * Does NOT set Content-Type header — the browser sets it with the boundary.
 */
export async function uploadFile<T>(
  path: string,
  formData: FormData,
  options: {
    idempotencyKey?: string;
    method?: string;
  } = {},
): Promise<{ data: T; etag?: string; response: Response }> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  const headers = new Headers();
  headers.set("Accept", "application/json");

  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("X-Request-Id", crypto.randomUUID());

  if (options.idempotencyKey) {
    headers.set("X-Idempotency-Key", options.idempotencyKey);
  }

  const response = await fetch(url.toString(), {
    method: options.method || "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const etag = response.headers.get("ETag") || undefined;
  const data = (await response.json()) as T;
  return { data, etag, response };
}

/**
 * Download helper — returns a Blob for file downloads.
 */
export async function downloadFile(
  path: string,
  options: RequestOptions = {},
): Promise<Blob> {
  const { params, headers: extraHeaders, ...rest } = options;

  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers = new Headers(extraHeaders as HeadersInit | undefined);
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("X-Request-Id", crypto.randomUUID());

  const response = await fetch(url.toString(), {
    method: rest.method,
    signal: rest.signal,
    headers,
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  return response.blob();
}
