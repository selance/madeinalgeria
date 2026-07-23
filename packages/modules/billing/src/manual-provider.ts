import type { PaymentProvider } from "@mia/contracts";

/**
 * The only provider while the platform is free (§6d): checkout doesn't exist,
 * webhooks never arrive, "payment" is an admin marking an invoice paid.
 * A real payment provider implements the same interface when monetization is
 * scheduled — no changes to the service.
 */
export const manualProvider: PaymentProvider = {
  name: "manual",
  async createCheckout() {
    return null; // no hosted checkout — admin marks invoices paid
  },
  async verifyWebhook() {
    return null; // no webhooks in manual mode
  },
  async refund() {
    throw new Error("Manual provider: record refunds by adjusting the invoice via admin");
  },
};
