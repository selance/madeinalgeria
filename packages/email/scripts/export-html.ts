/**
 * Render every template to preview-out/*.html.
 *
 * Two uses: paste one into mail-tester.com for a spam score, and open index.html
 * to eyeball all of them side by side without sending anything.
 *
 *   pnpm --filter @mia/email export:html
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  campaignEmail,
  changeEmailNotification,
  changePasswordConfirmation,
  deleteAccountConfirmationEmail,
  newsletterConfirmEmail,
  newsletterWelcomeEmail,
  resetPasswordEmail,
  verificationEmail,
} from "../src/index";
import { sample } from "../emails/preview-data";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../preview-out");

const emails: Record<string, { subject?: string; html: string; text: string }> = {
  verification: verificationEmail({ username: sample.username, verificationUrl: sample.verificationUrl }),
  "reset-password": resetPasswordEmail({ username: sample.username, resetUrl: sample.resetUrl }),
  "password-changed": changePasswordConfirmation({
    username: sample.username,
    ipAddress: "41.102.14.7",
    userAgent: "Chrome على Windows",
  }),
  "change-email": changeEmailNotification({
    username: sample.username,
    oldEmail: "moncef@example.com",
    newEmail: "moncef@madeinalgeria.dev",
    confirmUrl: sample.confirmEmailUrl,
  }),
  "delete-account": deleteAccountConfirmationEmail({
    username: sample.username,
    confirmationUrl: sample.deleteUrl,
  }),
  "newsletter-confirm": newsletterConfirmEmail({ confirmUrl: sample.newsletterConfirmUrl }),
  "newsletter-welcome": newsletterWelcomeEmail({ unsubscribeUrl: sample.unsubscribeUrl }),
  campaign: campaignEmail({
    contentHtml:
      "<p>مرحباً منصف،</p><p>أضفنا هذا الأسبوع أكثر من 400 شركة جديدة إلى دليل صُنع في الجزائر، وحسّنّا البحث بالولاية والنشاط.</p>",
    unsubscribeUrl: sample.unsubscribeUrl,
  }),
};

await mkdir(OUT, { recursive: true });

const rows: string[] = [];
for (const [name, mail] of Object.entries(emails)) {
  await writeFile(path.join(OUT, `${name}.html`), mail.html, "utf8");
  const kb = (new TextEncoder().encode(mail.html).length / 1024).toFixed(1);
  rows.push(
    `<figure><figcaption>${name} — ${kb} KB${mail.subject ? ` · <b>${mail.subject}</b>` : ""}</figcaption>` +
      `<iframe src="./${name}.html" loading="lazy"></iframe></figure>`,
  );
  console.log(`${name.padEnd(20)} ${kb.padStart(6)} KB`);
}

await writeFile(
  path.join(OUT, "index.html"),
  `<!doctype html><meta charset="utf-8"><title>Made in Algeria emails</title>
<style>
  body { font: 14px system-ui; background: #eff0f0; margin: 0; padding: 24px; }
  .grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(600px, 1fr)); }
  figure { margin: 0; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,38,79,.08); }
  figcaption { padding: 10px 14px; border-bottom: 1px solid #dfe0e2; color: #4d4f51; }
  iframe { width: 100%; height: 760px; border: 0; display: block; }
</style>
<h1>Made in Algeria emails</h1>
<div class="grid">${rows.join("\n")}</div>`,
  "utf8",
);

console.log(`\nopen ${path.join(OUT, "index.html")}`);
