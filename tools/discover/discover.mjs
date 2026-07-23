#!/usr/bin/env node
// GitHub discovery CLI — finds popular public repos by Algerian developers and
// emits an idempotent seed SQL file for the `projects` D1 table.
//
// Usage:
//   GITHUB_TOKEN=ghp_x node discover.mjs [--min-stars 3] [--out ../seed/projects.sql]
//     [--curated] [--max-users 1500] [--from-json fixtures.json]
//     [--dump-json raw.json] [--existing existing.json]
//
// Sources (skipped entirely with --from-json):
//   1. GitHub user search by location terms (Algerian cities, ar/fr/en spellings)
//   2. Each user's repos (sorted by pushed, up to 200 per user)
//   3. Repository topic search (algeria / algerian / made-in-algeria)
//   4. --curated: the gayanvoice/top-github-users Algeria markdown list
//
// Output: multi-row INSERT ... ON CONFLICT(repo_full_name) DO UPDATE that only
// refreshes GitHub metadata — editorial columns (slug, status, category_id,
// is_featured, description_ar, review/submission fields) are never touched, so
// re-running against a reviewed database is safe.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const BOOLEAN_FLAGS = new Set(["curated"]);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg.slice(2);
    if (BOOLEAN_FLAGS.has(key)) {
      args[key] = true;
    } else {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`Missing value for --${key}`);
      }
      args[key] = value;
      i++;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const MIN_STARS = Number(args["min-stars"] ?? 3);
const MAX_USERS = Number(args["max-users"] ?? 1500);
const OUT_PATH = args.out ? resolve(process.cwd(), args.out) : resolve(SCRIPT_DIR, "../seed/projects.sql");
const FROM_JSON = args["from-json"] ? resolve(process.cwd(), args["from-json"]) : null;
const DUMP_JSON = args["dump-json"] ? resolve(process.cwd(), args["dump-json"]) : null;
const EXISTING_PATH = args.existing ? resolve(process.cwd(), args.existing) : null;
const TOKEN = process.env.GITHUB_TOKEN;

if (!Number.isFinite(MIN_STARS) || MIN_STARS < 0) throw new Error("--min-stars must be a non-negative number");
if (!Number.isFinite(MAX_USERS) || MAX_USERS < 1) throw new Error("--max-users must be a positive number");

function log(msg) {
  process.stderr.write(`${msg}\n`);
}

// ---------------------------------------------------------------------------
// GitHub HTTP layer
// ---------------------------------------------------------------------------

const API = "https://api.github.com";
const HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "madeinalgeria.dev-discovery",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

// Search endpoints: 30 req/min authenticated → ≥2.2s apart.
const SEARCH_THROTTLE_MS = 2200;
// Core endpoints: 5000 req/h authenticated → ~100ms apart is comfortable.
const CORE_THROTTLE_MS = 100;

let lastSearchAt = 0;
let lastCoreAt = 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function throttle(kind) {
  const now = Date.now();
  if (kind === "search") {
    const wait = lastSearchAt + SEARCH_THROTTLE_MS - now;
    if (wait > 0) await sleep(wait);
    lastSearchAt = Date.now();
  } else {
    const wait = lastCoreAt + CORE_THROTTLE_MS - now;
    if (wait > 0) await sleep(wait);
    lastCoreAt = Date.now();
  }
}

/** Fetch a GitHub URL, sleeping through rate-limit responses. Returns parsed JSON, or null on 404. */
async function ghFetch(url, kind = "core") {
  for (let attempt = 0; attempt < 5; attempt++) {
    await throttle(kind);
    let res;
    try {
      res = await fetch(url, { headers: HEADERS });
    } catch (err) {
      log(`  network error on ${url} (${err.message}); retrying in 5s`);
      await sleep(5000);
      continue;
    }
    if (res.status === 404) return null;
    if (res.status === 403 || res.status === 429) {
      const retryAfter = res.headers.get("retry-after");
      const reset = res.headers.get("x-ratelimit-reset");
      let waitMs = 60_000;
      if (retryAfter) waitMs = Number(retryAfter) * 1000 + 1000;
      else if (reset) waitMs = Math.max(0, Number(reset) * 1000 - Date.now()) + 1000;
      log(`  rate limited (${res.status}); sleeping ${Math.ceil(waitMs / 1000)}s until reset`);
      await sleep(waitMs);
      continue;
    }
    if (!res.ok) throw new Error(`GitHub ${res.status} for ${url}`);
    return res.json();
  }
  throw new Error(`Giving up after repeated rate limits: ${url}`);
}

// ---------------------------------------------------------------------------
// Discovery pipeline
// ---------------------------------------------------------------------------

const LOCATION_TERMS = [
  "algeria", "algiers", "alger", "oran", "constantine", "setif", "sétif",
  "annaba", "batna", "blida", "tlemcen", "bejaia", "béjaïa", "الجزائر", "وهران",
];

const TOPIC_TERMS = ["algeria", "algerian", "made-in-algeria"];

/** Search users by location terms. Returns deduped logins (case-insensitive). */
async function discoverUsers() {
  const seen = new Map(); // lowercase login → login
  for (const term of LOCATION_TERMS) {
    let found = 0;
    for (let page = 1; page <= 10; page++) {
      const q = encodeURIComponent(`location:"${term}"`);
      const url = `${API}/search/users?q=${q}&sort=followers&order=desc&per_page=100&page=${page}`;
      const data = await ghFetch(url, "search");
      const items = data?.items ?? [];
      if (items.length === 0) break;
      for (const u of items) {
        if (u?.login && !seen.has(u.login.toLowerCase())) seen.set(u.login.toLowerCase(), u.login);
      }
      found += items.length;
      // The search API caps results at 1000 per query.
      if (items.length < 100 || page * 100 >= 1000) break;
    }
    log(`location "${term}": ${found} results, ${seen.size} unique users so far`);
  }
  return [...seen.values()];
}

/** Fetch up to 200 most-recently-pushed repos for a login. */
async function harvestUserRepos(login) {
  const repos = [];
  for (let page = 1; page <= 2; page++) {
    const url = `${API}/users/${encodeURIComponent(login)}/repos?sort=pushed&per_page=100&page=${page}`;
    const data = await ghFetch(url, "core");
    if (!Array.isArray(data) || data.length === 0) break;
    repos.push(...data);
    if (data.length < 100) break;
  }
  return repos;
}

/** Search repositories by Algeria-related topics. */
async function topicSearch() {
  const repos = [];
  for (const topic of TOPIC_TERMS) {
    const url = `${API}/search/repositories?q=${encodeURIComponent(`topic:${topic}`)}&sort=stars&per_page=100`;
    const data = await ghFetch(url, "search");
    const items = data?.items ?? [];
    repos.push(...items);
    log(`topic "${topic}": ${items.length} repos`);
  }
  return repos;
}

/** Extract GitHub logins from the gayanvoice/top-github-users Algeria list. */
async function curatedLogins() {
  const url = "https://raw.githubusercontent.com/gayanvoice/top-github-users/main/markdown/algeria.md";
  const res = await fetch(url, { headers: { "User-Agent": HEADERS["User-Agent"] } });
  if (!res.ok) {
    log(`curated list fetch failed (${res.status}); skipping`);
    return [];
  }
  const md = await res.text();
  const seen = new Map();
  const NOT_LOGINS = new Set(["topics", "search", "features", "about", "orgs", "sponsors", "settings", "gayanvoice"]);
  for (const m of md.matchAll(/https:\/\/github\.com\/([A-Za-z\d][A-Za-z\d-]{0,38})(?=["')\s/]|$)/g)) {
    const login = m[1];
    const lower = login.toLowerCase();
    if (!NOT_LOGINS.has(lower) && !seen.has(lower)) seen.set(lower, login);
  }
  log(`curated list: ${seen.size} logins`);
  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Filtering, dedupe, slugs
// ---------------------------------------------------------------------------

const JUNK_NAME = /^\.?(dotfiles|config(s)?|nvim|vimrc|emacs\.d)$/i;
const AWESOME_NAME = /^awesome-/i;

function keepRepo(repo) {
  if (!repo || !repo.full_name || !repo.owner?.login) return false;
  if (repo.fork) return false;
  if (repo.private) return false;
  if ((repo.stargazers_count ?? 0) < MIN_STARS) return false;
  if (repo.size === 0) return false;
  const name = repo.name ?? "";
  // Profile-README repos (owner/owner) are not projects.
  if (name.toLowerCase() === repo.owner.login.toLowerCase()) return false;
  if (JUNK_NAME.test(name)) return false;
  // Low-star awesome-lists are noise; high-star ones are legit content.
  if (AWESOME_NAME.test(name) && (repo.stargazers_count ?? 0) < 20) return false;
  if (repo.description == null && (repo.stargazers_count ?? 0) < 10) return false;
  return true;
}

/** Dedupe by lowercase full_name — highest stars wins. */
function dedupeRepos(repos) {
  const byName = new Map();
  for (const repo of repos) {
    const key = repo.full_name.toLowerCase();
    const prev = byName.get(key);
    if (!prev || (repo.stargazers_count ?? 0) > (prev.stargazers_count ?? 0)) byName.set(key, repo);
  }
  return [...byName.values()];
}

// Keep in sync with packages/core/src/slugify.ts (Node can't import the TS source).
function slugify(input) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "-") // keep latin digits + arabic block
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Assign a stable slug per repo. Slugs from --existing are reused verbatim;
 * new slugs are slugify(name), then slugify(name-owner) on collision, then
 * numeric suffixes.
 */
function assignSlugs(repos, existingByRepo) {
  const taken = new Set();
  for (const slug of existingByRepo.values()) taken.add(slug);
  const result = [];
  for (const repo of repos) {
    const key = repo.full_name.toLowerCase();
    const existing = existingByRepo.get(key);
    if (existing) {
      result.push({ repo, slug: existing });
      continue;
    }
    let slug = slugify(repo.name) || "project";
    if (taken.has(slug)) {
      const withOwner = slugify(`${repo.name}-${repo.owner.login}`) || slug;
      if (!taken.has(withOwner)) {
        slug = withOwner;
      } else {
        let n = 2;
        while (taken.has(`${slug}-${n}`)) n++;
        slug = `${slug}-${n}`;
      }
    }
    taken.add(slug);
    result.push({ repo, slug });
  }
  return result;
}

// ---------------------------------------------------------------------------
// SQL emission
// ---------------------------------------------------------------------------

/** Escape a JS string as a SQL literal: strip BOM + control chars, double quotes. */
function sqlText(value) {
  if (value == null) return "NULL";
  let clean = "";
  for (const ch of String(value)) {
    const code = ch.codePointAt(0);
    if (code === 0xfeff) continue; // BOM
    if (code <= 0x1f) {
      clean += " "; // control chars (incl. newlines/tabs) -> single space
      continue;
    }
    clean += ch;
  }
  return `'${clean.replace(/'/g, "''")}'`;
}

function sqlInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? String(Math.trunc(n)) : "NULL";
}

/** ISO date string → unix seconds, or NULL. */
function sqlEpoch(iso) {
  if (!iso) return "NULL";
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? String(Math.floor(ms / 1000)) : "NULL";
}

function truncate(value, max) {
  if (value == null) return null;
  const s = String(value);
  return s.length > max ? s.slice(0, max) : s;
}

const INSERT_COLUMNS = [
  "slug", "repo_full_name", "name", "description", "html_url", "homepage",
  "stars", "forks", "primary_language", "topics", "license", "is_archived",
  "owner_login", "owner_avatar_url", "owner_type", "status", "source",
  "repo_created_at", "repo_pushed_at", "synced_at", "created_at", "updated_at",
];

// Metadata-only refresh: slug, status, category_id, is_featured, description_ar,
// review/submission fields, owner_login and created_at are NEVER updated.
const UPDATE_COLUMNS = [
  "name", "description", "html_url", "homepage", "stars", "forks",
  "primary_language", "topics", "license", "is_archived", "owner_avatar_url",
  "owner_type", "repo_pushed_at", "synced_at", "updated_at",
];

function rowSql({ repo, slug }) {
  const license = repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION"
    ? repo.license.spdx_id
    : (repo.license?.key ?? null);
  const values = [
    sqlText(slug),
    sqlText(repo.full_name.toLowerCase()),
    sqlText(truncate(repo.name, 120)),
    sqlText(truncate(repo.description, 500)),
    sqlText(repo.html_url),
    sqlText(repo.homepage || null),
    sqlInt(repo.stargazers_count ?? 0),
    sqlInt(repo.forks_count ?? 0),
    sqlText(truncate(repo.language, 60)),
    sqlText(JSON.stringify(Array.isArray(repo.topics) ? repo.topics : [])),
    sqlText(truncate(license, 60)),
    repo.archived ? "1" : "0",
    sqlText(repo.owner.login),
    sqlText(repo.owner.avatar_url || null),
    sqlText(repo.owner.type === "Organization" ? "Organization" : "User"),
    "'pending'",
    "'seed'",
    sqlEpoch(repo.created_at),
    sqlEpoch(repo.pushed_at),
    "strftime('%s','now')",
    "strftime('%s','now')",
    "strftime('%s','now')",
  ];
  return `(${values.join(", ")})`;
}

const MAX_STATEMENT_BYTES = 50 * 1024;
const MAX_ROWS_PER_STATEMENT = 40;

function buildSql(entries) {
  const header = [
    `-- Seed: projects directory (generated by tools/discover/discover.mjs).`,
    `-- Generated: ${new Date().toISOString()}  |  ${entries.length} repos`,
    `-- Idempotent: re-running refreshes GitHub metadata only; slug, status,`,
    `-- category_id, is_featured, description_ar, review/submission fields and`,
    `-- created_at are never touched on existing rows.`,
    `-- Apply: pnpm --filter @mia/api seed:projects:local  (or :staging / :production)`,
    `-- Regenerate: GITHUB_TOKEN=... node tools/discover/discover.mjs [--curated]`,
    ``,
  ].join("\n");

  const conflict =
    ` ON CONFLICT(repo_full_name) DO UPDATE SET ` +
    UPDATE_COLUMNS.map((c) => `${c} = excluded.${c}`).join(", ") +
    `;`;
  const prefix = `INSERT INTO projects (${INSERT_COLUMNS.join(", ")}) VALUES\n`;

  const statements = [];
  let rows = [];
  let bytes = prefix.length + conflict.length;
  const flush = () => {
    if (rows.length === 0) return;
    statements.push(prefix + rows.join(",\n") + conflict);
    rows = [];
    bytes = prefix.length + conflict.length;
  };
  for (const entry of entries) {
    const row = rowSql(entry);
    const rowBytes = Buffer.byteLength(row, "utf8") + 2;
    if (rows.length >= MAX_ROWS_PER_STATEMENT || bytes + rowBytes > MAX_STATEMENT_BYTES) flush();
    rows.push(row);
    bytes += rowBytes;
  }
  flush();
  return header + statements.join("\n\n") + "\n";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function collectRepos() {
  if (FROM_JSON) {
    log(`reading repos from ${FROM_JSON} (offline mode)`);
    return JSON.parse(readFileSync(FROM_JSON, "utf8"));
  }

  if (!TOKEN) {
    log("WARNING: GITHUB_TOKEN not set — unauthenticated requests are capped at 60/h and a full run will not finish. Proceeding anyway.");
  }

  const all = [];

  log("=== step 1: user discovery by location ===");
  let users = await discoverUsers();
  log(`discovered ${users.length} users`);

  if (args.curated) {
    log("=== curated list (gayanvoice/top-github-users) ===");
    const curated = await curatedLogins();
    const known = new Set(users.map((u) => u.toLowerCase()));
    for (const login of curated) {
      if (!known.has(login.toLowerCase())) {
        known.add(login.toLowerCase());
        users.push(login);
      }
    }
  }

  if (users.length > MAX_USERS) {
    log(`capping user list at --max-users ${MAX_USERS} (had ${users.length})`);
    users = users.slice(0, MAX_USERS);
  }

  log("=== step 2: repo harvest ===");
  let kept = 0;
  for (let i = 0; i < users.length; i++) {
    const login = users[i];
    const repos = await harvestUserRepos(login);
    const good = repos.filter(keepRepo);
    kept += good.length;
    all.push(...good);
    if ((i + 1) % 50 === 0 || i === users.length - 1) {
      log(`  ${i + 1}/${users.length} users, ${kept} repos kept`);
    }
  }

  log("=== step 3: topic search ===");
  const topical = await topicSearch();
  all.push(...topical.filter(keepRepo));

  return all;
}

async function main() {
  const raw = await collectRepos();
  const filtered = raw.filter(keepRepo);
  const deduped = dedupeRepos(filtered);
  deduped.sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0));
  log(`${raw.length} raw → ${filtered.length} after filters → ${deduped.length} after dedupe`);

  if (DUMP_JSON) {
    mkdirSync(dirname(DUMP_JSON), { recursive: true });
    writeFileSync(DUMP_JSON, JSON.stringify(deduped, null, 2));
    log(`dumped ${deduped.length} repos to ${DUMP_JSON}`);
  }

  const existingByRepo = new Map();
  if (EXISTING_PATH) {
    const rows = JSON.parse(readFileSync(EXISTING_PATH, "utf8"));
    for (const row of rows) {
      if (row?.repo_full_name && row?.slug) existingByRepo.set(row.repo_full_name.toLowerCase(), row.slug);
    }
    log(`loaded ${existingByRepo.size} existing slugs from ${EXISTING_PATH}`);
  }

  const entries = assignSlugs(deduped, existingByRepo);
  const sql = buildSql(entries);
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, sql);
  log(`wrote ${entries.length} projects to ${OUT_PATH}`);
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
