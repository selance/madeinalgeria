import type { PublicProject } from "@mia/contracts";
import { SITE, SITE_NAME, GITHUB_URL, SELANCE_URL } from "./site";
import { localizePath, type Locale } from "./i18n";

/**
 * schema.org JSON-LD builders, fed straight into the `jsonLd` prop of
 * Base.astro (which accepts an object or an array). All URLs are absolute and
 * locale-correct via SITE + localizePath. The Organization builder models
 * Selance as the publisher — an honest entity association, no user-facing sell.
 */

type Json = Record<string, unknown>;

/** Absolute URL for a site-relative path in the given locale. */
function abs(path: string, locale: Locale): string {
  return new URL(localizePath(path, locale), SITE).toString();
}

/** The publisher entity — the studio behind the directory. */
export function selanceOrganization(): Json {
  return { "@type": "Organization", name: "Selance", url: SELANCE_URL };
}

/** Organization for Made in Algeria, published by Selance. */
export function organizationJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE,
    logo: new URL("/apple-touch-icon.png", SITE).toString(),
    sameAs: [GITHUB_URL, SELANCE_URL],
    publisher: selanceOrganization(),
  };
}

/** WebSite + a SearchAction so Google can offer a sitelinks searchbox. */
export function websiteJsonLd(locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE,
    inLanguage: locale,
    publisher: selanceOrganization(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE}/projects?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** BreadcrumbList from ordered {name, path} crumbs (path is site-relative). */
export function breadcrumbJsonLd(
  crumbs: { name: string; path: string }[],
  locale: Locale,
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(c.path, locale),
    })),
  };
}

/** ItemList of projects — the ordered links a listing/hub renders. */
export function itemListJsonLd(projects: PublicProject[], locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: projects.length,
    itemListElement: projects.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: abs(`/projects/${p.slug}`, locale),
    })),
  };
}

/** CollectionPage wrapping an ItemList — for the directory index + every hub. */
export function collectionPageJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  locale: Locale;
  projects: PublicProject[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: abs(opts.path, opts.locale),
    inLanguage: opts.locale,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE },
    mainEntity: itemListJsonLd(opts.projects, opts.locale),
  };
}

/** Author/creator node from the repo owner (Person or Organization). */
export function ownerEntity(project: PublicProject): Json {
  return {
    "@type": project.ownerType === "Organization" ? "Organization" : "Person",
    name: project.ownerLogin,
    url: `https://github.com/${project.ownerLogin}`,
  };
}

/**
 * Project detail: SoftwareSourceCode (the repo) + SoftwareApplication (the
 * product, with stars/forks as interaction counters). Returned as an array to
 * merge with a BreadcrumbList at the call site.
 */
export function projectJsonLd(project: PublicProject, description: string, locale: Locale): Json[] {
  const url = abs(`/projects/${project.slug}`, locale);
  const author = ownerEntity(project);
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: project.name,
      description: description || undefined,
      codeRepository: project.htmlUrl,
      programmingLanguage: project.primaryLanguage ?? undefined,
      license: project.license ?? undefined,
      keywords: project.topics.length ? project.topics.join(", ") : undefined,
      url,
      author,
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: project.name,
      description: description || undefined,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      url,
      downloadUrl: project.htmlUrl,
      author,
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: project.stars,
        },
      ],
    },
  ];
}

/** ProfilePage + Person/Organization + their project ItemList — developer pages. */
export function developerProfileJsonLd(opts: {
  login: string;
  avatarUrl: string | null;
  ownerType: "User" | "Organization";
  path: string;
  locale: Locale;
  projects: PublicProject[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: abs(opts.path, opts.locale),
    inLanguage: opts.locale,
    mainEntity: {
      "@type": opts.ownerType === "Organization" ? "Organization" : "Person",
      name: opts.login,
      image: opts.avatarUrl ?? undefined,
      url: `https://github.com/${opts.login}`,
    },
    hasPart: itemListJsonLd(opts.projects, opts.locale),
  };
}
