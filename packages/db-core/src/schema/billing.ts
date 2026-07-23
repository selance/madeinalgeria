import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const subscriptionStatusValues = ["active", "canceled", "expired", "past_due"] as const;
export type SubscriptionStatus = (typeof subscriptionStatusValues)[number];

export const subscriptionIntervalValues = ["monthly", "yearly"] as const;
export type SubscriptionInterval = (typeof subscriptionIntervalValues)[number];

/**
 * Billing shape only while the platform is free (§6d): rows migrate 1:1 from
 * v1; gating logic reads subscriptions; no payment flows until monetization.
 */
export const plans = sqliteTable("plans", {
  id: integer("id").primaryKey(),
  name: text("name", { length: 100 }).notNull(),
  description: text("description"),
  price: real("price").notNull(),
  interval: text("interval").$type<SubscriptionInterval>().notNull(),
  features: text("features", { mode: "json" }).$type<string[]>(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: integer("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    planId: integer("plan_id")
      .notNull()
      .references(() => plans.id),
    status: text("status").$type<SubscriptionStatus>().notNull(),
    currentPeriodStart: integer("current_period_start", { mode: "timestamp" }).notNull(),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }).notNull(),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
    canceledAt: integer("canceled_at", { mode: "timestamp" }),
    endedAt: integer("ended_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("subscriptions_user_id_idx").on(t.userId)],
);

export const paymentMethods = sqliteTable(
  "payment_methods",
  {
    id: integer("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    type: text("type", { length: 50 }).notNull(),
    details: text("details", { mode: "json" }).$type<Record<string, unknown>>(),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("payment_methods_user_id_idx").on(t.userId)],
);

export const invoices = sqliteTable(
  "invoices",
  {
    id: integer("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    subscriptionId: integer("subscription_id")
      .notNull()
      .references(() => subscriptions.id),
    amount: real("amount").notNull(),
    // Status transitions (pending → paid), keyed by provider event id, are the
    // webhook idempotency rule (§6d) — never booleans.
    status: text("status", { length: 50 }).notNull(),
    billingDate: integer("billing_date", { mode: "timestamp" }).notNull(),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("invoices_user_id_idx").on(t.userId)],
);
