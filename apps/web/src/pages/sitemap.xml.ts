import type { APIRoute } from "astro";
import { renderSitemapIndex, xmlResponse } from "../lib/sitemap";
import { withEdgeCache } from "../lib/edge-cache";

// A sitemap INDEX so the directory scales past 50k URLs without a rewrite. Each
// child is its own SSR endpoint reading the same live API the pages read, so the
// sitemap and the pages can never drift apart.
export const prerender = false;

const CHILDREN = [
  "/sitemap-static.xml",
  "/sitemap-projects.xml",
  "/sitemap-developers.xml",
  "/sitemap-categories.xml",
  "/sitemap-languages.xml",
  "/sitemap-topics.xml",
];

export const GET: APIRoute = () =>
  withEdgeCache(xmlResponse(renderSitemapIndex(CHILDREN)), 3600);
