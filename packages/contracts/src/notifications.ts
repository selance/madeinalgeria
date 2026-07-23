import { z } from "zod";

/**
 * Email templates + campaigns (plan §1 admin table: notifications module).
 * Campaign sends fan out through the queue with per-recipient status rows
 * (`email_recipients`), so a large send never blocks a request or a single job.
 */

// ── Templates ─────────────────────────────────────────────────────────────
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(300),
  /** HTML body. `{{name}}` and `{{email}}` are substituted per recipient. */
  content: z.string().min(1).max(100_000),
});
export type CreateTemplate = z.infer<typeof createTemplateSchema>;
export const updateTemplateSchema = createTemplateSchema.partial();

// ── Campaigns ─────────────────────────────────────────────────────────────
export const campaignStatusValues = ["draft", "scheduled", "sending", "sent", "failed"] as const;
export type CampaignStatus = (typeof campaignStatusValues)[number];

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  templateId: z.number().int().positive(),
  /** Explicit recipient list. Audience-query targeting can come later. */
  recipients: z.array(z.email()).min(1).max(100_000),
  /** ISO date; omit to keep as draft and send manually. */
  scheduledAt: z.string().datetime().optional(),
});
export type CreateCampaign = z.infer<typeof createCampaignSchema>;

export const listCampaignsQuerySchema = z.object({
  status: z.enum(campaignStatusValues).optional(),
  cursor: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export interface CampaignProgress {
  campaignId: number;
  status: CampaignStatus;
  total: number;
  sent: number;
  pending: number;
}

// ── Newsletter (double opt-in) ────────────────────────────────────────────
export const newsletterStatusValues = ["pending", "subscribed", "unsubscribed"] as const;
export type NewsletterStatus = (typeof newsletterStatusValues)[number];

/** Public footer form. 254 = the RFC-5321 ceiling for an address. */
export const subscribeNewsletterSchema = z.object({ email: z.email().max(254) });
export type SubscribeNewsletter = z.infer<typeof subscribeNewsletterSchema>;

/** Confirm + unsubscribe both carry the same opt-in token (hex, never rotated). */
export const newsletterTokenSchema = z.object({ token: z.string().min(16).max(128) });

export const listSubscribersQuerySchema = z.object({
  status: z.enum(newsletterStatusValues).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListSubscribersQuery = z.infer<typeof listSubscribersQuerySchema>;

export interface NewsletterSubscriberSummary {
  id: number;
  email: string;
  status: NewsletterStatus;
  source: string;
  createdAt: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
}
