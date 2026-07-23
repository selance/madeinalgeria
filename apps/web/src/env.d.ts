/// <reference types="astro/client" />

interface MiaWebEnv {
  ENVIRONMENT: string;
  PUBLIC_API_BASE: string;
  APP_BASE_URL: string;
  SITE_URL: string;
  ASSETS: Fetcher;
}

type Runtime = import("@astrojs/cloudflare").Runtime<MiaWebEnv>;

declare namespace App {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Astro's documented pattern
  interface Locals extends Runtime {}
}

interface ImportMetaEnv {
  /** Build-time bases baked into prerendered pages and islands. */
  readonly PUBLIC_API_BASE_URL: string;
  readonly PUBLIC_APP_BASE_URL: string;
  readonly PUBLIC_GTM_ID?: string;
  readonly PUBLIC_POSTHOG_KEY?: string;
  readonly PUBLIC_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
