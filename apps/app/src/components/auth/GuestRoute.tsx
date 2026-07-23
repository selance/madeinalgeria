import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/hooks/useAuth";

function Loading() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="border-primary-500 size-10 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
  );
}

/**
 * The inverse of ProtectedRoute: auth pages (login/register/reset) are for
 * guests only. A signed-in visitor is sent straight to the app — honoring a
 * `?redirect=` target when it's a safe internal path, otherwise the dashboard.
 */
export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || hasRedirected.current) return;
    hasRedirected.current = true;
    const redirect = params.get("redirect");
    const target = redirect && redirect.startsWith("/") ? redirect : "/dashboard";
    navigate(target, { replace: true });
  }, [isAuthenticated, isLoading, navigate, params]);

  if (isLoading) return <Loading />;
  if (isAuthenticated) return null;
  return <>{children}</>;
}
