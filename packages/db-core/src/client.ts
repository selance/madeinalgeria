import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DbCore = DrizzleD1Database<typeof schema>;

/** The only way modules get a core DB handle (via their repo.ts). */
export function createDbCore(d1: D1Database): DbCore {
  return drizzle(d1, { schema });
}
