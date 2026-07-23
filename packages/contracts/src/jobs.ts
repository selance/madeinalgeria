import { z } from "zod";

/**
 * Typed queue envelope (plan §3): one queue `mia-jobs`, one consumer in
 * apps/api. Every producer and the consumer speak this union — adding a job
 * type means extending it here first.
 */

export const emailSendJobSchema = z.object({
  type: z.literal("email.send"),
  payload: z.object({
    to: z.email(),
    subject: z.string(),
    html: z.string(),
    text: z.string().optional(),
    tags: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
    /** Raw SMTP headers — bulk mail carries List-Unsubscribe (RFC 8058). */
    headers: z.record(z.string(), z.string()).optional(),
    /** "notify" = the mail.madeinalgeria.dev subdomain sender (product + bulk mail). */
    sender: z.enum(["default", "notify"]).optional(),
  }),
});

/**
 * Campaign fan-out (plan §6f): one dispatch job sends the next batch of pending
 * recipients, then re-enqueues itself with the advanced cursor until done.
 * Bounds each job under Workers CPU/time limits regardless of list size.
 */
export const campaignDispatchJobSchema = z.object({
  type: z.literal("campaign.dispatch"),
  payload: z.object({
    campaignId: z.number().int(),
    cursor: z.number().int().default(0),
  }),
});

export const jobSchema = z.discriminatedUnion("type", [
  emailSendJobSchema,
  campaignDispatchJobSchema,
]);
export type Job = z.infer<typeof jobSchema>;

/**
 * Producer interface modules depend on — apps back it with the Queue binding
 * (or an inline dispatcher in tests). Arguments are structured-clonable by
 * construction (plan §1 rule 3).
 */
export interface JobQueue {
  enqueue(job: Job): Promise<void>;
}
