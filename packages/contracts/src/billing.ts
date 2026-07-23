import { z } from "zod";

/**
 * Billing SHAPE only while the platform is free (plan §6d): gating logic
 * exists from day one, payment flows don't. Providers implement
 * PaymentProvider; only ManualProvider ships until monetization is scheduled
 * (then Chargily Pay for DZ, CMI/Paymee for other markets — zero changes here).
 */

export const subscriptionIntervalSchema = z.enum(["monthly", "yearly"]);

export const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  price: z.number().min(0),
  interval: subscriptionIntervalSchema,
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});
export type CreatePlan = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema.partial();

export const assignSubscriptionSchema = z.object({
  userId: z.string().min(1),
  planId: z.number().int().positive(),
  /** Days in the first period (defaults to 30/365 by interval). */
  periodDays: z.number().int().positive().max(3660).optional(),
});
export type AssignSubscription = z.infer<typeof assignSubscriptionSchema>;

export const listSubscriptionsQuerySchema = z.object({
  userId: z.string().optional(),
  cursor: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const listInvoicesQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.string().optional(),
  cursor: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** What feature-gating reads — every user has one, free by default. */
export interface Entitlements {
  planId: number | null;
  planName: string;
  features: string[];
  status: "free" | "active" | "expired";
  currentPeriodEnd: string | null;
}

/**
 * Provider-agnostic payment interface (§6d). Webhook idempotency rule:
 * invoice status transitions (pending → paid), never booleans, keyed by
 * provider event id.
 */
export interface PaymentEvent {
  providerEventId: string;
  invoiceId: number;
  kind: "payment.succeeded" | "payment.failed" | "refund.succeeded";
}

/** Structural view of an incoming webhook — keeps contracts platform-neutral. */
export interface WebhookRequest {
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: { invoiceId: number; amount: number; currency: string }): Promise<{ url: string } | null>;
  verifyWebhook(request: WebhookRequest): Promise<PaymentEvent | null>;
  refund(invoiceId: number): Promise<void>;
}
