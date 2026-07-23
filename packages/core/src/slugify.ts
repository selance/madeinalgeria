/** URL-safe slugs from company names (Latin + Arabic input tolerated). */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "-") // keep latin digits + arabic block
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Appends a short random suffix — for uniqueness collisions on insert. */
export function slugifyUnique(input: string): string {
  const base = slugify(input) || "company";
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}
