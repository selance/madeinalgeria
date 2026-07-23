import type { APIRoute } from "astro";
import type { ProjectTopicFacet } from "@mia/contracts";
import { apiGet } from "../lib/api";
import { renderUrlset, xmlResponse } from "../lib/sitemap";
import { withEdgeCache } from "../lib/edge-cache";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const res = await apiGet<{ topics: ProjectTopicFacet[] }>(
    locals.runtime?.env,
    "/v1/projects/facets/topics",
  );
  const items = (res.data?.topics ?? []).map((t) => ({
    path: `/projects/topic/${encodeURIComponent(t.topic)}`,
  }));
  return withEdgeCache(xmlResponse(renderUrlset(items)), 3600);
};
