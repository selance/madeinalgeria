import { createApiClient } from "@mia/api-client";

export const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
});

export const WEB_BASE_URL: string =
  import.meta.env.VITE_WEB_BASE_URL || "https://www.madeinalgeria.dev";
