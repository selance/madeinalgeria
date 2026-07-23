// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// Static-first marketing site: pages prerender to assets at build; a few
// interactive pages (newsletter confirm/unsubscribe) opt OUT with
// `export const prerender = false` and render on demand in the Worker.
export default defineConfig({
  output: "static",
  // English default at the root, Arabic under /ar. Pages pass the locale
  // explicitly (thin /ar wrappers around shared page components) — no
  // fallback-rewrite magic, so static and on-demand routes behave identically.
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ar"],
    routing: { prefixDefaultLocale: false },
  },
  // One canonical URL form (no trailing slash). `format: "file"` emits `/x.html`
  // (served at `/x`) so static pages aren't 307'd to `/x/` by the CF asset layer.
  trailingSlash: "never",
  build: { format: "file" },
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
