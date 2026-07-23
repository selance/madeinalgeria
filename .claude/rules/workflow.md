# Delivery workflow

When all requested features in a session are implemented, run the full pipeline — in this order, fixing failures before moving on:

1. **Typecheck** — `pnpm typecheck`
2. **Lint** — `pnpm lint`
3. **Test** — `pnpm test`. New code ships with tests (vitest; workerd integration tests in `apps/api/test` for API behavior; logic that SPAs need tested belongs in packages). Exercise the finished features with these tests, not just existing suites.
4. **Commit** — existing conventional style (`feat(admin-web): …`, `fix(api): …`). Keep messages focused on the change itself.
5. **Deploy staging and production together** — `pnpm deploy:all` from the root (or the touched apps' `deploy:staging` + `deploy:production`). Don't stop at staging.
6. **Push to `main`** — `git push origin main`.

Notes:
- Secrets on Windows: set via bash `printf '%s' "$VALUE" | wrangler secret put NAME --env <env>` — never pipe through PowerShell (adds a UTF-8 BOM).
- Deploy failures in one app don't excuse skipping the others — report exactly what deployed and what didn't.

# Orchestration

The top-level model is the orchestrator. For subtasks that don't need top-tier reasoning — applying an established pattern across N pages, mechanical refactors, writing tests for defined behavior, building a component from a spelled-out reference — delegate to subagents, giving each:

- the exact files to touch,
- the reference implementation/pattern to copy (file paths),
- acceptance criteria (typecheck/lint/tests must pass).

Run independent subtasks on multiple agents in parallel. Keep in the main session: architecture decisions, cross-cutting changes, tricky debugging, and reviewing/integrating the agents' output before the delivery workflow above.
