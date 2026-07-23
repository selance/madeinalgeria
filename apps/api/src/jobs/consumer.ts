import { jobSchema, type Job } from "@mia/contracts";
import { getNotificationsService, getNotifySender, getSender } from "../container";
import type { Bindings } from "../env";

/**
 * DLQ consumer (`mia-jobs-dlq*`). Records every dead job (logs it) then ACKS —
 * always. A DLQ consumer that throws is a black hole: the message would retry,
 * then be dropped with nothing written anywhere.
 */
export async function consumeDlqBatch(batch: MessageBatch<unknown>, env: Bindings): Promise<void> {
  void env;
  for (const message of batch.messages) {
    try {
      const body = message.body as { type?: string } | null;
      console.error(
        `[dlq] dead job ${body?.type ?? "unknown"} after ${message.attempts ?? 0} attempt(s):`,
        message.body,
      );
    } catch (error) {
      console.error("[dlq] could not record dead job (acking anyway):", error, message.body);
    } finally {
      message.ack();
    }
  }
}

/** One consumer for the whole `mia-jobs` queue — dispatches by job type. */
export async function handleJob(env: Bindings, job: Job): Promise<void> {
  switch (job.type) {
    case "email.send": {
      const { sender, ...input } = job.payload;
      await (sender === "notify" ? getNotifySender(env) : getSender(env)).send(input);
      return;
    }
    case "campaign.dispatch": {
      await getNotificationsService(env).dispatchBatch(job.payload.campaignId, job.payload.cursor);
      return;
    }
  }
}

export async function consumeBatch(batch: MessageBatch<unknown>, env: Bindings): Promise<void> {
  for (const message of batch.messages) {
    const parsed = jobSchema.safeParse(message.body);
    if (!parsed.success) {
      // Malformed payloads never become valid — ack so they don't crowd the DLQ.
      console.error("[jobs] unparseable job dropped:", parsed.error.issues);
      message.ack();
      continue;
    }
    try {
      await handleJob(env, parsed.data);
      message.ack();
    } catch (error) {
      console.error(`[jobs] ${parsed.data.type} failed (will retry):`, error);
      message.retry();
    }
  }
}
