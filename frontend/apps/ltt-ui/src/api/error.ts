import type { ErrorResponse } from "../types/pay-out-manual";

// ---------------------------------------------------------------------------
// Base API Error
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly traceId: string;
  public readonly timestamp: string;
  public readonly details: ErrorResponse["DETAILS"];

  constructor(status: number, body: ErrorResponse) {
    super(body.MESSAGE);
    this.name = "ApiError";
    this.status = status;
    this.code = body.CODE;
    this.traceId = body.TRACE_ID;
    this.timestamp = body.TIMESTAMP;
    this.details = body.DETAILS;
  }
}

// ---------------------------------------------------------------------------
// Optimistic Lock Conflict (HTTP 409 with MSG-ERR-LOCK)
// ---------------------------------------------------------------------------

export class OptimisticLockError extends ApiError {
  public readonly currentVersion?: number;
  public readonly yourVersion?: number;

  constructor(status: number, body: ErrorResponse) {
    super(status, body);
    this.name = "OptimisticLockError";

    if (body.DETAILS && body.DETAILS.length > 0) {
      const detail = body.DETAILS[0];
      this.currentVersion =
        typeof detail.CURRENT_VERSION === "number"
          ? detail.CURRENT_VERSION
          : undefined;
      this.yourVersion =
        typeof detail.YOUR_VERSION === "number"
          ? detail.YOUR_VERSION
          : undefined;
    }
  }
}

// ---------------------------------------------------------------------------
// Segregation-of-Duties Violation (HTTP 403 with MSG-ERR-SOD or MSG-ERR-PERMISSION)
// ---------------------------------------------------------------------------

export class SoDViolationError extends ApiError {
  constructor(status: number, body: ErrorResponse) {
    super(status, body);
    this.name = "SoDViolationError";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine the correct error class from an HTTP response.
 * Parses the body as ErrorResponse and throws the appropriate typed error.
 */
export async function throwApiError(response: Response): Promise<never> {
  let body: ErrorResponse;

  try {
    body = await response.json();
  } catch {
    throw new ApiError(response.status, {
      TRACE_ID: "",
      TIMESTAMP: new Date().toISOString(),
      CODE: "MSG-ERR-SYSTEM",
      MESSAGE: response.statusText || `HTTP ${response.status}`,
    });
  }

  if (response.status === 409 && body.CODE === "MSG-ERR-LOCK") {
    throw new OptimisticLockError(response.status, body);
  }

  if (
    response.status === 403 &&
    (body.CODE === "MSG-ERR-SOD" || body.CODE === "MSG-ERR-PERMISSION")
  ) {
    throw new SoDViolationError(response.status, body);
  }

  throw new ApiError(response.status, body);
}
