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
} from "../index";

/**
 * One pass over every template we can send. These assertions are the contract
 * with the inbox: a body that renders, a plain-text part (multipart mail scores
 * better with filters), a CTA whose URL survives verbatim, and a size Gmail
 * won't clip.
 */

const URL_ = "https://app.madeinalgeria.dev/x?token=abc123&k=1";

const ALL = [
  ["verification", verificationEmail({ username: "منصف", verificationUrl: URL_ })],
  ["reset-password", resetPasswordEmail({ username: "منصف", resetUrl: URL_ })],
  ["password-changed", changePasswordConfirmation({ username: "منصف", ipAddress: "1.2.3.4" })],
  [
    "change-email",
    changeEmailNotification({ username: "منصف", oldEmail: "a@x.com", newEmail: "b@x.com", confirmUrl: URL_ }),
  ],
  ["delete-account", deleteAccountConfirmationEmail({ username: "منصف", confirmationUrl: URL_ })],
  ["newsletter-confirm", newsletterConfirmEmail({ confirmUrl: URL_ })],
  ["newsletter-welcome", newsletterWelcomeEmail({ unsubscribeUrl: URL_ })],
] as const;

describe.each(ALL)("%s", (name, mail) => {
  it("renders a complete, branded document", () => {
    expect(mail.html.startsWith("<!DOCTYPE")).toBe(true);
    expect(mail.html).toContain('dir="rtl"');
    // The plain-text wordmark rides in the branded header band.
    expect(mail.html).toContain("Made in Algeria");
    // The pine-green brand, not the Tailwind default the old templates shipped.
    expect(mail.html).toContain("#1a6444");
    expect(mail.html).not.toContain("#1d4ed8");
  });

  it("has a subject and a plain-text alternative", () => {
    expect(mail.subject.length).toBeGreaterThan(0);
    expect(mail.text.trim().length).toBeGreaterThan(0);
  });

  it("never leaks a rendering artefact into the body", () => {
    for (const artefact of ["undefined", "NaN", "[object Object]", "oklch("]) {
      expect(mail.html, `${name} contains "${artefact}"`).not.toContain(artefact);
    }
  });

  it("stays well under Gmail's ~102KB clipping threshold", () => {
    expect(new TextEncoder().encode(mail.html).length).toBeLessThan(60_000);
  });
});

describe("links survive rendering", () => {
  it("keeps the CTA href verbatim — tokens are parsed back out of these", () => {
    // react-email must not entity-encode or wrap the query string: apps/api's
    // auth test greps the reset URL straight out of the HTML, and so do we.
    const mail = resetPasswordEmail({ username: "x", resetUrl: "https://app.madeinalgeria.dev/reset-password/tok_123" });
    expect(mail.html).toContain("https://app.madeinalgeria.dev/reset-password/tok_123");
  });

  it("keeps the newsletter confirm token intact", () => {
    const token = "a".repeat(64);
    const mail = newsletterConfirmEmail({
      confirmUrl: `https://www.madeinalgeria.dev/newsletter/confirm?token=${token}`,
    });
    expect(/token=([a-f0-9]{64})/.exec(mail.html)?.[1]).toBe(token);
  });
});

describe("bilingual auth mail", () => {
  it("leads in Arabic and restates in English", () => {
    const mail = verificationEmail({ username: "منصف", verificationUrl: URL_ });
    expect(mail.html).toContain("تأكيد بريدك الإلكتروني");
    expect(mail.html).toContain("Verify your email");
    expect(mail.subject).toContain("Verify your Made in Algeria account");
    expect(mail.text).toContain("مرحباً");
    expect(mail.text).toContain("Hi");
  });

  it("keeps the word Reset in the reset subject (apps/api's auth test greps it)", () => {
    expect(resetPasswordEmail({ username: "x", resetUrl: URL_ }).subject).toContain("Reset");
  });
});

describe("campaign blasts", () => {
  it("wraps admin HTML in the shell and always carries an unsubscribe link", () => {
    const mail = campaignEmail({
      contentHtml: "<p>عرض خاص لهذا الأسبوع</p>",
      unsubscribeUrl: "https://www.madeinalgeria.dev/newsletter/unsubscribe?e=a%40x.com&s=sig",
    });
    expect(mail.html).toContain("عرض خاص لهذا الأسبوع");
    expect(mail.html).toContain("إلغاء الاشتراك");
    expect(mail.html).toContain("s=sig");
    // A blast without a text part is a spam-filter magnet.
    expect(mail.text).toContain("عرض خاص لهذا الأسبوع");
    expect(mail.text).toContain("https://www.madeinalgeria.dev/newsletter/unsubscribe");
  });
});
