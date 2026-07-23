import type { APIRoute } from "astro";
import type { ProjectOwnerFacet } from "@mia/contracts";
import { apiGet } from "../lib/api";
import { renderUrlset, xmlResponse } from "../lib/sitemap";
import { withEdgeCache } from "../lib/edge-cache";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const res = await apiGet<{ owners: ProjectOwnerFacet[] }>(
    locals.runtime?.env,
    "/v1/projects/facets/owners",
  );
  const items = (res.data?.owners ?? []).map((o) => ({
    path: `/developers/${encodeURIComponent(o.login)}`,
  }));
  return withEdgeCache(xmlResponse(renderUrlset(items)), 3600);
};
