/**
 * Bearer-token storage for environments where the cross-subdomain cookie
 * doesn't exist (localhost, staging workers.dev). In production the cookie
 * session works on its own; the token is simply absent and never sent.
 */
const STORAGE_KEY = "mia.session-token";

let memoryToken: string | null = null;

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export const tokenStore = {
  get(): string | null {
    return storage()?.getItem(STORAGE_KEY) ?? memoryToken;
  },
  set(token: string | null): void {
    memoryToken = token;
    const s = storage();
    if (!s) return;
    if (token === null) s.removeItem(STORAGE_KEY);
    else s.setItem(STORAGE_KEY, token);
  },
};
