# Proven patterns not included in this template

These were built and battle-tested in the source project this template was extracted from. They're documented here so a future product can re-add them deliberately instead of reinventing them.

## Per-market / multi-tenant D1 registry

When one product serves several markets (or tenants) with separate catalog databases: a `MARKETS` registry in `packages/core` maps market code → `{ binding, locale, currency, label }`; each market gets its own D1 binding (`DB_CATALOG_XX`) declared in wrangler; a `/:market` path segment + resolver middleware validates the code and stores it on the Hono context; the container holds `Map<MarketCode, Service>` instances resolving the binding dynamically. Rules that made it work: a **separate schema package** per DB shape (one schema → N market DBs, migrations applied per market), **no cross-DB foreign keys** — ids pointing across DBs are opaque bare columns; and literal routes must be mounted **before** the `/:market` param mount or the param swallows them.

## R2-cached server-rendered pages (Astro)

SEO pages render once in the Worker, are stored as HTML in R2 keyed by path + `PUBLIC_BUILD_ID`, and served from R2/edge-cache until invalidated. Invalidation is a `page.render` queue job enqueued by admin writes (via `onUpserted`/`onDeleted` callbacks passed into admin routers). Gotcha: deploying the web app rotates the build id, implicitly invalidating everything — re-run a full rebuild after deploys.

## Durable Object realtime chat

One DO class per conversation scope (e.g. per company), SQLite storage inside the DO, WebSocket hibernation for cheap idle connections, and a small index table in the core DB for listing conversations (keyset-paginated by `lastActivityAt` + id compound cursor). The DO lives in the public api Worker; the admin api binds it cross-worker via `script_name` (note: cross-worker DO bindings don't resolve in local miniflare).

## Vectorize semantic search

A Vectorize index (cosine, dims matching the embedding model) per market; embeddings generated via Workers AI on entity upsert (queue job), queried in a `/search/semantic` route with a keyword fallback when the binding is absent (dev/tests). Keep the classifier/embedder behind a container factory that returns a mock when `env.AI` is unbound.

## Analytics Engine telemetry + cron rollups

`writeDataPoint` from post-response middleware (never block the request), one dataset per concern; a nightly cron aggregates AE query results into a `*_stats_daily` D1 table the dashboards read. Guard advancing cursors **before** sending anything (advance-then-send) so at-least-once cron reruns can't double-send.

## Self-re-enqueueing cursor jobs

For work larger than one queue invocation: the job carries `{ runId, cursor }`, processes one batch, then re-enqueues itself with the advanced cursor. Guards that proved necessary against at-least-once redelivery forking the chain: a KV `runId:done` marker checked on entry (kill switch + dedupe), cursor monotonicity check, and a max-hops backstop. A live, simpler example ships in this template: the `campaign.dispatch` job in `packages/modules/notifications` re-enqueues per recipient batch.

## Contact-click / view tracking

A redirect endpoint (`/track/contact`) + a view beacon writing to Analytics Engine, rate-limited per IP, rolled up nightly into per-entity daily stats, surfaced in a monthly digest email. Pace bulk digest sends (~30s hops between batches) and use a KV "done" marker as the kill switch.
