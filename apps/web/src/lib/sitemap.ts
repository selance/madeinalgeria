import { SITE } from "./site";
import { localizePath } from "./i18n";
import { escapeXml } from "./edge-cache";

/**
 * XML sitemap builders. Every content path exists in both locales, so each base
 * path emits two <url> entries (en + ar), and each carries xhtml:link alternates
 * (en / ar / x-default=en) so Google pairs the localized versions correctly.
 */

export interface SitemapItem {
  /** Locale-agnostic, already-encoded site-relative path, e.g. "/projects/foo". */
  path: string;
  /** ISO 8601 lastmod, optional. */
  lastmod?: string;
}

function absolute(path: string): string {
  return new URL(path, SITE).toString();
}

function urlEntry(path: string, item: SitemapItem): string {
  const en = absolute(localizePath(item.path, "en"));
  const ar = absolute(localizePath(item.path, "ar"));
  const loc = absolute(path);
  const alternates = [
    `<xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}"/>`,
    `<xhtml:link rel="alternate" hreflang="ar" href="${escapeXml(ar)}"/>`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(en)}"/>`,
  ].join("");
  const lastmod = item.lastmod ? `<lastmod>${escapeXml(item.lastmod)}</lastmod>` : "";
  return `<url><loc>${escapeXml(loc)}</loc>${alternates}${lastmod}</url>`;
}

/** A <urlset> emitting both locales of every item, with hreflang alternates. */
export function renderUrlset(items: SitemapItem[]): string {
  const urls = items
    .flatMap((item) => [
      urlEntry(localizePath(item.path, "en"), item),
      urlEntry(localizePath(item.path, "ar"), item),
    ])
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`
  );
}

/** The sitemap index, pointing at absolute child-sitemap URLs. */
export function renderSitemapIndex(childPaths: string[]): string {
  const entries = childPaths
    .map((p) => `<sitemap><loc>${escapeXml(absolute(p))}</loc></sitemap>`)
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`
  );
}

/** Standard XML response with the shared edge cache. */
export function xmlResponse(body: string): Response {
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
