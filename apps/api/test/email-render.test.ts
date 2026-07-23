import { describe, expect, it } from "vitest";
import {
  campaignEmail,
  changeEmailNotification,
  changePasswordConfirmation,
  deleteAccountConfirmationEmail,
  newsletterConfirmEmail,
  newsletterWelcomeEmail,
  resetPasswordEmail,
  verificationEmail,
} from "@mia/email";

/**
 * The guard on the whole email stack: templates are React, and the Worker is
 * where they render (producers build the HTML before enqueueing). React's public
 * entrypoints are CJS shims that pick a dev/prod build off process.env.NODE_ENV,
 * which workerd cannot resolve at runtime — so this asserts the bundle we
 * actually deploy can render every template in the real runtime.
 *
 * If this fails, no email in production has a body.
 */

const URL_ = "https://app.madeinalgeria.dev/x?token=abc123";

const RENDERED: [string, { subject?: string; html: string; text: string }][] = [
  ["verification", verificationEmail({ username: "منصف", verificationUrl: URL_ })],
  ["reset-password", resetPasswordEmail({ username: "منصف", resetUrl: URL_ })],
  ["password-changed", changePasswordConfirmation({ username: "منصف" })],
  [
    "change-email",
    changeEmailNotification({ username: "م", oldEmail: "a@x.com", newEmail: "b@x.com", confirmUrl: URL_ }),
  ],
  ["delete-account", deleteAccountConfirmationEmail({ username: "م", confirmationUrl: URL_ })],
  ["newsletter-confirm", newsletterConfirmEmail({ confirmUrl: URL_ })],
  ["newsletter-welcome", newsletterWelcomeEmail({ unsubscribeUrl: URL_ })],
  ["campaign", campaignEmail({ contentHtml: "<p>مرحباً</p>", unsubscribeUrl: URL_ })],
];

describe("every email template renders inside workerd", () => {
  it.each(RENDERED)("%s", (_name, mail) => {
    expect(mail.html).toContain("<html");
    expect(mail.html).toContain("Made in Algeria");
    expect(mail.html).toContain("#1a6444");
    expect(mail.text.length).toBeGreaterThan(0);
  });
});
