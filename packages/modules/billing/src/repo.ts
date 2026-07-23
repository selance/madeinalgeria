import { and, desc, eq, gt, lt, sql, type SQL } from "drizzle-orm";
import { schema, type DbCore } from "@mia/db-core";
import type { AssignSubscription, CreatePlan } from "@mia/contracts";

/** The only file in this module touching @mia/db-core. */

export type PlanRow = typeof schema.plans.$inferSelect;
export type SubscriptionRow = typeof schema.subscriptions.$inferSelect;
export type InvoiceRow = typeof schema.invoices.$inferSelect;

export class BillingRepo {
  constructor(private db: DbCore) {}

  // ── Plans ─────────────────────────────────────────────────────────────
  listPlans(): Promise<PlanRow[]> {
    return this.db.select().from(schema.plans).all();
  }

  async createPlan(input: CreatePlan): Promise<number> {
    const now = new Date();
    const [row] = await this.db
      .insert(schema.plans)
      .values({ ...input, createdAt: now, updatedAt: now })
      .returning({ id: schema.plans.id });
    return row!.id;
  }

  async updatePlan(id: number, input: Partial<CreatePlan>): Promise<boolean> {
    const result = await this.db
      .update(schema.plans)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(schema.plans.id, id))
      .returning({ id: schema.plans.id });
    return result.length > 0;
  }

  planById(id: number): Promise<PlanRow | undefined> {
    return this.db.select().from(schema.plans).where(eq(schema.plans.id, id)).get();
  }

  /** Plans are referenced by well-known name across envs (ids differ). */
  planByName(name: string): Promise<PlanRow | undefined> {
    return this.db.select().from(schema.plans).where(eq(schema.plans.name, name)).get();
  }

  /** Subscriptions ever granted on a plan — the first-100 seats counter. */
  async countByPlan(planId: number): Promise<number> {
    const row = await this.db
      .select({ value: sql<number>`COUNT(*)` })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.planId, planId))
      .get();
    return row?.value ?? 0;
  }

  // ── Subscriptions ─────────────────────────────────────────────────────
  /** The row feature-gating reads: active AND inside the current period. */
  activeForUser(userId: string): Promise<{ subscription: SubscriptionRow; plan: PlanRow } | undefined> {
    return this.db
      .select({ subscription: schema.subscriptions, plan: schema.plans })
      .from(schema.subscriptions)
      .innerJoin(schema.plans, eq(schema.subscriptions.planId, schema.plans.id))
      .where(
        and(
          eq(schema.subscriptions.userId, userId),
          eq(schema.subscriptions.status, "active"),
          gt(schema.subscriptions.currentPeriodEnd, new Date()),
        ),
      )
      .orderBy(desc(schema.subscriptions.currentPeriodEnd))
      .get();
  }

  async assign(input: AssignSubscription & { periodEnd: Date }): Promise<number> {
    const now = new Date();
    const [row] = await this.db
      .insert(schema.subscriptions)
      .values({
        userId: input.userId,
        planId: input.planId,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: input.periodEnd,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: schema.subscriptions.id });
    return row!.id;
  }

  async cancel(id: number): Promise<boolean> {
    const result = await this.db
      .update(schema.subscriptions)
      .set({ status: "canceled", canceledAt: new Date(), updatedAt: new Date() })
      .where(and(eq(schema.subscriptions.id, id), eq(schema.subscriptions.status, "active")))
      .returning({ id: schema.subscriptions.id });
    return result.length > 0;
  }

  async listSubscriptions(userId?: string, cursor?: number, limit = 20) {
    const conditions: SQL[] = [];
    if (userId !== undefined) conditions.push(eq(schema.subscriptions.userId, userId));
    if (cursor !== undefined) conditions.push(lt(schema.subscriptions.id, cursor));
    const page = await this.db
      .select()
      .from(schema.subscriptions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.subscriptions.id))
      .limit(limit + 1)
      .all();
    const hasMore = page.length > limit;
    const rows = hasMore ? page.slice(0, limit) : page;
    return { items: rows, nextCursor: hasMore && rows.length > 0 ? rows[rows.length - 1]!.id : null };
  }

  // ── Invoices ──────────────────────────────────────────────────────────
  async createInvoice(input: {
    userId: string;
    subscriptionId: number;
    amount: number;
  }): Promise<number> {
    const now = new Date();
    const [row] = await this.db
      .insert(schema.invoices)
      .values({
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        amount: input.amount,
        status: "pending",
        billingDate: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: schema.invoices.id });
    return row!.id;
  }

  /**
   * Idempotent status TRANSITION (§6d): only a pending invoice becomes paid.
   * A second identical webhook/admin action matches zero rows and is a no-op.
   */
  async markPaid(id: number): Promise<"paid" | "already-processed" | "not-found"> {
    const result = await this.db
      .update(schema.invoices)
      .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
      .where(and(eq(schema.invoices.id, id), eq(schema.invoices.status, "pending")))
      .returning({ id: schema.invoices.id });
    if (result.length > 0) return "paid";
    const exists = await this.db
      .select({ id: schema.invoices.id })
      .from(schema.invoices)
      .where(eq(schema.invoices.id, id))
      .get();
    return exists ? "already-processed" : "not-found";
  }

  async listInvoices(filter: { userId?: string; status?: string; cursor?: number; limit: number }) {
    const conditions: SQL[] = [];
    if (filter.userId !== undefined) conditions.push(eq(schema.invoices.userId, filter.userId));
    if (filter.status !== undefined) conditions.push(eq(schema.invoices.status, filter.status));
    if (filter.cursor !== undefined) conditions.push(lt(schema.invoices.id, filter.cursor));
    const page = await this.db
      .select()
      .from(schema.invoices)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.invoices.id))
      .limit(filter.limit + 1)
      .all();
    const hasMore = page.length > filter.limit;
    const rows = hasMore ? page.slice(0, filter.limit) : page;
    return { items: rows, nextCursor: hasMore && rows.length > 0 ? rows[rows.length - 1]!.id : null };
  }
}
