import { createApp } from "./app";
import type { Bindings } from "./env";

const app = createApp();

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Bindings>;
