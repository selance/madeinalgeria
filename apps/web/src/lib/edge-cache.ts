/**
 * Edge-cache the SSR SEO endpoints (sitemap, RSS, hub pages, OG images). These
 * read the same KV-cached API the pages read, so a short shared cache with a
 * long stale-while-revalidate keeps crawlers fast without going stale for long.
 * Mirrors the `cf.cacheTtl` idiom already used for the home contributors fetch.
 */
export function withEdgeCache(response: Response, seconds: number): Response {
  const swr = Math.max(seconds, 86400);
  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${seconds}, stale-while-revalidate=${swr}`,
  );
  return response;
}

/** XML-escape a string for safe interpolation into sitemap/RSS documents. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
