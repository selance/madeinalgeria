/**
 * The design system, translated for email.
 *
 * Email HTML cannot use `oklch()` or CSS variables, so every token from
 * packages/ui/src/styles/config.css is resolved to a literal hex here. Keep this
 * file in sync with config.css — it is the only place an email may name a color.
 */

export const colors = {
  // primary — deep pine green (the editorial "print on paper" brand)
  primary50: "#eafaf0",
  primary100: "#d2f1df",
  primary400: "#4b916e",
  primary500: "#1a6444",
  primary600: "#0c5537",
  primary700: "#00472c",
  primary800: "#003821",
  primary900: "#002a17",

  // secondary — muted steel-blue accent
  secondary300: "#8fbee0",
  secondary500: "#3a78a1",
  secondary600: "#296389",

  // neutrals — warm paper
  white: "#ffffff",
  neutral50: "#faf8f5",
  neutral100: "#f1eeea",
  neutral200: "#e1ddd8",
  neutral400: "#9b9891",
  neutral500: "#6f6b65",
  neutral600: "#55524c",
  neutral700: "#403d37",
  neutral800: "#2e2b26",
  neutral900: "#1f1d19",

  success500: "#4e943e",
  error500: "#d7352d",
  error50: "#fdeceb",
} as const;

/**
 * Almarai is the product font but is not safe in email clients (Gmail strips
 * webfonts, Outlook ignores them). The fallback stack has to carry the design;
 * the webfont is a bonus for Apple Mail and friends.
 */
export const fontFamily =
  "'Almarai', 'Segoe UI', Tahoma, Helvetica, Arial, sans-serif";

export const radius = {
  button: "6px", // --radius (controls)
  card: "12px", // --radius-card
  panel: "8px",
} as const;

/** Flat "print block" offset — the design system uses hard, zero-blur offsets, never soft glows (warm-ink shadow). */
export const shadow = "0 2px 0 rgba(17,15,12,0.08)";

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
