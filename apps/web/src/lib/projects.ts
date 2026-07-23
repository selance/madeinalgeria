import type { PublicProject } from "@mia/contracts";
import { apiGet, type ServerEnv } from "./api";

/**
 * Detail-page loader, called from the [slug] route wrappers (NOT the shared
 * page component): the HTTP status must be set in page frontmatter, before
 * Astro starts streaming — a child component sets it too late.
 */
export async function loadProject(
  env: ServerEnv,
  slug: string,
): Promise<{ project: PublicProject | null; status: number }> {
  const res = await apiGet<PublicProject>(env, `/v1/projects/${encodeURIComponent(slug)}`);
  if (res.data) return { project: res.data, status: 200 };
  return { project: null, status: res.status === 404 ? 404 : 502 };
}
