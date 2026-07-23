import { Text } from "@react-email/components";
import { CTAButton } from "../components/CTAButton";
import { EmailLayout } from "../components/EmailLayout";
import { renderEmail } from "../render";
import { text } from "../theme";

export interface NewsletterConfirmProps {
  confirmUrl: string;
}

/**
 * Newsletter double opt-in. Nothing else is ever sent to this address unless
 * the button below is clicked — the footer form is anonymous, so the address
 * may belong to someone who never asked for anything.
 */
export function NewsletterConfirmEmail({ confirmUrl }: NewsletterConfirmProps) {
  return (
    <EmailLayout
      preview="أكّد اشتراكك لتصلك آخر أخبار السوق الجزائري"
      reason="وصلتك هذه الرسالة لأن هذا البريد طُلب تسجيله في نشرة صُنع في الجزائر. إن لم تطلب ذلك، تجاهلها ولن يصلك أي بريد آخر."
    >
      <Text style={text.heading}>خطوة أخيرة لتأكيد الاشتراك</Text>
      <Text style={text.body}>مرحباً،</Text>
      <Text style={text.body}>
        وصلنا طلب اشتراك بهذا البريد في النشرة الإخبارية لمنصة صُنع في الجزائر. أكّد اشتراكك لتصلك آخر أخبار السوق
        والتحديثات.
      </Text>
      <CTAButton href={confirmUrl} label="تأكيد الاشتراك" />
      <Text style={text.muted}>صلاحية الرابط 48 ساعة.</Text>
    </EmailLayout>
  );
}

export default NewsletterConfirmEmail;

export function newsletterConfirmEmail(props: NewsletterConfirmProps) {
  return {
    subject: "أكّد اشتراكك في نشرة صُنع في الجزائر",
    html: renderEmail(<NewsletterConfirmEmail {...props} />),
    text: `أكّد اشتراكك في النشرة الإخبارية لمنصة صُنع في الجزائر: ${props.confirmUrl} (صلاحية الرابط 48 ساعة). إن لم تطلب هذا الاشتراك، تجاهل هذه الرسالة.`,
  };
}
