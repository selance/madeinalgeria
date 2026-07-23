import { useEffect } from "react";
import { createBrowserRouter } from "react-router";
import { ErrorPage } from "@/components/ErrorPage";

/**
 * Public accounts are closed. app.madeinalgeria.dev no longer hosts sign-in,
 * sign-up, or the user dashboard — every route bounces to the public site.
 * (Admin auth lives on admin.madeinalgeria.dev and is unaffected.)
 */
const WEB_BASE_URL = import.meta.env.VITE_WEB_BASE_URL || "https://www.madeinalgeria.dev";

function ExternalRedirect() {
  useEffect(() => {
    window.location.replace(WEB_BASE_URL);
  }, []);
  return null;
}

export const router = createBrowserRouter([
  { path: "*", element: <ExternalRedirect />, errorElement: <ErrorPage /> },
]);
