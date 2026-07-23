/**
 * Sample props for the preview server and the HTML export. Realistic Arabic
 * content — a preview full of "Lorem ipsum" tells you nothing about how the RTL
 * layout actually breaks.
 */
export const APP = "https://app.madeinalgeria.dev";
export const SITE = "https://www.madeinalgeria.dev";

export const sample = {
  username: "منصف عيساوي",
  companyName: "مؤسسة النور للأشغال",
  verificationUrl: `${APP}/verify?token=8f3c2a91b7e4d6`,
  resetUrl: `${APP}/reset-password/8f3c2a91b7e4d6`,
  confirmEmailUrl: `${APP}/change-email?token=8f3c2a91b7e4d6`,
  deleteUrl: `${APP}/delete-account?token=8f3c2a91b7e4d6`,
  inboxUrl: `${APP}/dashboard/messages`,
  dashboardUrl: `${APP}/dashboard/my-company`,
  conversationUrl: `${APP}/dashboard/messages?conversation=abc123`,
  newsletterConfirmUrl: `${SITE}/newsletter/confirm?token=${"a".repeat(64)}`,
  unsubscribeUrl: `${SITE}/newsletter/unsubscribe?e=reader%40example.com&s=Zm9vYmFy`,
} as const;
