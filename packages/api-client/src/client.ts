import ky, { HTTPError, type KyInstance, type Options } from "ky";
import { tokenStore } from "./token";

/** Mirrors the backend error envelope (`{ error: { code, message, ... } }`). */
export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal";

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiClientOptions {
  /** e.g. https://api.madeinalgeria.dev */
  baseUrl: string;
  /** Defaults to the shared bearer tokenStore; pass null to disable. */
  getToken?: (() => string | null) | null;
}

export interface ApiClient {
  get<T>(path: string, searchParams?: Record<string, string | number | boolean>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
  /** The underlying ky instance for non-envelope calls (uploads, auth). */
  http: KyInstance;
}

async function toApiError(error: HTTPError): Promise<ApiError> {
  const { response } = error;
  try {
    const body = (await response.clone().json()) as {
      error?: { code?: ApiErrorCode; message?: string; details?: unknown; requestId?: string };
    };
    if (body.error?.message) {
      return new ApiError(
        body.error.code ?? "internal",
        body.error.message,
        response.status,
        body.error.details,
        body.error.requestId,
      );
    }
  } catch {
    // non-JSON body — fall through
  }
  return new ApiError("internal", `Request failed with status ${response.status}`, response.status);
}

/**
 * Typed client for the `{ data }` envelope routes. Auth routes (`/v1/auth/*`)
 * use better-auth's own shapes — see auth.ts, not this.
 */
export function createApiClient({ baseUrl, getToken = tokenStore.get }: ApiClientOptions): ApiClient {
  const http = ky.create({
    prefixUrl: baseUrl,
    credentials: "include",
    timeout: 30_000,
    retry: { limit: 2, statusCodes: [408, 429, 500, 502, 503, 504] },
    hooks: {
      beforeRequest: [
        (request) => {
          const token = getToken?.();
          if (token) request.headers.set("Authorization", `Bearer ${token}`);
        },
      ],
    },
  });

  async function unwrap<T>(promise: Promise<{ data: T }>): Promise<T> {
    try {
      return (await promise).data;
    } catch (error) {
      if (error instanceof HTTPError) throw await toApiError(error);
      throw error;
    }
  }

  // Paths are given WITHOUT a leading slash (ky prefixUrl requirement).
  return {
    http,
    get: <T>(path: string, searchParams?: Record<string, string | number | boolean>) =>
      unwrap<T>(http.get(path, { searchParams }).json()),
    post: <T>(path: string, body?: unknown) =>
      unwrap<T>(http.post(path, body === undefined ? {} : { json: body }).json()),
    put: <T>(path: string, body?: unknown) =>
      unwrap<T>(http.put(path, body === undefined ? {} : { json: body }).json()),
    delete: <T>(path: string) => unwrap<T>(http.delete(path).json()),
  };
}

export type { Options as KyOptions };
