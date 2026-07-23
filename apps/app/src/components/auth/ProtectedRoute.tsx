import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { clearAuthDataPreservePreferences } from "@/lib/cookie-utils";

function Loading() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="border-primary-500 size-10 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
  );
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = "/login" }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated || hasRedirected.current) return;
    if (error) console.error("[ProtectedRoute] Authentication error:", error);
    hasRedirected.current = true;
    clearAuthDataPreservePreferences();
    const redirect = encodeURIComponent(location.pathname + location.search);
    navigate(`${redirectTo}?redirect=${redirect}`, { replace: true });
  }, [isAuthenticated, isLoading, error, navigate, redirectTo, location]);

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
