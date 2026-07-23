# Made in Algeria · صُنع في الجزائر

**Open-source software by Algerian developers — in one place.**

[madeinalgeria.dev](https://madeinalgeria.dev)

Algerian developers build great software, but it's scattered across GitHub with no single place to find it. **Made in Algeria** is a curated, open directory that puts that work in one place: to celebrate it, make it discoverable, and help people find and contribute to projects from their own community — libraries, tools, apps, games, and learning resources.

This repository is the whole thing: the public directory, the API behind it, the dashboards, and the tooling that discovers projects on GitHub. It's open source because the community it's about should be able to shape it.

## How the directory works

Projects arrive in two ways, and every one is reviewed by a human before it appears:

1. **Discovered or submitted** — we scan GitHub for public repos by Algerian developers, and anyone can submit a repo with a link.
2. **Reviewed** — quality over quantity: real projects only, no profile READMEs, no empty repos, no config dumps.
3. **Listed and kept fresh** — stars, language, and activity sync from GitHub, so the directory reflects reality.

## How you can help

This is a community project — the most useful things you can do:

- **Add your project** — an Algerian developer with a public repo you're proud of? [Submit it](https://madeinalgeria.dev/submit). It takes a minute.
- **Fix the directory** — spot a project that's missing, miscategorized, or wrongly attributed? Open an issue or submit a correction.
- **Help clear the review backlog** — there's a large set of discovered projects waiting on human review and better Arabic descriptions.
- **Improve the product** — search and filtering, project categories, developer profiles, the Arabic (RTL) experience, and the discovery tooling all have room to grow. Browse the [issues](https://github.com/selance/madeinalgeria/issues) or propose something.
- **Spread the word** — share the directory with Algerian developer communities so more good work gets found.

See **[CONTRIBUTING.md](CONTRIBUTING.md)** to get set up, and **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** for the ground rules.

## Tech & structure

A pnpm monorepo — a modular monolith running on Cloudflare Workers. Everything is TypeScript: Hono on the backend, React 19 on the dashboards, Astro for the public site, Drizzle on Cloudflare D1, better-auth for accounts. The UI is Arabic-first and RTL throughout.

| Workspace | What it is |
|---|---|
| `apps/web` | The public directory + marketing site (Astro on a Worker) |
| `apps/api` | Public API — auth, the projects module, email/queue consumer |
| `apps/admin-api` · `apps/admin-web` | Admin API + dashboard for reviewing and curating projects |
| `apps/app` | User dashboard SPA (accounts, submissions) |
| `packages/*` | Shared: design system (`ui`), auth, email, typed API client, zod contracts, Drizzle schema, and the feature modules |
| `tools/discover` | The GitHub crawler that finds Algerian open-source repos |

### Run it locally

```sh
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars   # set AUTH_SECRET (≥32 chars)
pnpm --filter @mia/api db:migrate:local
pnpm --filter @mia/api seed:local                  # reference data
pnpm dev:api                                        # API on :8787
pnpm --filter @mia/web dev                          # public site on :4321
```

Architecture, conventions, and the patterns deliberately left out live in **[CLAUDE.md](CLAUDE.md)**, `.claude/rules/`, and **[docs/patterns.md](docs/patterns.md)**. Full production provisioning (Cloudflare resources, secrets, email, CI): **[SETUP.md](SETUP.md)**.

## Reuse it for your own SaaS

Made in Algeria happens to be built on a production-shaped, Arabic-first (RTL) SaaS foundation — auth, billing, admin, email, a design system, CI/CD, all wired up. If that's useful to you, you're welcome to fork it as a starter for your own product: `tools/init/rename.mjs` rewrites the name, scope, and domain in one pass (see SETUP.md). That's a side benefit, though — the project itself is the directory.

## License

[MIT](LICENSE). Built by [Selance](https://selance.com). Questions or corrections: [moncef@mochir.com](mailto:moncef@mochir.com).
