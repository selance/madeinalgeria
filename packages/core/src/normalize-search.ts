/**
 * Arabic-aware search normalization. Applied to BOTH stored company names
 * (`company_translations.name_normalized`) and the incoming query so that the
 * common ways users misspell Arabic — hamza variants, ta-marbuta vs ha,
 * alef-maqsura vs ya, tatweel padding, harakat, Arabic-Indic digits — all
 * collapse to the same key and match. Pure, deterministic; safe to run on
 * every write and every keystroke.
 */

// Arabic combining marks (U+064B–U+065F): harakat/tashkeel plus the hamza
// (U+0654/U+0655) and madda (U+0653) marks that NFKD splits off أ/إ/آ/ؤ/ئ —
// stripping them collapses every hamza carrier onto its bare base letter. Plus
// the superscript alef (U+0670) and tatweel (U+0640, a semantic-free stretch).
// Careful editing this class: the chars are combining marks that render (and
// reorder) invisibly in editors — verify code points, not appearance.
const DIACRITICS = /[ً-ٰٟـ]/g;
// Arabic-Indic (U+0660–0669) and Eastern Arabic-Indic (U+06F0–06F9) digits.
const ARABIC_INDIC_DIGITS = /[٠-٩۰-۹]/g;

function foldDigit(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
  if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
  return ch;
}

/**
 * Normalize a single code point (whitespace handling excluded — that is
 * `normalizeSearch`'s job). May return zero chars (stripped mark/tatweel) or
 * several (ligature decomposition). `highlightMatch` walks the original string
 * through this to map normalized match positions back to original positions,
 * so it must stay the single source of truth for per-character folding.
 */
export function normalizeSearchChar(ch: string): string {
  return (
    ch
      // Canonical decomposition splits أ/إ/آ/ؤ/ئ into base + combining mark and
      // é into e + accent; the strips below then drop the marks.
      .normalize("NFKD")
      // Latin combining diacritics left over from NFKD (é → e).
      .replace(/[̀-ͯ]/g, "")
      // Arabic harakat, hamza/madda marks, superscript alef, tatweel.
      .replace(DIACRITICS, "")
      // Alef wasla (U+0671) has no decomposition — fold it to bare alef.
      .replace(/ٱ/g, "ا")
      // Ta marbuta → ha (common informal spelling).
      .replace(/ة/g, "ه")
      // Alef maqsura → ya.
      .replace(/ى/g, "ي")
      // Fold Arabic-Indic digits to Latin.
      .replace(ARABIC_INDIC_DIGITS, foldDigit)
      .toLowerCase()
  );
}

export function normalizeSearch(input: string): string {
  let out = "";
  for (const ch of input) out += normalizeSearchChar(ch);
  return out.replace(/\s+/g, " ").trim();
}
