import { createAppAuthClient } from "@mia/api-client";

/**
 * better-auth client against the public API (cookie sessions in prod,
 * bearer token on localhost/staging — handled inside the factory).
 * Keeps the import surface: `authClient` + `useSession`.
 */
export const authClient = createAppAuthClient(import.meta.env.VITE_API_BASE_URL);

export const useSession = authClient.useSession;
