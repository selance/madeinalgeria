import { describe, expect, it } from "vitest";
import { formatDateAr } from "./format-date";

describe("formatDateAr", () => {
  it("zero-pads day and month with no bidi marks", () => {
    expect(formatDateAr(new Date(2026, 1, 4))).toBe("04/02/2026");
  });

  it("does not pad the year", () => {
    expect(formatDateAr(new Date(2026, 11, 31))).toBe("31/12/2026");
  });

  it("accepts a timestamp or ISO string", () => {
    const d = new Date(2026, 1, 4);
    expect(formatDateAr(d.getTime())).toBe("04/02/2026");
    expect(formatDateAr(d.toISOString())).toBe(formatDateAr(d));
  });
});
