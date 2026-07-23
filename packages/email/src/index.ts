export { EmailRateLimiter } from "./rate-limiter";
export type { EmailKind, IdentifierType, KVStore, RateCheckResult } from "./rate-limiter";

export {
  consoleOutbox,
  createConsoleSender,
  createResendSender,
  listUnsubscribeHeaders,
} from "./sender";
export type { EmailSender, SendEmailInput } from "./sender";

/**
 * The template surface. Same names and `{ subject, html, text }` shape the
 * hand-written HTML templates had — the 13 call sites never knew they changed.
 * (`emailChangeSecurityAlert` is gone: it had no callers. better-auth ≥1.6
 * re-sends the standard verification mail to the new address instead.)
 */
export { verificationEmail } from "./templates/verification";
export { resetPasswordEmail } from "./templates/reset-password";
export { changePasswordConfirmation } from "./templates/password-changed";
export { changeEmailNotification } from "./templates/change-email";
export { deleteAccountConfirmationEmail } from "./templates/delete-account";
export { newsletterConfirmEmail } from "./templates/newsletter-confirm";
export { newsletterWelcomeEmail } from "./templates/newsletter-welcome";
export { campaignEmail, htmlToText } from "./templates/campaign-layout";
