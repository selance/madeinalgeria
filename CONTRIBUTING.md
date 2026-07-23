# Contributing

Thanks for helping improve **Made in Algeria**. This is a pnpm monorepo — a modular monolith on Cloudflare Workers (TypeScript, Hono on the backend, React 19 SPAs, Astro for the public site, Drizzle on D1, better-auth). This guide gets you from clone to a passing PR.

## Prerequisites

- **Node** ≥ 22
- **pnpm** 10.11.1 (the repo pins `packageManager`; run `corepack enable` to get the right version automatically)

## Local setup

```sh
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars   # local secrets — gitignored
pnpm --filter @mia/api db:migrate:local            # apply migrations to the local D1
pnpm dev:api                                        # miniflare :8787 — GET /health should answer
```

Only `AUTH_SECRET` (≥32 chars) is required locally. Without `RESEND_API_KEY`, emails print to the console. To bring up a frontend alongside the API:

```sh
pnpm --filter @mia/app dev         # user dashboard SPA — vite :5173 (RTL login should render)
pnpm --filter @mia/admin-web dev   # admin dashboard SPA
pnpm --filter @mia/web dev         # public site — astro :4321
```

Optional: seed local reference data with `pnpm --filter @mia/api seed:local`.

## Before you open a PR

Run the full pipeline and fix failures before pushing:

```sh
pnpm typecheck   # all workspaces
pnpm lint        # oxlint, whole repo (config in .oxlintrc.json)
pnpm test        # vitest across all workspaces
```

New code ships with tests. Vitest specs are colocated (`*.test.ts` next to source); API behavior gets a workerd integration test in `apps/api/test` (real migrations, isolated storage per test). Logic the SPAs rely on belongs in a package where it can be tested — the SPAs themselves have no test runner.

## Secrets — do not commit them

The tracked `.env` / `.env.staging` / `.env.production` files under `apps/*` are **intentionally committed** and hold only **public** values (base URLs for the SPA builds). Never put a real secret in them.

- **Locally**: secrets go in `apps/api/.dev.vars` (gitignored).
- **Deploys**: secrets go through `wrangler secret put NAME --env <env>` — never in `wrangler.jsonc` `vars`.
- On Windows, set secrets from **bash**, never PowerShell (PowerShell piping adds a UTF-8 BOM that corrupts the value): `printf '%s' "$VALUE" | wrangler secret put NAME --env staging`.

## Commits & PRs

- Conventional commit style scoped to the workspace: `feat(api): …`, `fix(web): …`, `refactor(ui): …`, `docs: …`.
- Keep PRs focused; fill out the PR template (summary, type of change, checklist).
- The pipeline above must pass. CI deploys `main` to staging on merge; production is a manual dispatch.

## Repo layout

- `apps/*` — one Cloudflare Worker each: `api` (public API), `admin-api`, `app` (user SPA), `admin-web` (admin SPA), `web` (Astro public site).
- `packages/*` — shared code: `ui` (design system), `contracts` (zod schemas — the only cross-module surface), `db-core` (Drizzle schema + migrations), `auth`, `email`, `api-client`, `core`, and `modules/*` (billing, identity, notifications, reference).

**Architecture, conventions, and data rules** live in [CLAUDE.md](CLAUDE.md) and `.claude/rules/`. Patterns deliberately left out of the starter are catalogued in [docs/patterns.md](docs/patterns.md). Frontend/design-system standards are in `.claude/rules/design-system.md`. Read the relevant one before you start; it will save a review round-trip.

## UI conventions

The UI is Arabic and RTL (`dir="rtl"`) throughout, with Arabic labels and empty states. Numbers use Western digits (`toLocaleString("ar-DZ")`), never Arabic-Indic numerals. Reuse `@mia/ui` primitives and the app's existing components before writing new ones.

## Reporting security issues

Please **do not** open a public issue for a vulnerability — see [SECURITY.md](SECURITY.md) for private disclosure.
