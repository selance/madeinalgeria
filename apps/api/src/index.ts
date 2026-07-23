import { createApp } from "./app";
import { consumeBatch, consumeDlqBatch } from "./jobs/consumer";
import type { Bindings } from "./env";

const app = createApp();

export default {
  fetch: app.fetch,
  // Two consumers, one handler: the jobs queue and its dead-letter queue
  // (`mia-jobs-dlq*`), which logs dead jobs instead of letting them vanish.
  // Distinguished by the batch's queue name.
  queue: (batch, env) =>
    batch.queue.includes("-dlq") ? consumeDlqBatch(batch, env) : consumeBatch(batch, env),
  // No crons wired in the template. Add scheduled work here and declare the
  // cron expressions under `triggers.crons` in wrangler.jsonc (see docs/patterns.md).
  scheduled: (_controller, _env, _ctx) => {
    // no-op stub
  },
} satisfies ExportedHandler<Bindings>;
