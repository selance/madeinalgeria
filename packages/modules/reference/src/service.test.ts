import { describe, expect, it } from "vitest";
import { ReferenceService, type ReferenceKV } from "./service";
import type { ReferenceRepo } from "./repo";

function fakeKv(): ReferenceKV & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    async get(key) {
      return data.get(key) ?? null;
    },
    async put(key, value) {
      data.set(key, value);
    },
  };
}

function fakeRepo(calls: { count: number }) {
  return {
    listLanguages: async () => {
      calls.count++;
      return [{ id: 1, code: "fr", name: "Français" }];
    },
    listStates: async () => {
      calls.count++;
      return [
        { id: 1, countryId: 1, code: "16", isActive: true, names: { fr: "Alger" } },
        { id: 2, countryId: 2, code: null, isActive: true, names: {} },
      ];
    },
  } as unknown as ReferenceRepo;
}

describe("ReferenceService caching", () => {
  it("hits the repo once, then serves from KV", async () => {
    const calls = { count: 0 };
    const service = new ReferenceService(fakeRepo(calls), fakeKv());

    const first = await service.listLanguages();
    const second = await service.listLanguages();

    expect(first).toEqual(second);
    expect(calls.count).toBe(1);
  });

  it("invalidate() bumps the version so the next read reloads", async () => {
    const calls = { count: 0 };
    const service = new ReferenceService(fakeRepo(calls), fakeKv());

    await service.listLanguages();
    await service.invalidate();
    await service.listLanguages();

    expect(calls.count).toBe(2);
  });

  it("filters states by countryId on top of the shared cache entry", async () => {
    const calls = { count: 0 };
    const service = new ReferenceService(fakeRepo(calls), fakeKv());

    const all = await service.listStates();
    const dz = await service.listStates(1);

    expect(all).toHaveLength(2);
    expect(dz).toHaveLength(1);
    expect(dz[0]?.countryId).toBe(1);
    expect(calls.count).toBe(1);
  });

  it("falls through to the repo when KV throws", async () => {
    const calls = { count: 0 };
    const broken: ReferenceKV = {
      get: async () => {
        throw new Error("kv down");
      },
      put: async () => {
        throw new Error("kv down");
      },
    };
    const service = new ReferenceService(fakeRepo(calls), broken);

    const langs = await service.listLanguages();
    expect(langs).toHaveLength(1);
    expect(calls.count).toBe(1);
  });
});
