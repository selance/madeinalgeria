import { clearSessionToken } from "@mia/api-client";

/**
 * v1 shipped a 429-line cookie-scrubbing toolkit to fight iOS cookie bugs.
 * v2 uses bearer tokens where cookies are unreliable, so "clear auth data"
 * reduces to dropping the stored session token. Same name kept so ported
 * components work unchanged.
 */
export function clearAuthDataPreservePreferences(): void {
  clearSessionToken();
}
