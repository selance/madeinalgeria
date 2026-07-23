# New product setup

Follow this once per new product, in order. Steps 1–2 are local; the rest provision Cloudflare/GitHub.

## 1. Rename the placeholders

```sh
node tools/init/rename.mjs --scope myapp --prefix myapp --name "MyApp" --name-ar "تطبيقي" --domain myapp.com
```

This rewrites `@mia/*` (npm scope), `mia-*` (Cloudflare resource names), `Made in Algeria`/`صُنع في الجزائر` (product display name), and `madeinalgeria.dev` (domains) across the tree. Review the diff, then commit.

Manual equivalent if you prefer: find-replace those four tokens yourself with the same ordering (scope first, then domain, then prefix, then names).

## 2. Install & verify locally

```sh
pnpm install
pnpm typecheck && pnpm lint && pnpm test
pnpm dev:api          # miniflare :8787 — GET /health should answer
pnpm --filter @<scope>/app dev   # :5173 — RTL login page should render
```

Create `apps/api/.dev.vars` from `.dev.vars.example` (only `AUTH_SECRET` is required locally; emails print to the console without `RESEND_API_KEY`). Then `pnpm --filter @<scope>/api db:migrate:local` and `seed:local`.

## 3. Cloudflare resources (staging + production)

All names below assume prefix `myapp`. Paste the returned ids into the matching `env.staging` / `env.production` blocks of `apps/api/wrangler.jsonc` and `apps/admin-api/wrangler.jsonc` (placeholders `<D1_CORE_ID_STAGING>` etc.).

```sh
wrangler d1 create myapp-core-staging
wrangler d1 create myapp-core            # production
wrangler kv namespace create KV --preview false          # once per env
wrangler queues create myapp-jobs-staging
wrangler queues create myapp-jobs-staging-dlq
wrangler queues create myapp-jobs
wrangler queues create myapp-jobs-dlq
```

## 4. Secrets

Per environment, per API worker. **On Windows use bash, never PowerShell** (PowerShell piping adds a UTF-8 BOM that corrupts the secret):

```sh
printf '%s' "$AUTH_SECRET" | wrangler secret put AUTH_SECRET --env staging
printf '%s' "$RESEND_API_KEY" | wrangler secret put RESEND_API_KEY --env staging   # optional
printf '%s' "$GOOGLE_CLIENT_SECRET" | wrangler secret put GOOGLE_CLIENT_SECRET --env staging  # optional
# repeat with --env production
```

`AUTH_SECRET` must be ≥32 chars (`openssl rand -base64 48`).

## 5. Email (Resend)

- Verify **two** sender identities: an auth subdomain (e.g. `auth.myapp.com` → `hello@auth.myapp.com`) for transactional auth mail, and a bulk subdomain (e.g. `mail.myapp.com` → `notify@mail.myapp.com`) for newsletters/campaigns. Keeping them separate protects auth-mail deliverability from bulk-mail reputation. Never use a no-reply address.
- Set `AUTH_EMAIL_FROM` / `NOTIFY_EMAIL_FROM` vars accordingly (non-secret, `wrangler.jsonc` `vars`).

## 6. Google OAuth (optional)

Create an OAuth client; set `GOOGLE_CLIENT_ID` in `vars` and `GOOGLE_CLIENT_SECRET` as a secret. Authorized redirect: `https://api.<domain>/v1/auth/callback/google` (and the staging workers.dev equivalent).

## 7. GitHub CI/CD

- Repo **secrets**: `CLOUDFLARE_API_TOKEN` (Workers+D1+KV+Queues edit perms), `CLOUDFLARE_ACCOUNT_ID`.
- Repo **variables**: `STAGING_API_URL`, `STAGING_ADMIN_API_URL` (for the post-deploy smoke test).
- In `.github/workflows/deploy-staging.yml`, replace `<CF_SUBDOMAIN>` in the `VITE_*` URLs with your workers.dev subdomain.
- Push to `main` → staging deploy. Production = manual dispatch of "Deploy production".

## 8. Custom domains (production)

Add routes/custom domains in each app's `wrangler.jsonc` production env: `api.<domain>`, `admin-api.<domain>`, `app.<domain>`, `admin.<domain>`, apex/`www` for web. Set `TRUSTED_ORIGINS`, `AUTH_BASE_URL`, `COOKIE_DOMAIN=<domain>` vars (cross-subdomain cookies need it).

## 9. Migrate & seed remote

```sh
pnpm --filter @<scope>/api db:migrate:staging
pnpm --filter @<scope>/api seed:staging
# production migrations run automatically in the deploy-prod workflow
```

## 10. First admin user

Sign up normally, then promote via D1 (better-auth `admin` plugin reads the `role` column):

```sh
wrangler d1 execute myapp-core-staging --remote --command "UPDATE user SET role='admin' WHERE email='you@example.com'"
```
