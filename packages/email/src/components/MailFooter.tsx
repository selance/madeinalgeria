import { Hr, Link, Section, Text } from "@react-email/components";
import { colors, CONTACT_EMAIL, SITE_URL } from "../theme";

export interface MailFooterProps {
  /** Why this person is receiving the mail — the honest one-liner. */
  reason: string;
  /**
   * Bulk mail only (newsletter, campaigns). Its presence also drives the
   * List-Unsubscribe header on the send side — Gmail/Yahoo bulk rules want both
   * a visible link and the header.
   */
  unsubscribeUrl?: string;
}

const link = { color: colors.neutral500, textDecoration: "underline" };

export function MailFooter({ reason, unsubscribeUrl }: MailFooterProps) {
  return (
    <Section style={{ padding: "20px 32px 32px" }}>
      <Text style={{ margin: "0 0 8px", fontSize: "12px", lineHeight: "1.7", color: colors.neutral400 }}>
        {reason}
      </Text>
      <Hr style={{ borderColor: colors.neutral200, margin: "12px 0" }} />
      <Text style={{ margin: "0", fontSize: "12px", lineHeight: "1.8", color: colors.neutral400 }}>
        <Link href={SITE_URL} style={link}>
          صُنع في الجزائر
        </Link>
        {" · "}
        <Link href={`mailto:${CONTACT_EMAIL}`} style={link}>
          {CONTACT_EMAIL}
        </Link>
        {" · "}
        <Link href={`${SITE_URL}/privacy`} style={link}>
          سياسة الخصوصية
        </Link>
        {unsubscribeUrl ? (
          <>
            {" · "}
            <Link href={unsubscribeUrl} style={link}>
              إلغاء الاشتراك
            </Link>
          </>
        ) : null}
      </Text>
      <Text style={{ margin: "8px 0 0", fontSize: "12px", color: colors.neutral400 }}>
        © 2026 صُنع في الجزائر. الجزائر.
      </Text>
    </Section>
  );
}
