import { describe, expect, it } from "vitest";
import { highlightMatch } from "./highlight-match";
import { normalizeSearch } from "./normalize-search";

const joined = (segments: { text: string }[]) => segments.map((s) => s.text).join("");
const marked = (segments: { text: string; match: boolean }[]) =>
  segments.filter((s) => s.match).map((s) => s.text);

describe("highlightMatch", () => {
  it("segments always reassemble the original string", () => {
    for (const [original, term] of [
      ["شركة الأمل للنقل", "الامل"],
      ["مؤسسة النور", "نور"],
      ["SARL Amel", "sarl"],
      ["شركة", "لا يطابق"],
    ] as const) {
      expect(joined(highlightMatch(original, term))).toBe(original);
    }
  });

  it("highlights across hamza/ta-marbuta variants", () => {
    const segments = highlightMatch("شركة الأمل", "شركه الامل");
    expect(marked(segments)).toEqual(["شركة", "الأمل"]);
  });

  it("maps positions correctly when the original has diacritics and tatweel", () => {
    const segments = highlightMatch("مـؤَسّسة النور", "موسسه");
    expect(marked(segments)).toEqual(["مـؤَسّسة"]);
  });

  it("highlights each word of a multi-word term regardless of order", () => {
    const segments = highlightMatch("الأمل شركة", "شركه الامل");
    expect(marked(segments)).toEqual(["الأمل", "شركة"]);
    expect(joined(segments)).toBe("الأمل شركة");
  });

  it("highlights every occurrence and merges overlapping ranges", () => {
    const segments = highlightMatch("نور النور", "نور");
    expect(marked(segments)).toEqual(["نور", "نور"]);
  });

  it("is case-insensitive for Latin names", () => {
    expect(marked(highlightMatch("SARL Amel Transport", "amel"))).toEqual(["Amel"]);
  });

  it("returns a single non-match segment when nothing matches or term is empty", () => {
    expect(highlightMatch("شركة الأمل", "زواوي")).toEqual([
      { text: "شركة الأمل", match: false },
    ]);
    expect(highlightMatch("شركة الأمل", "  ")).toEqual([{ text: "شركة الأمل", match: false }]);
  });

  it("accepts raw (unnormalized) query input", () => {
    expect(marked(highlightMatch("شركة الأمل", "الأَمَل"))).toEqual(["الأمل"]);
  });

  it("matches folded Arabic-Indic digits", () => {
    expect(marked(highlightMatch("مؤسسة ٢٠٢٤", "2024"))).toEqual(["٢٠٢٤"]);
  });

  it("per-char normalization stays consistent with normalizeSearch", () => {
    // Guard against drift between the two paths: highlighting a full exact
    // match must cover the entire (trimmed) original.
    for (const original of ["  شركة   الأمل  ", "مـؤَسّسة النور", "SARL Café ٢٠٢٤"]) {
      const segments = highlightMatch(original, normalizeSearch(original));
      expect(marked(segments).join(" ").trim().length).toBeGreaterThan(0);
      expect(segments.filter((s) => !s.match).every((s) => s.text.trim() === "")).toBe(true);
    }
  });
});
