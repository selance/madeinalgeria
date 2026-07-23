import { normalizeSearch, normalizeSearchChar } from "./normalize-search";

/** One run of an original string; `match` runs get wrapped in `<mark>`. */
export interface MatchSegment {
  text: string;
  match: boolean;
}

/**
 * Split `original` into segments marking where the search term matches, for
 * typeahead/result highlighting. Matching happens in normalized space (same
 * folding as `normalizeSearch`, so "شركه" highlights inside "الشَّرِكَة") and
 * positions are mapped back to the original string, so hamza variants,
 * diacritics, tatweel and ligatures don't shift the highlight. Multi-word
 * terms highlight every occurrence of each word independently.
 *
 * Always returns at least one segment; when nothing matches, the whole
 * string comes back as a single non-match segment.
 */
export function highlightMatch(original: string, term: string): MatchSegment[] {
  // Idempotent — safe whether the caller passes the raw or normalized query.
  const normalizedTerm = normalizeSearch(term);
  if (!original || !normalizedTerm) return [{ text: original, match: false }];

  // Walk the original string through the char-level normalizer, recording for
  // each normalized char the original code-point start index. Whitespace is
  // collapsed the way normalizeSearch does it (runs map to their first char).
  const normChars: string[] = [];
  const starts: number[] = [];
  let i = 0;
  for (const ch of original) {
    if (/\s/.test(ch)) {
      if (normChars.length > 0 && normChars[normChars.length - 1] !== " ") {
        normChars.push(" ");
        starts.push(i);
      }
    } else {
      for (const n of normalizeSearchChar(ch)) {
        normChars.push(n);
        starts.push(i);
      }
    }
    i += ch.length;
  }
  while (normChars.length > 0 && normChars[normChars.length - 1] === " ") {
    normChars.pop();
    starts.pop();
  }
  const normalized = normChars.join("");

  // Original end index for the normalized char at `pos`: everything up to the
  // next normalized char's start, so stripped marks/tatweel ride along with
  // the letter they follow instead of splitting the highlight.
  const endAt = (pos: number): number => starts[pos + 1] ?? original.length;

  // Collect original-index ranges for every occurrence of every term word.
  const ranges: [number, number][] = [];
  for (const token of normalizedTerm.split(" ")) {
    if (!token) continue;
    let from = 0;
    for (;;) {
      const at = normalized.indexOf(token, from);
      if (at === -1) break;
      // `at` indexes `normalized`, which is exactly as long as `starts`.
      ranges.push([starts[at] ?? 0, endAt(at + token.length - 1)]);
      from = at + token.length;
    }
  }
  if (ranges.length === 0) return [{ text: original, match: false }];

  // Merge overlapping/adjacent ranges, then emit alternating segments.
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }

  const segments: MatchSegment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ text: original.slice(cursor, start), match: false });
    segments.push({ text: original.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < original.length) segments.push({ text: original.slice(cursor), match: false });
  return segments;
}
