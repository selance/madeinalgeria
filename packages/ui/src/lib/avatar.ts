// Letter-tile placeholder helpers for missing company logos / user avatars.
// A missing image becomes a brand-colored gradient tile with the name's first
// letter — deterministic per name, so a given company always looks the same.

/**
 * First non-whitespace character of a name, code-point safe (so Arabic and
 * Latin both work). Latin letters are upper-cased; Arabic is unaffected.
 * Falls back to the Arabic question mark `؟` (matches the admin chat convention).
 */
/**
 * True when a stored logo/image URL is not a real logo but a legacy placeholder
 * — the v1 ui-avatars.com generated avatars, or the old default profile.png.
 * Such URLs should be ignored so the letter tile shows instead.
 */
export const isPlaceholderLogoUrl = (url?: string | null): boolean => {
  if (!url) return true;
  const u = url.toLowerCase();
  return u.includes("ui-avatars.com") || u.endsWith("/profile.png") || u.endsWith("profile.png");
};

export const getAvatarInitial = (name?: string | null): string => {
  const first = Array.from((name ?? "").trim())[0];
  return first ? first.toLocaleUpperCase() : "؟";
};

// Full literal Tailwind class strings so the JIT scanner emits them. Drawn from
// the brand families in packages/ui/src/styles/config.css (the same tiles the
// landing animations use). Never build these by concatenation.
const AVATAR_TILES = [
  "from-primary-400 to-primary-700 !border-primary-700",
  "from-secondary-400 to-secondary-700 !border-secondary-700",
  "from-info-400 to-info-600 !border-info-700",
  "from-emerald-400 to-emerald-600 !border-emerald-700",
  "from-success-400 to-success-600 !border-success-700",
  "from-warning-400 to-warning-600 !border-warning-700",
] as const;

/**
 * Deterministic gradient-tile classes for a name. The same name always maps to
 * the same color; empty/nullish names get the first (primary) tile.
 */
export const getAvatarTile = (name?: string | null): string => {
  const key = (name ?? "").trim();
  let hash = 0;
  for (const ch of key) {
    hash = (hash * 31 + ch.codePointAt(0)!) | 0;
  }
  return AVATAR_TILES[Math.abs(hash) % AVATAR_TILES.length];
};
