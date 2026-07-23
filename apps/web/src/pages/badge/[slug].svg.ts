import type { APIRoute } from "astro";
import type { PublicProject } from "@mia/contracts";
import { apiGet } from "../../lib/api";
import { renderBadge } from "../../lib/badge";
import { withEdgeCache } from "../../lib/edge-cache";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const slug = params.slug ?? "";
  const res = await apiGet<PublicProject>(
    locals.runtime?.env,
    `/v1/projects/${encodeURIComponent(slug)}`,
  );
  const value = res.data ? `★ ${res.data.stars.toLocaleString("en")}` : "listed";
  const svg = renderBadge("made in algeria", value);
  return withEdgeCache(
    new Response(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8" } }),
    86400,
  );
};
