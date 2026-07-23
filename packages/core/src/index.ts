export { AppError, toErrorEnvelope } from "./app-error";
export type { AppErrorCode, ErrorEnvelope } from "./app-error";

export { slugify, slugifyUnique } from "./slugify";

export { formatDateAr } from "./format-date";

export { normalizeSearch, normalizeSearchChar } from "./normalize-search";

export { highlightMatch } from "./highlight-match";
export type { MatchSegment } from "./highlight-match";

export {
  D1_MAX_BOUND_PARAMS,
  D1_MAX_SQL_BYTES,
  DEFAULT_IN_BATCH,
  chunk,
  chunkedIn,
  batchInsert,
} from "./d1-limits";
export type { BatchInsertOptions } from "./d1-limits";
