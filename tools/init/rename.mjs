#!/usr/bin/env node
// Initialize a new product from this template: find-and-replace the
// placeholder tokens across the whole tree. Run ONCE, right after cloning,
// before `pnpm install`.
//
// Usage:
//   node tools/init/rename.mjs \
//     --scope myapp \                 # npm scope → @myapp/* (lowercase, no @)
//     --prefix myapp \                # Cloudflare resource prefix → myapp-api, myapp-core, ...
//     --name "MyApp" \                # product display name (Latin)
//     --name-ar "تطبيقي" \            # product display name (Arabic)
//     --domain myapp.com              # production apex domain
//
// Tokens replaced (in this order — longest first so substrings don't clobber):
//   @mia/            → @<scope>/
//   madeinalgeria.dev  → <domain>
//   mia-             → <prefix>-
//   صُنع في الجزائر              → <name-ar>
//   Made in Algeria              → <name>
//   mia_             → <prefix>_   (Analytics Engine dataset names)

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".wrangler", ".astro", "coverage"]);
const TEXT_EXTS = new Set([
  ".ts", ".tsx", ".js", ".mjs", ".cjs", ".jsx", ".json", ".jsonc", ".astro",
  ".css", ".md", ".yml", ".yaml", ".html", ".txt", ".sql", ".example",
]);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith("--")) throw new Error(`Unexpected argument: ${argv[i]}`);
    args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const required = ["scope", "prefix", "name", "domain"];
const missing = required.filter((k) => !args[k]);
if (missing.length) {
  console.error(`Missing required args: ${missing.map((m) => `--${m}`).join(", ")}`);
  console.error(`Optional: --name-ar (defaults to --name)`);
  process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(args.scope) || !/^[a-z][a-z0-9-]*$/.test(args.prefix)) {
  console.error("--scope and --prefix must be lowercase alphanumeric/dash, starting with a letter.");
  process.exit(1);
}

const replacements = [
  ["@mia/", `@${args.scope}/`],
  ["madeinalgeria.dev", args.domain],
  ["mia-", `${args.prefix}-`],
  ["mia_", `${args.prefix}_`],
  ["صُنع في الجزائر", args["name-ar"] ?? args.name],
  ["Made in Algeria", args.name],
  ["mia-saas-starter", `${args.prefix}-monorepo`], // root package name (already prefix-replaced above if hit)
];

const root = join(import.meta.dirname, "..", "..");
let changed = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(full);
      continue;
    }
    if (!TEXT_EXTS.has(extname(entry)) && !entry.startsWith(".dev.vars") && entry !== ".gitignore") continue;
    const before = readFileSync(full, "utf8");
    let after = before;
    for (const [from, to] of replacements) after = after.split(from).join(to);
    if (after !== before) {
      writeFileSync(full, after);
      changed++;
    }
  }
}

walk(root);
console.log(`Done. ${changed} files updated.`);
console.log("Next: pnpm install, then follow SETUP.md to provision Cloudflare resources.");
