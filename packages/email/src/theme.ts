/**
 * The design system, translated for email.
 *
 * Email HTML cannot use `oklch()` or CSS variables, so every token from
 * packages/ui/src/styles/config.css is resolved to a literal hex here. Keep this
 * file in sync with config.css — it is the only place an email may name a color.
 */

export const colors = {
  // primary — oklch hue 254 (brand blue)
  primary50: "#eff6ff",
  primary100: "#d3e7ff",
  primary400: "#50a0ff",
  primary500: "#0672d6",
  primary600: "#005cb1",
  primary700: "#00498f",
  primary900: "#00264f",

  // secondary — the warm "sunset" accent
  secondary300: "#f7aa6c",
  secondary500: "#fa8a00",

  // neutrals
  white: "#ffffff",
  neutral50: "#fafafa",
  neutral100: "#eff0f0",
  neutral200: "#dfe0e2",
  neutral400: "#a4a5a8",
  neutral500: "#6e7072",
  neutral600: "#4d4f51",
  neutral700: "#393a3c",
  neutral800: "#2d2e2f",

  success500: "#56ac51",
  error500: "#ff4c41",
} as const;

/**
 * Almarai is the product font but is not safe in email clients (Gmail strips
 * webfonts, Outlook ignores them). The fallback stack has to carry the design;
 * the webfont is a bonus for Apple Mail and friends.
 */
export const fontFamily =
  "'Almarai', 'Segoe UI', Tahoma, Helvetica, Arial, sans-serif";

export const radius = {
  button: "10px", // --radius
  card: "20px", // --radius-card
  panel: "10px",
} as const;

/** The brand's blue-tinted shadow (--shadow-*, primary-900 at 5%). */
export const shadow = "0 2px 4px rgba(0, 38, 79, 0.05)";

export const spacing = {
  card: "32px",
  gap: "16px",
} as const;

/** Absolute URLs — email has no relative paths and no bundler. */
export const SITE_URL = "https://www.madeinalgeria.dev";
export const CONTACT_EMAIL = "moncef@mochir.com";

/** Shared text styles, so every template speaks with one voice. */
export const text = {
  heading: {
    margin: "0 0 12px",
    fontSize: "20px",
    fontWeight: 700,
    color: colors.neutral800,
    lineHeight: "1.5",
  },
  body: {
    margin: "0 0 12px",
    fontSize: "15px",
    lineHeight: "1.8",
    color: colors.neutral500,
  },
  muted: {
    margin: "0",
    fontSize: "13px",
    lineHeight: "1.7",
    color: colors.neutral400,
  },
} as const;
