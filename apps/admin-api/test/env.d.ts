import type { D1Migration } from "cloudflare:test";
import type { Bindings } from "../src/env";

declare module "cloudflare:test" {
  interface ProvidedEnv extends Bindings {
    TEST_CORE_MIGRATIONS: D1Migration[];
  }
}

declare global {
  namespace Cloudflare {
    interface Env extends Bindings {
      TEST_CORE_MIGRATIONS: D1Migration[];
    }
  }
}

export {};
