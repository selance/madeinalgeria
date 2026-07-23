import type { APIRoute } from "astro";
import type { ProjectLanguageFacet } from "@mia/contracts";
import { apiGet } from "../lib/api";
import { renderUrlset, xmlResponse } from "../lib/sitemap";
import { withEdgeCache } from "../lib/edge-cache";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const res = await apiGet<{ languages: ProjectLanguageFacet[] }>(
    locals.runtime?.env,
    "/v1/projects/facets",
  );
  const items = (res.data?.languages ?? []).map((l) => ({
    path: `/projects/language/${encodeURIComponent(l.name)}`,
  }));
  return withEdgeCache(xmlResponse(renderUrlset(items)), 3600);
};
