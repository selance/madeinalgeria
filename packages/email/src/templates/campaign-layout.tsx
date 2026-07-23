import { Section } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { renderEmail } from "../render";
import { colors, fontFamily } from "../theme";

export interface CampaignLayoutProps {
  /** Admin-authored HTML from the email_templates row, after {{name}}/{{email}}. */
  contentHtml: string;
  unsubscribeUrl: string;
  /** First ~90 chars of the body, as the inbox preview line. */
  preview: string;
}

/**
 * Campaign blasts used to go out as raw admin HTML with no shell, no text part
 * and no unsubscribe — from the auth domain. Now they wear the same branded
 * layout as everything else and always carry a way out.
 *
 * The content is trusted (admin-authored) and injected as-is.
 */
export function CampaignEmail({ contentHtml, unsubscribeUrl, preview }: CampaignLayoutProps) {
  return (
    <EmailLayout
      preview={preview}
      reason="تصلك هذه الرسالة لأنك مشترك في قائمة صُنع في الجزائر البريدية."
      unsubscribeUrl={unsubscribeUrl}
    >
      {/* Section always renders its own children (it's a table), so the raw HTML
          goes in a plain div inside it. */}
      <Section style={{ fontFamily, fontSize: "15px", lineHeight: "1.8", color: colors.neutral500 }}>
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </Section>
    </EmailLayout>
  );
}

export default CampaignEmail;

/** Strip tags for the plain-text part — multipart mail scores better with filters. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function campaignEmail(props: { contentHtml: string; unsubscribeUrl: string }) {
  const plain = htmlToText(props.contentHtml);
  return {
    html: renderEmail(
      <CampaignEmail
        contentHtml={props.contentHtml}
        unsubscribeUrl={props.unsubscribeUrl}
        preview={plain.slice(0, 90)}
      />,
    ),
    text: `${plain}\n\n—\nلإلغاء الاشتراك: ${props.unsubscribeUrl}`,
  };
}
