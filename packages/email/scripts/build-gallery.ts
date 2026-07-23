/**
 * Build a self-contained review gallery of every email (preview-out/gallery.html).
 *
 * Each card embeds the REAL rendered HTML in an iframe srcdoc, so what you see is
 * exactly what Resend would send. The brand wordmark is plain text, so the
 * gallery is fully self-contained — no external image to block.
 *
 *   pnpm --filter @mia/email build:gallery
 */
import { writeFile, mkdir } from "node:fs/promises";
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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "../preview-out");

type Identity = "auth" | "notify";

interface Entry {
  id: string;
  title: string;
  trigger: string;
  identity: Identity;
  bilingual?: boolean;
  bulk?: boolean;
  mail: { subject?: string; html: string; text: string };
}

const entries: Entry[] = [
  {
    id: "verification",
    title: "تأكيد البريد",
    trigger: "Sign-up",
    identity: "auth",
    bilingual: true,
    mail: verificationEmail({ username: sample.username, verificationUrl: sample.verificationUrl }),
  },
  {
    id: "reset-password",
    title: "إعادة تعيين كلمة المرور",
    trigger: "Forgot password",
    identity: "auth",
    bilingual: true,
    mail: resetPasswordEmail({ username: sample.username, resetUrl: sample.resetUrl }),
  },
  {
    id: "password-changed",
    title: "تم تغيير كلمة المرور",
    trigger: "Password reset completed",
    identity: "auth",
    bilingual: true,
    mail: changePasswordConfirmation({
      username: sample.username,
      ipAddress: "41.102.14.7",
      userAgent: "Chrome على Windows",
    }),
  },
  {
    id: "change-email",
    title: "تغيير البريد",
    trigger: "Email change requested",
    identity: "auth",
    bilingual: true,
    mail: changeEmailNotification({
      username: sample.username,
      oldEmail: "moncef@example.com",
      newEmail: "moncef@madeinalgeria.dev",
      confirmUrl: sample.confirmEmailUrl,
    }),
  },
  {
    id: "delete-account",
    title: "حذف الحساب",
    trigger: "Account deletion requested",
    identity: "auth",
    bilingual: true,
    mail: deleteAccountConfirmationEmail({
      username: sample.username,
      confirmationUrl: sample.deleteUrl,
    }),
  },
  {
    id: "newsletter-confirm",
    title: "تأكيد الاشتراك",
    trigger: "Footer newsletter form",
    identity: "notify",
    mail: newsletterConfirmEmail({ confirmUrl: sample.newsletterConfirmUrl }),
  },
  {
    id: "newsletter-welcome",
    title: "ترحيب بالنشرة",
    trigger: "Opt-in confirmed",
    identity: "notify",
    bulk: true,
    mail: newsletterWelcomeEmail({ unsubscribeUrl: sample.unsubscribeUrl }),
  },
  {
    id: "campaign",
    title: "حملة بريدية",
    trigger: "Admin sends a campaign",
    identity: "notify",
    bulk: true,
    mail: campaignEmail({
      contentHtml:
        "<p>مرحباً منصف،</p><p>أضفنا هذا الأسبوع أكثر من 400 شركة جديدة إلى دليل صُنع في الجزائر، وحسّنّا البحث بالولاية والنشاط.</p>",
      unsubscribeUrl: sample.unsubscribeUrl,
    }),
  },
];

const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const kb = (html: string) => (new TextEncoder().encode(html).length / 1024).toFixed(1);

const cards = entries
  .map((e) => {
    const html = e.mail.html;
    const chips = [
      `<span class="chip chip--${e.identity}">${e.identity === "auth" ? "hello@auth.madeinalgeria.dev" : "notify@mail.madeinalgeria.dev"}</span>`,
      e.bilingual ? `<span class="chip">عربي + EN</span>` : "",
      e.bulk ? `<span class="chip chip--bulk">List-Unsubscribe</span>` : "",
    ]
      .filter(Boolean)
      .join("");
    return `<article class="card">
  <header class="card__head">
    <div class="card__title">
      <h2>${esc(e.title)}</h2>
      <p class="trigger">${esc(e.trigger)}</p>
    </div>
    <div class="card__meta">
      <span class="size">${kb(e.mail.html)} KB</span>
    </div>
  </header>
  ${e.mail.subject ? `<p class="subject"><span>Subject</span>${esc(e.mail.subject)}</p>` : ""}
  <div class="chips">${chips}</div>
  <div class="frame"><iframe title="${esc(e.title)}" loading="lazy" srcdoc="${esc(html)}"></iframe></div>
</article>`;
  })
  .join("\n");

const page = `<title>Made in Algeria — بريد المنصة</title>
<style>
  :root {
    --brand: #0672d6;
    --brand-soft: #d3e7ff;
    --accent: #fa8a00;
    --ground: #eff0f0;
    --surface: #ffffff;
    --line: #dfe0e2;
    --ink: #2d2e2f;
    --ink-soft: #6e7072;
    --ink-faint: #a4a5a8;
    --shadow: 0 2px 4px rgba(0, 38, 79, 0.06);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --brand: #50a0ff;
      --brand-soft: #10305a;
      --ground: #15171a;
      --surface: #1c1f23;
      --line: #2e3238;
      --ink: #e7e9ec;
      --ink-soft: #a2a7ae;
      --ink-faint: #6f757d;
      --shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    }
  }
  :root[data-theme="dark"] {
    --brand: #50a0ff;
    --brand-soft: #10305a;
    --ground: #15171a;
    --surface: #1c1f23;
    --line: #2e3238;
    --ink: #e7e9ec;
    --ink-soft: #a2a7ae;
    --ink-faint: #6f757d;
    --shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
  :root[data-theme="light"] {
    --brand: #0672d6;
    --brand-soft: #d3e7ff;
    --ground: #eff0f0;
    --surface: #ffffff;
    --line: #dfe0e2;
    --ink: #2d2e2f;
    --ink-soft: #6e7072;
    --ink-faint: #a4a5a8;
    --shadow: 0 2px 4px rgba(0, 38, 79, 0.06);
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 40px 24px 72px;
    background: var(--ground);
    color: var(--ink);
    font: 15px/1.6 "Segoe UI", system-ui, -apple-system, sans-serif;
  }
  .wrap { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; }

  .masthead { display: flex; flex-direction: column; gap: 12px; padding-bottom: 24px; border-bottom: 3px solid var(--accent); }
  .eyebrow { margin: 0; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--brand); font-weight: 700; }
  h1 { margin: 0; font-size: clamp(26px, 3vw, 36px); line-height: 1.2; text-wrap: balance; letter-spacing: -0.01em; }
  .lede { margin: 0; max-width: 62ch; color: var(--ink-soft); }

  .stats { display: flex; flex-wrap: wrap; gap: 28px; }
  .stat { display: flex; flex-direction: column; }
  .stat b { font-size: 22px; font-variant-numeric: tabular-nums; }
  .stat span { font-size: 12px; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.08em; }

  .grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(min(420px, 100%), 1fr)); }

  .card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 16px;
    box-shadow: var(--shadow);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 16px 18px 10px; }
  .card__title h2 { margin: 0; font-size: 17px; }
  .trigger { margin: 2px 0 0; font-size: 13px; color: var(--ink-faint); }
  .size { font-size: 12px; color: var(--ink-faint); font-variant-numeric: tabular-nums; white-space: nowrap; }

  .subject { margin: 0; padding: 0 18px 10px; font-size: 13px; color: var(--ink-soft); display: flex; gap: 8px; }
  .subject span { color: var(--ink-faint); text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; padding-top: 2px; }

  .chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 18px 14px; }
  .chip {
    font-size: 11px;
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--ink-soft);
    white-space: nowrap;
  }
  .chip--auth { border-color: var(--brand); color: var(--brand); background: var(--brand-soft); }
  .chip--notify { border-color: var(--accent); color: var(--accent); }
  .chip--bulk { border-color: var(--accent); color: var(--accent); }

  .frame { border-top: 1px solid var(--line); background: #eff0f0; }
  iframe { width: 100%; height: 620px; border: 0; display: block; }

  footer { color: var(--ink-faint); font-size: 13px; border-top: 1px solid var(--line); padding-top: 20px; }
</style>

<div class="wrap">
  <header class="masthead">
    <p class="eyebrow">Design review</p>
    <h1>كل بريد ترسله صُنع في الجزائر</h1>
    <p class="lede">
      The full set, rendered exactly as Resend will send it — same React templates, same brand tokens.
      Auth mail leads in Arabic and restates in English; product mail is Arabic only.
    </p>
    <div class="stats">
      <div class="stat"><b>${entries.length}</b><span>Emails</span></div>
      <div class="stat"><b>2</b><span>Sending identities</span></div>
      <div class="stat"><b>${Math.max(...entries.map((e) => Number(kb(e.mail.html))))} KB</b><span>Largest body</span></div>
      <div class="stat"><b>102 KB</b><span>Gmail clips at</span></div>
    </div>
  </header>

  <main class="grid">
${cards}
  </main>

  <footer>
    Bulk mail (newsletter, campaigns) sends from <b>notify@mail.madeinalgeria.dev</b> and carries a one-click
    List-Unsubscribe header — so a spam complaint on a blast can never cost anyone a password reset.
  </footer>
</div>`;

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, "gallery.html"), page, "utf8");
console.log(`wrote ${path.join(OUT, "gallery.html")}`);
