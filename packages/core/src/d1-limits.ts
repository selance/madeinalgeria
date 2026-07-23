/**
 * D1 statement-limit helpers (see plan §6c).
 *
 * D1 hard limits: 100 bound parameters per statement, 100 KB of SQL text.
 * Every app-level `WHERE x IN (…)` join and every bulk insert MUST go through
 * these helpers — never call Drizzle's `inArray` with an unbounded list.
 */

export const D1_MAX_BOUND_PARAMS = 100;
export const D1_MAX_SQL_BYTES = 100_000;

/** Default id-batch size, kept under the 100-param limit with headroom for extra WHERE params. */
export const DEFAULT_IN_BATCH = 90;

export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`chunk size must be a positive integer, got ${size}`);
  }
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Runs an `IN (…)` query in batches of ≤ `batch` ids and concatenates results.
 * Ids are de-duplicated first. The caller owns the actual query:
 *
 *   const companies = await chunkedIn(favoriteIds, (ids) =>
 *     db.select().from(companies).where(inArray(companies.id, ids)),
 *   );
 */
export async function chunkedIn<Id, Row>(
  ids: readonly Id[],
  query: (idsChunk: Id[]) => Promise<Row[]>,
  batch: number = DEFAULT_IN_BATCH,
): Promise<Row[]> {
  if (batch > D1_MAX_BOUND_PARAMS) {
    throw new RangeError(`batch ${batch} exceeds D1's ${D1_MAX_BOUND_PARAMS}-param limit`);
  }
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];

  const results: Row[] = [];
  for (const idsChunk of chunk(unique, batch)) {
    results.push(...(await query(idsChunk)));
  }
  return results;
}

export interface BatchInsertOptions {
  /** Bound-param budget per statement. Defaults to 90 (headroom under D1's 100). */
  maxParams?: number;
  /** Approximate SQL-text budget per statement. Defaults to 90 KB (headroom under D1's 100 KB). */
  maxSqlBytes?: number;
}

/**
 * Splits `rows` into batches that stay under both D1 statement limits
 * (bound params AND SQL text size), then runs `insert` per batch sequentially.
 * Returns the number of rows passed through.
 *
 *   await batchInsert(rows, (batch) => db.insert(companies).values(batch));
 *
 * SQL text size is estimated from the serialized row values; the default
 * budget leaves ~10% headroom for the statement's own SQL.
 */
export async function batchInsert<Row extends Record<string, unknown>>(
  rows: readonly Row[],
  insert: (rowsChunk: Row[]) => Promise<unknown>,
  options: BatchInsertOptions = {},
): Promise<number> {
  const maxParams = options.maxParams ?? 90;
  const maxSqlBytes = options.maxSqlBytes ?? 90_000;
  if (maxParams > D1_MAX_BOUND_PARAMS) {
    throw new RangeError(`maxParams ${maxParams} exceeds D1's ${D1_MAX_BOUND_PARAMS}-param limit`);
  }
  if (rows.length === 0) return 0;

  let batchRows: Row[] = [];
  let batchParams = 0;
  let batchBytes = 0;

  const flush = async () => {
    if (batchRows.length > 0) {
      await insert(batchRows);
      batchRows = [];
      batchParams = 0;
      batchBytes = 0;
    }
  };

  for (const row of rows) {
    const params = Object.keys(row).length;
    if (params > maxParams) {
      throw new RangeError(
        `row has ${params} columns — exceeds the ${maxParams}-param budget for a single statement`,
      );
    }
    const bytes = estimateRowBytes(row);
    const overflows =
      batchRows.length > 0 && (batchParams + params > maxParams || batchBytes + bytes > maxSqlBytes);
    if (overflows) await flush();
    batchRows.push(row);
    batchParams += params;
    batchBytes += bytes;
  }
  await flush();

  return rows.length;
}

function estimateRowBytes(row: Record<string, unknown>): number {
  let total = 0;
  for (const value of Object.values(row)) {
    if (value == null) total += 4;
    else if (typeof value === "string") total += value.length + 8;
    else if (typeof value === "number" || typeof value === "boolean") total += 12;
    else total += JSON.stringify(value)?.length ?? 16;
  }
  return total;
}
