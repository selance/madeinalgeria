import { AppError } from "@mia/core";
import type {
  CampaignProgress,
  CreateCampaign,
  CreateTemplate,
  JobQueue,
  ListSubscribersQuery,
  NewsletterStatus,
  NewsletterSubscriberSummary,
} from "@mia/contracts";
import {
  campaignEmail,
  listUnsubscribeHeaders,
  newsletterConfirmEmail,
  newsletterWelcomeEmail,
  type EmailSender,
} from "@mia/email";
import type { NotificationsRepo, SubscriberRow } from "./repo";
import { hashToken, mintToken, signEmail, verifyEmailSignature } from "./token";

/** How many recipients one dispatch job sends before re-enqueuing itself. */
const DISPATCH_BATCH = 20;

/** How long an emailed confirm link stays valid. */
const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * Minimum gap between two confirmation mails to the same address. The subscribe
 * endpoint is anonymous, so without this anyone could re-post the same address
 * in a loop and mail-bomb its owner.
 */
const RESEND_COOLDOWN_MS = 5 * 60 * 1000;

export interface NotificationsConfig {
  /** Public site origin — every emailed link points back at it. */
  webBaseUrl: string;
  /** Signs unsubscribe links for addresses we hold no token for (AUTH_SECRET). */
  unsubscribeSecret: string;
}

export class NotificationsService {
  constructor(
    private repo: NotificationsRepo,
    private queue: JobQueue,
    private sender: EmailSender,
    private config: NotificationsConfig,
  ) {}

  private get webBase(): string {
    return this.config.webBaseUrl.replace(/\/$/, "");
  }

  /**
   * The unsubscribe link for an address. Signed rather than stored: campaign
   * recipients are pasted in by an admin and may have no row anywhere, so there
   * is no token to look up — but every one of them still gets a working opt-out.
   */
  private async unsubscribeUrl(email: string): Promise<string> {
    const signature = await signEmail(email, this.config.unsubscribeSecret);
    return `${this.webBase}/newsletter/unsubscribe?e=${encodeURIComponent(email)}&s=${signature}`;
  }

  // ── Templates ─────────────────────────────────────────────────────────
  listTemplates() {
    return this.repo.listTemplates();
  }
  async createTemplate(input: CreateTemplate) {
    return { id: await this.repo.createTemplate(input) };
  }
  async updateTemplate(id: number, input: Partial<CreateTemplate>) {
    if (!(await this.repo.updateTemplate(id, input))) throw AppError.notFound("Template not found");
  }
  async deleteTemplate(id: number) {
    if (!(await this.repo.deleteTemplate(id))) throw AppError.notFound("Template not found");
  }

  // ── Campaigns ─────────────────────────────────────────────────────────
  listCampaigns(status: string | undefined, cursor: number | undefined, limit: number) {
    return this.repo.listCampaigns(status, cursor, limit);
  }

  /**
   * Create a campaign, seed its recipient rows, and either mark it scheduled
   * (a cron/scheduled trigger sends later) or leave it draft for manual send.
   */
  async createCampaign(input: CreateCampaign): Promise<{ campaignId: number; recipients: number }> {
    const template = await this.repo.templateById(input.templateId);
    if (!template) throw AppError.notFound("Template not found");

    const status = input.scheduledAt ? "scheduled" : "draft";
    const campaignId = await this.repo.createCampaign({
      name: input.name,
      templateId: input.templateId,
      status,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    });
    // De-dupe recipient addresses.
    const recipients = await this.repo.addRecipients(campaignId, [...new Set(input.recipients)]);
    return { campaignId, recipients };
  }

  /** Kick off (or resume) sending — enqueues the first dispatch job. */
  async send(campaignId: number): Promise<void> {
    const campaign = await this.repo.campaignById(campaignId);
    if (!campaign) throw AppError.notFound("Campaign not found");
    if (campaign.status === "sending") throw AppError.conflict("Campaign is already sending");
    if (campaign.status === "sent") throw AppError.conflict("Campaign already sent");

    await this.repo.setCampaignStatus(campaignId, "sending");
    await this.queue.enqueue({ type: "campaign.dispatch", payload: { campaignId, cursor: 0 } });
  }

  async progress(campaignId: number): Promise<CampaignProgress> {
    const campaign = await this.repo.campaignById(campaignId);
    if (!campaign) throw AppError.notFound("Campaign not found");
    const { total, sent } = await this.repo.progress(campaignId);
    return {
      campaignId,
      status: campaign.status as CampaignProgress["status"],
      total,
      sent,
      pending: total - sent,
    };
  }

  /**
   * Queue-job entrypoint: send the next batch, mark each recipient, then
   * re-enqueue with the advanced cursor until none remain. Idempotent per
   * recipient (only unsent rows are selected), so a job retry never
   * double-sends already-marked recipients.
   */
  async dispatchBatch(campaignId: number, cursor: number): Promise<void> {
    const campaign = await this.repo.campaignById(campaignId);
    if (!campaign || campaign.status === "sent") return;
    const template = campaign.templateId ? await this.repo.templateById(campaign.templateId) : undefined;
    if (!template) {
      await this.repo.setCampaignStatus(campaignId, "failed");
      return;
    }

    const batch = await this.repo.pendingBatch(campaignId, cursor, DISPATCH_BATCH);
    if (batch.length === 0) {
      await this.repo.setCampaignStatus(campaignId, "sent", new Date());
      return;
    }

    // Never mail someone who opted out — whether they unsubscribed from the
    // newsletter or from a previous blast. They're marked sent so the campaign
    // can finish, but nothing leaves.
    const blocked = await this.repo.blockedAddresses(batch.map((r) => r.email));

    let lastId = cursor;
    for (const recipient of batch) {
      if (blocked.has(recipient.email)) {
        await this.repo.markSent(recipient.id);
        lastId = recipient.id;
        continue;
      }
      try {
        const unsubscribeUrl = await this.unsubscribeUrl(recipient.email);
        const { html, text } = campaignEmail({
          contentHtml: render(template.content, recipient.email),
          unsubscribeUrl,
        });
        await this.sender.send({
          to: recipient.email,
          subject: template.subject,
          html,
          text,
          // Bulk mail: one-click unsubscribe header (Gmail/Yahoo require it) and
          // a tag so Resend can report on blasts separately from product mail.
          headers: listUnsubscribeHeaders(unsubscribeUrl),
          tags: [{ name: "category", value: "campaign" }],
        });
        await this.repo.markSent(recipient.id);
      } catch (error) {
        // Send failed — the row stays unsent and shows up in progress()'s
        // pending count so an admin can re-target failures. We still advance
        // the cursor past it to guarantee forward progress (no infinite loop).
        console.error(`Campaign ${campaignId}: send to ${recipient.email} failed:`, error);
      }
      lastId = recipient.id;
    }

    // Keyset continuation past everything processed this batch. If the job
    // crashes before this enqueue, the queue retries the same cursor; already
    // marked-sent rows are excluded, so it resumes without double-sending them.
    await this.queue.enqueue({ type: "campaign.dispatch", payload: { campaignId, cursor: lastId } });
  }

  // ── Newsletter (double opt-in) ────────────────────────────────────────
  /**
   * Take an address from the public footer. Nothing is ever sent to it beyond
   * the confirmation mail until that mail's link is clicked — the form is
   * anonymous, so the address may not belong to whoever typed it.
   */
  async subscribeNewsletter(
    rawEmail: string,
    opts: { source?: string } = {},
  ): Promise<{ status: NewsletterStatus }> {
    const email = normalizeEmail(rawEmail);
    const existing = await this.repo.subscriberByEmail(email);

    // Already opted in — say so plainly rather than promise a mail we won't send.
    if (existing?.status === "subscribed") return { status: "subscribed" };

    const now = Date.now();
    if (existing?.status === "pending" && now - existing.updatedAt.getTime() < RESEND_COOLDOWN_MS) {
      return { status: "pending" };
    }

    // New address, a stale pending one, or a previously unsubscribed one coming
    // back: fresh token, back to pending, send the confirmation.
    const token = mintToken();
    const tokenHash = await hashToken(token);
    const tokenExpiresAt = new Date(now + CONFIRM_TTL_MS);

    if (existing) {
      await this.repo.updateSubscriber(existing.id, {
        status: "pending",
        tokenHash,
        tokenExpiresAt,
        confirmedAt: null,
        unsubscribedAt: null,
      });
    } else {
      await this.repo.insertSubscriber({
        email,
        tokenHash,
        tokenExpiresAt,
        source: opts.source ?? "web_footer",
      });
    }

    await this.queue.enqueue({
      type: "email.send",
      payload: {
        to: email,
        ...newsletterConfirmEmail({ confirmUrl: `${this.webBase}/newsletter/confirm?token=${token}` }),
        tags: [{ name: "category", value: "newsletter_confirm" }],
        sender: "notify",
      },
    });

    return { status: "pending" };
  }

  /** The confirm link was clicked. Idempotent: a second click is still a success. */
  async confirmNewsletter(token: string): Promise<{ status: NewsletterStatus }> {
    const subscriber = await this.findByToken(token);
    if (subscriber.status === "subscribed") return { status: "subscribed" };
    if (subscriber.tokenExpiresAt.getTime() < Date.now()) {
      throw AppError.badRequest("Confirmation link has expired");
    }

    await this.repo.updateSubscriber(subscriber.id, {
      status: "subscribed",
      confirmedAt: new Date(),
      unsubscribedAt: null,
    });

    // The welcome mail is the first bulk mail this address gets, so it carries
    // both the visible unsubscribe link and the List-Unsubscribe header.
    const unsubscribeUrl = await this.unsubscribeUrl(subscriber.email);
    await this.queue.enqueue({
      type: "email.send",
      payload: {
        to: subscriber.email,
        ...newsletterWelcomeEmail({ unsubscribeUrl }),
        headers: listUnsubscribeHeaders(unsubscribeUrl),
        tags: [{ name: "category", value: "newsletter_welcome" }],
        sender: "notify",
      },
    });
    return { status: "subscribed" };
  }

  /**
   * Opting out by opt-in token. No expiry check — unsubscribe links live on in
   * already-delivered mail and must never stop working.
   */
  async unsubscribeNewsletter(token: string): Promise<{ status: NewsletterStatus }> {
    const subscriber = await this.findByToken(token);
    if (subscriber.status !== "unsubscribed") {
      await this.repo.updateSubscriber(subscriber.id, {
        status: "unsubscribed",
        unsubscribedAt: new Date(),
      });
    }
    await this.repo.suppress(subscriber.email);
    return { status: "unsubscribed" };
  }

  /**
   * Opting out by signed address — the path every piece of bulk mail links to,
   * including campaigns sent to addresses that have no row anywhere. The HMAC is
   * what stops one person unsubscribing another by editing the query string.
   */
  async unsubscribeAddress(rawEmail: string, signature: string): Promise<{ status: NewsletterStatus }> {
    const email = normalizeEmail(rawEmail);
    if (!(await verifyEmailSignature(email, signature, this.config.unsubscribeSecret))) {
      throw AppError.badRequest("Invalid unsubscribe link");
    }

    await this.repo.suppress(email);
    const subscriber = await this.repo.subscriberByEmail(email);
    if (subscriber && subscriber.status !== "unsubscribed") {
      await this.repo.updateSubscriber(subscriber.id, {
        status: "unsubscribed",
        unsubscribedAt: new Date(),
      });
    }
    return { status: "unsubscribed" };
  }

  async listSubscribers(query: ListSubscribersQuery) {
    const { items, totalCount } = await this.repo.listSubscribers(query);
    return {
      items: items.map(toSummary),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / query.limit)),
      },
    };
  }

  private async findByToken(token: string): Promise<SubscriberRow> {
    const subscriber = await this.repo.subscriberByTokenHash(await hashToken(token));
    if (!subscriber) throw AppError.badRequest("Invalid or expired link");
    return subscriber;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toSummary(row: SubscriberRow): NewsletterSubscriberSummary {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    unsubscribedAt: row.unsubscribedAt?.toISOString() ?? null,
  };
}

function render(html: string, email: string): string {
  const name = email.split("@")[0] ?? "";
  return html.replaceAll("{{email}}", escapeHtml(email)).replaceAll("{{name}}", escapeHtml(name));
}

function escapeHtml(v: string): string {
  return v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
