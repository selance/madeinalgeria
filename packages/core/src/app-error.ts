/**
 * The one error type handlers throw. The app-level `onError` maps it to the
 * standard envelope `{ error: { code, message, details, requestId } }`.
 * Handlers never hand-build error JSON.
 */
export type AppErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "gone"
  | "conflict"
  | "rate_limited"
  | "service_unavailable"
  | "internal";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  gone: 410,
  conflict: 409,
  rate_limited: 429,
  service_unavailable: 503,
  internal: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError("bad_request", message, details);
  }
  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError("unauthorized", message);
  }
  static forbidden(message = "Forbidden"): AppError {
    return new AppError("forbidden", message);
  }
  static notFound(message = "Not found"): AppError {
    return new AppError("not_found", message);
  }
  /** 410 — existed but was removed on purpose (tombstoned company). */
  static gone(message = "Gone"): AppError {
    return new AppError("gone", message);
  }
  static conflict(message: string, details?: unknown): AppError {
    return new AppError("conflict", message, details);
  }
  static serviceUnavailable(message = "Service unavailable"): AppError {
    return new AppError("service_unavailable", message);
  }
  static internal(message = "Internal error"): AppError {
    return new AppError("internal", message);
  }
}

export interface ErrorEnvelope {
  error: {
    code: AppErrorCode;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export function toErrorEnvelope(err: unknown, requestId?: string): { status: number; body: ErrorEnvelope } {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: { error: { code: err.code, message: err.message, details: err.details, requestId } },
    };
  }
  return {
    status: 500,
    body: { error: { code: "internal", message: "Internal error", requestId } },
  };
}
