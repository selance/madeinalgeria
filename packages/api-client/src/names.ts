/**
 * Arabic-first display-name resolution for `names`-style translation maps
 * (reference items, company names/addresses/descriptions). Production data is
 * almost entirely Arabic; fr/en are sparse fallbacks.
 */
export function pickName(
  names: Record<string, string> | undefined | null,
  fallback = "",
): string {
  if (!names) return fallback;
  return names["ar"] ?? names["fr"] ?? names["en"] ?? Object.values(names)[0] ?? fallback;
}
