/** Canonical production origin — canonicals/OG always point here. */
export const SITE = "https://www.madeinalgeria.dev";

export const SITE_NAME = "Made in Algeria | صُنع في الجزائر";

/**
 * Default social-share card (1200×630). Pages without their own `image` fall
 * back to this so every share renders a large card. Ship the PNG at
 * `public/og-default.png` (a per-project dynamic endpoint can replace it later).
 */
export const DEFAULT_OG_IMAGE = "/og-default.png";

/** The studio that builds and operates the directory (footer credit + JSON-LD publisher). */
export const SELANCE_URL = "https://selance.com";

/** The open-source home. Centralized so the header, contributions section, and footer share one source. */
export const GITHUB_REPO = "selance/madeinalgeria";
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
/** Public contributors API (top 24). Unauth, tolerant of failure; empty while the repo is private. */
export const GITHUB_CONTRIBUTORS_API = `https://api.github.com/repos/${GITHUB_REPO}/contributors?per_page=30`;

export const DEFAULT_KEYWORDS = [
  "Made in Algeria",
  "Algeria",
  "open source",
  "Algerian developers",
  "GitHub",
  "صُنع في الجزائر",
  "الجزائر",
  "مفتوح المصدر",
];
