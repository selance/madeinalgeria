import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { ApiClientProvider, ApiError } from "@mia/api-client";
import { Toaster } from "@mia/ui/components/toast";
import { apiClient } from "@/lib/api";
import { router } from "@/router";
import "@/styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // 401/403 mean "not an admin" — retrying won't change that.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return false;
        return failureCount < 2;
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ApiClientProvider client={apiClient}>
        <RouterProvider router={router} />
        <Toaster />
      </ApiClientProvider>
    </QueryClientProvider>
  </StrictMode>,
);
