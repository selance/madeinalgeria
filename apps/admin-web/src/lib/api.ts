import { createApiClient, createAppAuthClient } from "@mia/api-client";

export const BASE = import.meta.env.VITE_ADMIN_API_BASE_URL;

export const apiClient = createApiClient({ baseUrl: BASE });

/** Admins sign in against the admin host; non-admin sessions get 403s. */
export const authClient = createAppAuthClient(BASE);
export const useSession = authClient.useSession;
