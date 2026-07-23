/**
 * Resend sender over plain fetch — no SDK.
 * Transactional mail sends from hello@auth.madeinalgeria.dev — a dedicated auth
 * subdomain verified in Resend (SPF/DKIM; DMARC lives on the org domain), so
 * the root domain doesn't send at all. Never a "no-reply" address — inbox
 * providers read an unanswerable From as a distrust signal, and every mail we
 * send carries a real reply-to anyway. Deployed envs can still override the
 * identity via AUTH_EMAIL_FROM.
 * Product notifications and every piece of BULK mail send from the SUBDOMAIN
 * sender (mail.madeinalgeria.dev) so their reputation never taints the root
 * domain's auth email — a spam complaint on a newsletter must not cost anyone a
 * password reset.
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative — always provide it; multipart scores better with spam filters. */
  text?: string;
  /** Resend dashboard segmentation (e.g. category=newsletter-welcome). ASCII only. */
  tags?: { name: string; value: string }[];
  /**
   * Where a human reply lands. A From that nobody can answer is an engagement
   * signal against you; every mail we send sets this.
   */
  replyTo?: string;
  /**
   * Raw SMTP headers. Bulk mail carries List-Unsubscribe +
   * List-Unsubscribe-Post (RFC 8058 one-click) — Gmail and Yahoo's bulk-sender
   * rules require it, and its absence is a direct spam-folder signal.
   */
  headers?: Record<string, string>;
  /** Per-message From override (bulk mail → the marketing identity). */
  from?: string;
}

export interface EmailSender {
  send(input: SendEmailInput): Promise<void>;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "صُنع في الجزائر | Made in Algeria <hello@auth.madeinalgeria.dev>";
const DEFAULT_REPLY_TO = "moncef@mochir.com";
const BOM = "﻿";

/** The RFC 8058 pair that turns a link into a one-click unsubscribe button. */
export function listUnsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * Strip a leading UTF-8 BOM and stray whitespace from the stored secret.
 * `wrangler secret put` piped through PowerShell prepends a BOM, and Resend
 * then answers EVERY send with 400 "API key is invalid" — silently killing all
 * transactional mail. The BOM is invisible in both dashboards, so this costs one
 * string op per isolate to never have to chase it again.
 */
function cleanKey(apiKey: string): string {
  return apiKey.startsWith(BOM) ? apiKey.slice(BOM.length).trim() : apiKey.trim();
}

export function createResendSender(
  rawApiKey: string,
  from: string = DEFAULT_FROM,
  replyTo: string = DEFAULT_REPLY_TO,
): EmailSender {
  const apiKey = cleanKey(rawApiKey);
  return {
    async send(input: SendEmailInput): Promise<void> {
      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: input.from ?? from,
          to: input.to,
          subject: input.subject,
          html: input.html,
          reply_to: input.replyTo ?? replyTo,
          ...(input.text ? { text: input.text } : {}),
          ...(input.tags?.length ? { tags: input.tags } : {}),
          ...(input.headers ? { headers: input.headers } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Resend send failed (${res.status}): ${body}`);
      }
    },
  };
}

/**
 * Dev/test sender: logs instead of sending (used when RESEND_API_KEY is absent
 * locally). Keeps the last few messages in `consoleOutbox` so integration
 * tests can read the URLs that would have been emailed.
 */
export const consoleOutbox: SendEmailInput[] = [];

export function createConsoleSender(): EmailSender {
  return {
    async send(input: SendEmailInput): Promise<void> {
      consoleOutbox.push(input);
      if (consoleOutbox.length > 20) consoleOutbox.shift();
      console.log(`[email:console] to=${input.to} subject="${input.subject}"`);
    },
  };
}
