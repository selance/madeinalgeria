import { and, asc, count, desc, eq, gt, inArray, like, lt, sql, type SQL } from "drizzle-orm";
import { schema, type DbCore } from "@mia/db-core";
import { batchInsert, chunkedIn } from "@mia/core";
import type { CreateTemplate, ListSubscribersQuery, NewsletterStatus } from "@mia/contracts";

/** The only file in this module touching @mia/db-core. */

export type TemplateRow = typeof schema.emailTemplates.$inferSelect;
export type CampaignRow = typeof schema.emailCampaigns.$inferSelect;
export type RecipientRow = typeof schema.emailRecipients.$inferSelect;
export type SubscriberRow = typeof schema.newsletterSubscribers.$inferSelect;

export class NotificationsRepo {
  constructor(private db: DbCore) {}

  // ── Templates ─────────────────────────────────────────────────────────
  listTemplates(): Promise<TemplateRow[]> {
    return this.db.select().from(schema.emailTemplates).all();
  }

  templateById(id: number): Promise<TemplateRow | undefined> {
    return this.db.select().from(schema.emailTemplates).where(eq(schema.emailTemplates.id, id)).get();
  }

  async createTemplate(input: CreateTemplate): Promise<number> {
    const now = new Date();
    const [row] = await this.db
      .insert(schema.emailTemplates)
      .values({ ...input, createdAt: now, updatedAt: now })
      .returning({ id: schema.emailTemplates.id });
    return row!.id;
  }

  async updateTemplate(id: number, input: Partial<CreateTemplate>): Promise<boolean> {
    const result = await this.db
      .update(schema.emailTemplates)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(schema.emailTemplates.id, id))
      .returning({ id: schema.emailTemplates.id });
    return result.length > 0;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.emailTemplates)
      .where(eq(schema.emailTemplates.id, id))
      .returning({ id: schema.emailTemplates.id });
    return result.length > 0;
  }

  // ── Campaigns ─────────────────────────────────────────────────────────
  campaignById(id: number): Promise<CampaignRow | undefined> {
    return this.db.select().from(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, id)).get();
  }

  async createCampaign(input: {
    name: string;
    templateId: number;
    status: string;
    scheduledAt?: Date;
  }): Promise<number> {
    const now = new Date();
    const [row] = await this.db
      .insert(schema.emailCampaigns)
      .values({
        name: input.name,
        templateId: input.templateId,
        status: input.status,
        scheduledAt: input.scheduledAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: schema.emailCampaigns.id });
    return row!.id;
  }

  async setCampaignStatus(id: number, status: string, sentAt?: Date): Promise<void> {
    await this.db
      .update(schema.emailCampaigns)
      .set({ status, sentAt, updatedAt: new Date() })
      .where(eq(schema.emailCampaigns.id, id));
  }

  async listCampaigns(status: string | undefined, cursor: number | undefined, limit: number) {
    const conditions: SQL[] = [];
    if (status !== undefined) conditions.push(eq(schema.emailCampaigns.status, status));
    if (cursor !== undefined) conditions.push(lt(schema.emailCampaigns.id, cursor));
    const page = await this.db
      .select()
      .from(schema.emailCampaigns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.emailCampaigns.id))
      .limit(limit + 1)
      .all();
    const hasMore = page.length > limit;
    const rows = hasMore ? page.slice(0, limit) : page;
    return { items: rows, nextCursor: hasMore && rows.length > 0 ? rows[rows.length - 1]!.id : null };
  }

  // ── Recipients ────────────────────────────────────────────────────────
  /** Seed the per-recipient status rows (batched under D1 limits — §6c). */
  async addRecipients(campaignId: number, emails: string[]): Promise<number> {
    const rows = emails.map((email) => ({ campaignId, email, type: "campaign", sent: false }));
    await batchInsert(rows, (batch) => this.db.insert(schema.emailRecipients).values(batch));
    return rows.length;
  }

  /** Next batch of unsent recipients past `cursor` (keyset by id). */
  pendingBatch(campaignId: number, cursor: number, batchSize: number): Promise<RecipientRow[]> {
    return this.db
      .select()
      .from(schema.emailRecipients)
      .where(
        and(
          eq(schema.emailRecipients.campaignId, campaignId),
          eq(schema.emailRecipients.sent, false),
          gt(schema.emailRecipients.id, cursor),
        ),
      )
      .orderBy(asc(schema.emailRecipients.id))
      .limit(batchSize)
      .all();
  }

  async markSent(recipientId: number): Promise<void> {
    await this.db
      .update(schema.emailRecipients)
      .set({ sent: true, sentAt: new Date() })
      .where(eq(schema.emailRecipients.id, recipientId));
  }

  async progress(campaignId: number): Promise<{ total: number; sent: number }> {
    const [row] = await this.db
      .select({
        total: count(),
        sent: sql<number>`SUM(CASE WHEN ${schema.emailRecipients.sent} THEN 1 ELSE 0 END)`,
      })
      .from(schema.emailRecipients)
      .where(eq(schema.emailRecipients.campaignId, campaignId))
      .all();
    return { total: row?.total ?? 0, sent: Number(row?.sent ?? 0) };
  }

  // ── Newsletter ────────────────────────────────────────────────────────
  subscriberByEmail(email: string): Promise<SubscriberRow | undefined> {
    return this.db
      .select()
      .from(schema.newsletterSubscribers)
      .where(eq(schema.newsletterSubscribers.email, email))
      .get();
  }

  subscriberByTokenHash(tokenHash: string): Promise<SubscriberRow | undefined> {
    return this.db
      .select()
      .from(schema.newsletterSubscribers)
      .where(eq(schema.newsletterSubscribers.tokenHash, tokenHash))
      .get();
  }

  async insertSubscriber(input: {
    email: string;
    tokenHash: string;
    tokenExpiresAt: Date;
    source: string;
  }): Promise<number> {
    const now = new Date();
    const [row] = await this.db
      .insert(schema.newsletterSubscribers)
      .values({ ...input, status: "pending", createdAt: now, updatedAt: now })
      .returning({ id: schema.newsletterSubscribers.id });
    return row!.id;
  }

  async updateSubscriber(
    id: number,
    patch: Partial<{
      status: NewsletterStatus;
      tokenHash: string;
      tokenExpiresAt: Date;
      confirmedAt: Date | null;
      unsubscribedAt: Date | null;
    }>,
  ): Promise<void> {
    await this.db
      .update(schema.newsletterSubscribers)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(schema.newsletterSubscribers.id, id));
  }

  // ── Suppressions (opt-outs from bulk mail) ────────────────────────────
  /** Mark an address as opted out. Idempotent — a second unsubscribe is a no-op. */
  async suppress(email: string, reason = "unsubscribe"): Promise<void> {
    await this.db
      .insert(schema.emailSuppressions)
      .values({ email, reason, createdAt: new Date() })
      .onConflictDoNothing({ target: schema.emailSuppressions.email });
  }

  /**
   * Which of these addresses must NOT be mailed: explicit suppressions plus
   * newsletter rows that opted out. Both lists go through chunkedIn — a campaign
   * batch is an app-level `WHERE email IN (…)` and D1 caps bound params at 100.
   */
  async blockedAddresses(emails: string[]): Promise<Set<string>> {
    const [suppressed, unsubscribed] = await Promise.all([
      chunkedIn(emails, (chunk) =>
        this.db
          .select({ email: schema.emailSuppressions.email })
          .from(schema.emailSuppressions)
          .where(inArray(schema.emailSuppressions.email, chunk))
          .all(),
      ),
      chunkedIn(emails, (chunk) =>
        this.db
          .select({ email: schema.newsletterSubscribers.email })
          .from(schema.newsletterSubscribers)
          .where(
            and(
              inArray(schema.newsletterSubscribers.email, chunk),
              eq(schema.newsletterSubscribers.status, "unsubscribed"),
            ),
          )
          .all(),
      ),
    ]);
    return new Set([...suppressed, ...unsubscribed].map((r) => r.email));
  }

  /** Admin list — offset page + total so the UI can render numbered pages. */
  async listSubscribers(
    query: ListSubscribersQuery,
  ): Promise<{ items: SubscriberRow[]; totalCount: number }> {
    const conditions: SQL[] = [];
    if (query.status) conditions.push(eq(schema.newsletterSubscribers.status, query.status));
    if (query.q) conditions.push(like(schema.newsletterSubscribers.email, `%${query.q.toLowerCase()}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [total]] = await Promise.all([
      this.db
        .select()
        .from(schema.newsletterSubscribers)
        .where(where)
        .orderBy(desc(schema.newsletterSubscribers.createdAt), desc(schema.newsletterSubscribers.id))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit)
        .all(),
      this.db.select({ n: count() }).from(schema.newsletterSubscribers).where(where).all(),
    ]);
    return { items, totalCount: total?.n ?? 0 };
  }
}
