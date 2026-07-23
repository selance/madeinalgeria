import type { APIRoute } from "astro";
import { renderUrlset, xmlResponse } from "../lib/sitemap";
import { withEdgeCache } from "../lib/edge-cache";

export const prerender = false;

// The fixed pages + hub landing pages (both locales are emitted per path).
const STATIC_PATHS = [
  "/",
  "/projects",
  "/projects/top",
  "/projects/new",
  "/developers",
  "/about",
  "/submit",
  "/hire",
  "/sitemap",
  "/terms",
  "/privacy",
];

export const GET: APIRoute = () =>
  withEdgeCache(xmlResponse(renderUrlset(STATIC_PATHS.map((path) => ({ path })))), 3600);
