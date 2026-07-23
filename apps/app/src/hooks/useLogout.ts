import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { clearAuthDataPreservePreferences } from "@/lib/cookie-utils";
import { WEB_BASE_URL } from "@/lib/api";

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** `redirectTo="/"` means the public landing — which lives on the web host. */
  const logout = async (redirectTo = "/") => {
    setIsLoggingOut(true);
    setError(null);
    const target = redirectTo === "/" ? WEB_BASE_URL : redirectTo;
    // Fire-and-forget with keepalive: awaiting signOut lets the session store
    // go null first, so the route guard flashes /login before the browser
    // commits the navigation. keepalive lets the sign-out POST finish while
    // the page is already unloading toward the landing page.
    void authClient
      .signOut({ fetchOptions: { keepalive: true } })
      .catch((err) => console.error("[useLogout] signOut failed:", err));
    clearAuthDataPreservePreferences();
    window.location.assign(target);
  };

  return { logout, isLoggingOut, error };
}
