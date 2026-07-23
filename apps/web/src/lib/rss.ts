import type { PublicProject } from "@mia/contracts";
import { SITE } from "./site";
import { localizePath, ui, type Locale } from "./i18n";
import { escapeXml } from "./edge-cache";

/** "Newly added projects" RSS 2.0 feed, one per locale. */
export function renderRss(projects: PublicProject[], locale: Locale): string {
  const t = ui[locale];
  const self = new URL(locale === "ar" ? "/ar/rss.xml" : "/rss.xml", SITE).toString();
  const home = new URL(localizePath("/", locale), SITE).toString();

  const items = projects
    .map((p) => {
      const link = new URL(localizePath(`/projects/${p.slug}`, locale), SITE).toString();
      const desc = (locale === "ar" && p.descriptionAr ? p.descriptionAr : p.description) ?? "";
      const date = p.repoPushedAt ?? p.repoCreatedAt;
      const pubDate = date ? new Date(date).toUTCString() : "";
      return (
        `<item>` +
        `<title>${escapeXml(p.name)}</title>` +
        `<link>${escapeXml(link)}</link>` +
        `<guid isPermaLink="true">${escapeXml(link)}</guid>` +
        (desc ? `<description>${escapeXml(desc)}</description>` : "") +
        (pubDate ? `<pubDate>${pubDate}</pubDate>` : "") +
        `</item>`
      );
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>` +
    `<title>${escapeXml(t.feed.title)}</title>` +
    `<link>${escapeXml(home)}</link>` +
    `<description>${escapeXml(t.feed.description)}</description>` +
    `<language>${locale}</language>` +
    `<atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml"/>` +
    `${items}</channel></rss>`
  );
}
