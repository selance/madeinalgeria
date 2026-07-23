import { describe, expect, it } from "vitest";
import { normalizeSearch } from "./normalize-search";

describe("normalizeSearch", () => {
  it("unifies hamza variants to bare alef", () => {
    const bare = normalizeSearch("احمد");
    expect(normalizeSearch("أحمد")).toBe(bare);
    expect(normalizeSearch("إحمد")).toBe(bare);
    expect(normalizeSearch("آحمد")).toBe(bare);
    expect(normalizeSearch("ٱحمد")).toBe(bare);
  });

  it("folds ta-marbuta to ha", () => {
    expect(normalizeSearch("شركة")).toBe(normalizeSearch("شركه"));
  });

  it("folds alef-maqsura to ya", () => {
    expect(normalizeSearch("مصطفى")).toBe(normalizeSearch("مصطفي"));
  });

  it("folds hamza on waw and ya carriers", () => {
    expect(normalizeSearch("مؤسسة")).toBe(normalizeSearch("موسسه"));
    expect(normalizeSearch("مسئول")).toBe(normalizeSearch("مسيول"));
  });

  it("strips tatweel and diacritics", () => {
    expect(normalizeSearch("مـحـمـد")).toBe(normalizeSearch("محمد"));
    expect(normalizeSearch("مُحَمَّد")).toBe(normalizeSearch("محمد"));
  });

  it("folds Arabic-Indic digits to Latin", () => {
    expect(normalizeSearch("٢٠٢٤")).toBe("2024");
    expect(normalizeSearch("۲۰۲۴")).toBe("2024");
  });

  it("collapses whitespace, trims, and lowercases Latin", () => {
    expect(normalizeSearch("  Foo   Bar  ")).toBe("foo bar");
  });
});
