# @mia/discover — GitHub discovery CLI

Finds popular public repos by Algerian developers (location search, topic
search, optional curated list) and emits `tools/seed/projects.sql` — an
idempotent seed file for the `projects` D1 table.

## Usage

```sh
cd tools/discover
GITHUB_TOKEN=ghp_xxx node discover.mjs --curated --dump-json raw.json
```

Flags:

| Flag | Default | Meaning |
| --- | --- | --- |
| `--min-stars N` | `3` | Minimum stargazers to keep a repo |
| `--out PATH` | `../seed/projects.sql` | Output SQL file |
| `--curated` | off | Also harvest the gayanvoice/top-github-users Algeria list |
| `--max-users N` | `1500` | Cap on users whose repos are harvested |
| `--dump-json PATH` | — | Write the kept-repo array as JSON (for offline re-runs) |
| `--from-json PATH` | — | Skip all network; read a previously dumped repo array |
| `--existing PATH` | — | JSON array of `{repo_full_name, slug}` from the DB — keeps slugs stable |

## Token

Set `GITHUB_TOKEN` to any personal access token — **no scopes needed** (public
data only; classic token with no boxes checked, or a fine-grained token with
public repository read access). Without a token GitHub allows only 60
requests/hour, which is far too few for a full run; the CLI warns and proceeds
anyway. Authenticated limits: 30 search requests/min (the CLI throttles to
2.2s between search calls) and 5000 core requests/hour. Rate-limit responses
(403/429) are handled by sleeping until `x-ratelimit-reset`.

## Seed flow

The generated SQL is an upsert: `INSERT ... ON CONFLICT(repo_full_name) DO
UPDATE` that refreshes GitHub metadata only. It never touches editorial
columns (`slug`, `status`, `category_id`, `is_featured`, `description_ar`,
review/submission fields) — safe to re-run against a reviewed database. New
rows land as `status='pending'`, `source='seed'`.

```sh
pnpm --filter @mia/api seed:projects:local        # local miniflare D1
pnpm --filter @mia/api seed:projects:staging      # remote staging
pnpm --filter @mia/api seed:projects:production   # remote production
```

Verify locally, review on staging, then apply to production.

## Keeping slugs stable across re-runs

Slugs are set once at insert and never updated, so re-applying the SQL cannot
change a live slug. But a fresh generation could assign a *different* slug to
a repo that already exists in the DB (collision order changes as the dataset
grows) — harmless for updates, wrong if the row is ever re-inserted elsewhere.
To make generation deterministic against production, export current slugs and
pass them back:

```sh
cd apps/api
pnpm exec wrangler d1 execute mia-core-prod --env production --remote --json \
  --command "SELECT repo_full_name, slug FROM projects" > ../../tools/discover/existing.json
# extract the results array from the wrangler JSON envelope, then:
node discover.mjs --existing existing.json
```

`--existing` slugs are reused verbatim; only genuinely new repos get new slugs.
