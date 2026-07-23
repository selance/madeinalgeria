import { Text } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { renderEmail } from "../render";
import { text } from "../theme";

export interface NewsletterWelcomeProps {
  unsubscribeUrl: string;
}

/**
 * Sent once the opt-in is confirmed. This is the first piece of bulk mail the
 * address gets, so it carries the unsubscribe link (and, on the send side, the
 * List-Unsubscribe header).
 */
export function NewsletterWelcomeEmail({ unsubscribeUrl }: NewsletterWelcomeProps) {
  return (
    <EmailLayout
      preview="تم تأكيد اشتراكك — ستصلك آخر أخبار السوق الجزائري"
      reason="تصلك هذه الرسالة لأنك أكّدت اشتراكك في نشرة صُنع في الجزائر."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={text.heading}>أهلاً بك في نشرة صُنع في الجزائر</Text>
      <Text style={text.body}>مرحباً،</Text>
      <Text style={text.body}>
        تم تأكيد اشتراكك. ستصلك من الآن آخر أخبار السوق الجزائري والتحديثات الجديدة على منصة صُنع في الجزائر.
      </Text>
      <Text style={text.muted}>يمكنك إلغاء الاشتراك في أي وقت من الرابط أسفل الرسالة.</Text>
    </EmailLayout>
  );
}

export default NewsletterWelcomeEmail;

export function newsletterWelcomeEmail(props: NewsletterWelcomeProps) {
  return {
    subject: "تم تأكيد اشتراكك في نشرة صُنع في الجزائر",
    html: renderEmail(<NewsletterWelcomeEmail {...props} />),
    text: `تم تأكيد اشتراكك في نشرة صُنع في الجزائر. لإلغاء الاشتراك في أي وقت: ${props.unsubscribeUrl}`,
  };
}
