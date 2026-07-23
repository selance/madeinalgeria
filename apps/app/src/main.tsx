import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { ApiClientProvider } from "@mia/api-client";
// Design-system toaster: every page fires toasts via useToast() from
// @mia/ui — sonner's Toaster used to be mounted here instead, so none of
// those toasts ever rendered.
import { Toaster } from "@mia/ui/components/toast";
import { apiClient } from "@/lib/api";
import { router } from "@/router";
import "@/styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
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
