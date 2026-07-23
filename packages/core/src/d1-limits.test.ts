import { describe, expect, it } from "vitest";
import { batchInsert, chunk, chunkedIn } from "./d1-limits";

describe("chunk", () => {
  it("splits into fixed-size chunks with a smaller tail", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns empty for empty input", () => {
    expect(chunk([], 10)).toEqual([]);
  });

  it("rejects non-positive sizes", () => {
    expect(() => chunk([1], 0)).toThrow(RangeError);
  });
});

describe("chunkedIn", () => {
  it("batches ids at ≤ batch size and concatenates results", async () => {
    const ids = Array.from({ length: 250 }, (_, i) => i);
    const calls: number[][] = [];
    const rows = await chunkedIn(ids, async (c) => {
      calls.push(c);
      return c.map((id) => ({ id }));
    });

    expect(calls.map((c) => c.length)).toEqual([90, 90, 70]);
    expect(rows).toHaveLength(250);
    expect(rows[0]).toEqual({ id: 0 });
    expect(rows[249]).toEqual({ id: 249 });
  });

  it("de-duplicates ids before querying", async () => {
    const calls: string[][] = [];
    await chunkedIn(["a", "b", "a", "b"], async (c) => {
      calls.push(c);
      return [];
    });
    expect(calls).toEqual([["a", "b"]]);
  });

  it("does not query at all for zero ids", async () => {
    let called = false;
    const rows = await chunkedIn([], async () => {
      called = true;
      return [];
    });
    expect(called).toBe(false);
    expect(rows).toEqual([]);
  });

  it("refuses batch sizes above D1's param limit", async () => {
    await expect(chunkedIn([1], async () => [], 101)).rejects.toThrow(RangeError);
  });
});

describe("batchInsert", () => {
  it("keeps every batch under the bound-param budget", async () => {
    // 5 columns per row, budget 90 params → max 18 rows per statement
    const rows = Array.from({ length: 40 }, (_, i) => ({ a: i, b: i, c: i, d: i, e: i }));
    const batches: number[] = [];
    const n = await batchInsert(rows, async (b) => {
      batches.push(b.length);
    });

    expect(n).toBe(40);
    expect(batches).toEqual([18, 18, 4]);
    expect(Math.max(...batches) * 5).toBeLessThanOrEqual(90);
  });

  it("also splits on estimated SQL text size", async () => {
    const big = "x".repeat(40_000);
    const rows = [{ v: big }, { v: big }, { v: big }];
    const batches: number[] = [];
    await batchInsert(rows, async (b) => {
      batches.push(b.length);
    });
    // 3 × ~40 KB cannot fit in one ~90 KB statement
    expect(batches.length).toBeGreaterThan(1);
    expect(batches.reduce((s, x) => s + x, 0)).toBe(3);
  });

  it("preserves row order across batches", async () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const seen: number[] = [];
    await batchInsert(rows, async (b) => {
      seen.push(...b.map((r) => r.id));
    });
    expect(seen).toEqual(rows.map((r) => r.id));
  });

  it("no-ops on empty input", async () => {
    let called = false;
    const n = await batchInsert([], async () => {
      called = true;
    });
    expect(n).toBe(0);
    expect(called).toBe(false);
  });

  it("rejects a single row wider than the param budget", async () => {
    const wide = Object.fromEntries(Array.from({ length: 95 }, (_, i) => [`c${i}`, i]));
    await expect(batchInsert([wide], async () => {})).rejects.toThrow(RangeError);
  });
});
