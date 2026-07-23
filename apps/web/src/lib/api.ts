/**
 * Server-side API access for Astro pages/endpoints. In deployed envs the
 * `PUBLIC_API_BASE` var points at the public API worker; in `astro dev` we fall
 * back to the build-time `PUBLIC_API_BASE_URL`.
 */
export type ServerEnv = App.Locals["runtime"]["env"] | undefined;

/**
 * Server-side POST. Returns the status alongside the parsed body instead of
 * throwing on 4xx: the newsletter confirm/unsubscribe pages need to tell an
 * expired link (400) apart from an infrastructure failure.
 */
/**
 * Server-side GET with the same non-throwing contract as `apiPost` — directory
 * pages need to tell a 404 (unknown slug) apart from an infrastructure failure.
 */
export async function apiGet<T>(
  env: ServerEnv,
  path: string,
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const base = env?.PUBLIC_API_BASE ?? import.meta.env.PUBLIC_API_BASE_URL;
  const url = base.replace(/\/$/, "") + path;
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, status: res.status, data: null };
    const parsed = (await res.json()) as { data: T };
    return { ok: true, status: res.status, data: parsed.data };
  } catch (error) {
    // An unreachable API must degrade pages, not 500 them (status 0 = network).
    console.error(`apiGet ${path} failed:`, error);
    return { ok: false, status: 0, data: null };
  }
}

export async function apiPost<T>(
  env: ServerEnv,
  path: string,
  body: unknown,
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const base = env?.PUBLIC_API_BASE ?? import.meta.env.PUBLIC_API_BASE_URL;
  const url = base.replace(/\/$/, "") + path;
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  const res = await fetch(url, init);
  if (!res.ok) return { ok: false, status: res.status, data: null };
  const parsed = (await res.json()) as { data: T };
  return { ok: true, status: res.status, data: parsed.data };
}
