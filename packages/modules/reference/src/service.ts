import type {
  CategoryItem,
  Country,
  Language,
  ReferenceReadService,
  State,
} from "@mia/contracts";
import type { ReferenceRepo } from "./repo";

/**
 * KV-cached reference reads (plan §3): versioned keys + 24h TTL. Admin writes
 * bump the version key, orphaning every cached entry at once — no per-key
 * invalidation, and stale keys expire via TTL.
 */

const CACHE_TTL_SECONDS = 24 * 60 * 60;
const VERSION_KEY = "ref:version";

export interface ReferenceKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

type Entity = "languages" | "countries" | "states" | "categories";

export class ReferenceService implements ReferenceReadService {
  constructor(
    private repo: ReferenceRepo,
    private kv: ReferenceKV,
  ) {}

  // ── Cached public reads ───────────────────────────────────────────────
  listLanguages(): Promise<Language[]> {
    return this.cached("languages", () => this.repo.listLanguages());
  }

  listCountries(): Promise<Country[]> {
    return this.cached("countries", () => this.repo.listCountries());
  }

  async listStates(countryId?: number): Promise<State[]> {
    const states = await this.cached("states", () => this.repo.listStates());
    return countryId === undefined ? states : states.filter((s) => s.countryId === countryId);
  }

  listCategories(): Promise<CategoryItem[]> {
    return this.cached("categories", () => this.repo.listCategories());
  }

  /** Called by every admin write. Public exactly so admin-router can use it. */
  async invalidate(): Promise<void> {
    const version = await this.currentVersion();
    await this.kv.put(VERSION_KEY, String(version + 1));
  }

  private async currentVersion(): Promise<number> {
    const raw = await this.kv.get(VERSION_KEY);
    const version = raw === null ? 0 : Number(raw);
    return Number.isFinite(version) ? version : 0;
  }

  private async cached<T>(entity: Entity, load: () => Promise<T>): Promise<T> {
    let key: string | undefined;
    try {
      const version = await this.currentVersion();
      key = `ref:v${version}:${entity}`;
      const hit = await this.kv.get(key);
      if (hit !== null) return JSON.parse(hit) as T;
    } catch (error) {
      // Cache read problems must never take reads down — fall through to D1.
      console.error(`Reference cache read failed for ${entity}:`, error);
    }

    const fresh = await load();
    if (key !== undefined) {
      try {
        await this.kv.put(key, JSON.stringify(fresh), { expirationTtl: CACHE_TTL_SECONDS });
      } catch (error) {
        console.error(`Reference cache write failed for ${entity}:`, error);
      }
    }
    return fresh;
  }
}
