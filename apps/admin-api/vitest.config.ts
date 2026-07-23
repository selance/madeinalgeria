import { createRequire } from "node:module";
import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// Paths are relative to this app (vitest's cwd).

/**
 * React's public entrypoints (`react`, `react/jsx-runtime`, `react-dom/server`)
 * are CJS shims that `require()` a dev or prod build off process.env.NODE_ENV.
 * workerd's module registry can't resolve those relative requires at runtime, so
 * every test that touches @mia/email (whose templates are React) would fail to
 * import. Point the specifiers straight at the production builds instead: those
 * files require nothing relative — only the bare "react"/"react-dom", which
 * these same aliases resolve.
 *
 * Test-only. The deploy build is unaffected: wrangler's esbuild bundles React
 * ahead of time and folds NODE_ENV away (verified with `wrangler deploy --dry-run`).
 */
const require_ = createRequire(import.meta.url);
const reactDir = path.dirname(require_.resolve("react/package.json"));
const reactDomDir = path.dirname(require_.resolve("react-dom/package.json"));

const reactProductionAliases = {
  "react/jsx-runtime": path.join(reactDir, "cjs/react-jsx-runtime.production.js"),
  "react/jsx-dev-runtime": path.join(reactDir, "cjs/react-jsx-runtime.production.js"),
  react: path.join(reactDir, "cjs/react.production.js"),
  "react-dom/server": path.join(reactDomDir, "cjs/react-dom-server-legacy.browser.production.js"),
  "react-dom": path.join(reactDomDir, "cjs/react-dom.production.js"),
};

export default defineConfig(async () => {
  const coreMigrations = await readD1Migrations("../../packages/db-core/migrations");

  return {
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    resolve: { alias: reactProductionAliases },
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            // Injected only for tests; setup file applies them per test run.
            TEST_CORE_MIGRATIONS: coreMigrations,
            AUTH_SECRET: "test-only-secret-at-least-32-characters-long",
            NODE_ENV: "production",
          },
        },
      }),
    ],
    test: {
      setupFiles: ["./test/apply-migrations.ts"],
    },
  };
});
