import { createAuthClient } from "better-auth/react";
import { tokenStore } from "./token";

/**
 * better-auth client against `<apiBaseUrl>/v1/auth`. Works for BOTH workers:
 * pass the public API base for the web/dashboard apps and the admin API base
 * for the admin app (admins sign in against their own host).
 *
 * Cookie sessions work same-site and cross-subdomain in production; the
 * bearer token (captured from sign-in/sign-up responses below) covers
 * localhost and staging where the cookie can't follow.
 */
export function createAppAuthClient(apiBaseUrl: string) {
  return createAuthClient({
    baseURL: `${apiBaseUrl.replace(/\/$/, "")}/v1/auth`,
    fetchOptions: {
      credentials: "include",
      auth: {
        type: "Bearer",
        token: () => tokenStore.get() ?? "",
      },
      onSuccess(context) {
        // The bearer plugin exposes the session token on sign-in/sign-up.
        const header = context.response.headers.get("set-auth-token");
        if (header) tokenStore.set(header);
        const body = context.data as { token?: string } | null;
        if (body?.token) tokenStore.set(body.token);
      },
    },
  });
}

export type AppAuthClient = ReturnType<typeof createAppAuthClient>;

/** Call on sign-out so a stale bearer token can't resurrect the session. */
export function clearSessionToken(): void {
  tokenStore.set(null);
}
