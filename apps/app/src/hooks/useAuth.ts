import { useSession } from "@/lib/auth-client";
import { clearAuthDataPreservePreferences } from "@/lib/cookie-utils";
import { useEffect, useRef } from "react";

export function useAuth() {
  const { data: session, isPending, error } = useSession();
  const hasHandledError = useRef(false);

  // Handle session errors
  useEffect(() => {
    if (error && !hasHandledError.current) {
      console.error("[useAuth] Session error detected:", error);

      // Clear auth data on session errors
      clearAuthDataPreservePreferences();

      hasHandledError.current = true;

      // Reset flag after a delay to allow retry
      setTimeout(() => {
        hasHandledError.current = false;
      }, 5000);
    }
  }, [error]);

  return {
    user: session?.user ?? null,
    session: session ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    error,
  };
}
