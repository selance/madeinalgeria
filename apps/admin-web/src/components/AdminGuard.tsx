import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { clearSessionToken } from "@mia/api-client";
import { useSession } from "@/lib/api";

function Loading() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="border-primary-500 size-10 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
  );
}

/**
 * Requires a session on the admin host. Role enforcement is server-side
 * (requireAdmin on every route) — a signed-in non-admin just sees 403 errors,
 * surfaced by the query layer.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending, error } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isPending || session) return;
    if (error) clearSessionToken();
    const redirect = encodeURIComponent(location.pathname + location.search);
    navigate(`/login?redirect=${redirect}`, { replace: true });
  }, [session, isPending, error, navigate, location]);

  if (isPending) return <Loading />;
  if (!session) return null;
  return <>{children}</>;
}
