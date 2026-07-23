import { AppError } from "@mia/core";
import type { AssignSubscription, Entitlements, PaymentProvider } from "@mia/contracts";
import type { BillingRepo } from "./repo";

/**
 * Billing shape only (§6d): every user is effectively on the free plan, but
 * feature-gating reads the subscription row so gating logic exists from day
 * one. Payment flows arrive as PaymentProvider adapters (Chargily first) with
 * zero changes here.
 */

const FREE: Entitlements = {
  planId: null,
  planName: "free",
  features: [],
  status: "free",
  currentPeriodEnd: null,
};

export class BillingService {
  constructor(
    private repo: BillingRepo,
    /** ManualProvider today; a real adapter later — same interface. */
    private provider: PaymentProvider,
  ) {}

  /** What feature gates call. Missing/expired subscription → free plan. */
  async getEntitlements(userId: string): Promise<Entitlements> {
    const active = await this.repo.activeForUser(userId);
    if (!active) return FREE;
    return {
      planId: active.plan.id,
      planName: active.plan.name,
      features: active.plan.features ?? [],
      status: "active",
      currentPeriodEnd: active.subscription.currentPeriodEnd.toISOString(),
    };
  }

  /** Admin assigns a plan (free platform: no checkout). Creates the pending invoice. */
  async assignSubscription(input: AssignSubscription): Promise<{ subscriptionId: number; invoiceId: number }> {
    const plan = await this.repo.planById(input.planId);
    if (!plan) throw AppError.notFound("Plan not found");
    if (!plan.isActive) throw AppError.badRequest("Plan is inactive");

    const days = input.periodDays ?? (plan.interval === "yearly" ? 365 : 30);
    const periodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const subscriptionId = await this.repo.assign({ ...input, periodEnd });
    const invoiceId = await this.repo.createInvoice({
      userId: input.userId,
      subscriptionId,
      amount: plan.price,
    });
    return { subscriptionId, invoiceId };
  }

  /** Manual payment confirmation — idempotent via the pending→paid transition. */
  async markInvoicePaid(invoiceId: number): Promise<{ status: "paid" | "already-processed" }> {
    const outcome = await this.repo.markPaid(invoiceId);
    if (outcome === "not-found") throw AppError.notFound("Invoice not found");
    return { status: outcome };
  }

  get providerName(): string {
    return this.provider.name;
  }
}
