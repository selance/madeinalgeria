import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const emailTemplates = sqliteTable("email_templates", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const emailCampaigns = sqliteTable("email_campaigns", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  templateId: integer("template_id").references(() => emailTemplates.id),
  status: text("status", { length: 50 }).notNull(),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const emailRecipients = sqliteTable(
  "email_recipients",
  {
    id: integer("id").primaryKey(),
    campaignId: integer("campaign_id").references(() => emailCampaigns.id),
    email: text("email").notNull(),
    type: text("type", { length: 50 }).notNull(),
    sent: integer("sent", { mode: "boolean" }).notNull().default(false),
    sentAt: integer("sent_at", { mode: "timestamp" }),
  },
  (t) => [index("email_recipients_campaign_id_idx").on(t.campaignId)],
);

// v1's email_configs table (per-row SMTP credentials) is intentionally NOT
// ported: v2 sends only through Resend (secret RESEND_API_KEY), so storing
// SMTP passwords in the DB would be dead weight and a liability.

/**
 * Anyone who opted out of bulk mail. Campaign recipients are pasted in by an
 * admin, so they may have no newsletter_subscribers row to flip — this table is
 * the list every blast is filtered against, whatever the address's origin.
 */
export const emailSuppressions = sqliteTable(
  "email_suppressions",
  {
    id: integer("id").primaryKey(),
    email: text("email").notNull(),
    /** "unsubscribe" today; "bounce" / "complaint" once we ingest Resend webhooks. */
    reason: text("reason", { length: 40 }).notNull().default("unsubscribe"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [uniqueIndex("email_suppressions_email_idx").on(t.email)],
);

export type NewsletterStatus = "pending" | "subscribed" | "unsubscribed";

/**
 * Newsletter opt-ins from the public footer. Double opt-in: a row starts
 * `pending` and only becomes `subscribed` once the emailed link is confirmed —
 * the form is anonymous, so anyone can type anyone's address into it.
 *
 * Separate from `email_recipients`, which is the per-campaign send ledger.
 */
export const newsletterSubscribers = sqliteTable(
  "newsletter_subscribers",
  {
    id: integer("id").primaryKey(),
    /** Normalized (trimmed + lowercased) by the service before it gets here. */
    email: text("email").notNull(),
    status: text("status").$type<NewsletterStatus>().notNull().default("pending"),
    /** SHA-256 of the opt-in token; the raw token only ever lives in the email link. */
    tokenHash: text("token_hash").notNull(),
    /** Confirm deadline. Unsubscribe accepts the same token with no expiry. */
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }).notNull(),
    source: text("source", { length: 50 }).notNull().default("web_footer"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
    unsubscribedAt: integer("unsubscribed_at", { mode: "timestamp" }),
  },
  (t) => [
    uniqueIndex("newsletter_subscribers_email_idx").on(t.email),
    uniqueIndex("newsletter_subscribers_token_idx").on(t.tokenHash),
    index("newsletter_subscribers_status_idx").on(t.status, t.createdAt),
  ],
);
