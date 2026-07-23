import { Text } from "@react-email/components";
import { CTAButton } from "../components/CTAButton";
import { EmailLayout } from "../components/EmailLayout";
import { EnglishBlock } from "../components/EnglishBlock";
import { renderEmail } from "../render";
import { colors, text } from "../theme";

export interface VerificationProps {
  username: string;
  verificationUrl: string;
}

const AUTH_REASON =
  "وصلتك هذه الرسالة لأن هذا البريد استُخدم لإنشاء حساب على صُنع في الجزائر. إن لم تكن أنت، تجاهلها.";

export function VerificationEmail({ username, verificationUrl }: VerificationProps) {
  return (
    <EmailLayout preview="أكّد بريدك الإلكتروني لتفعيل حسابك على صُنع في الجزائر" reason={AUTH_REASON}>
      <Text style={text.heading}>تأكيد بريدك الإلكتروني</Text>
      <Text style={text.body}>مرحباً {username}،</Text>
      <Text style={text.body}>أكّد بريدك الإلكتروني لتفعيل حسابك على منصة صُنع في الجزائر والبدء في استخدامه.</Text>
      <CTAButton href={verificationUrl} label="تأكيد البريد الإلكتروني" />

      <EnglishBlock>
        <Text style={{ ...text.body, fontSize: "14px", color: colors.neutral500 }}>
          <strong style={{ color: colors.neutral800 }}>Verify your email.</strong> Confirm your address to
          activate your Made in Algeria account — use the button above, or open{" "}
          <span style={{ color: colors.neutral600 }}>{verificationUrl}</span>
        </Text>
      </EnglishBlock>
    </EmailLayout>
  );
}

export default VerificationEmail;

export function verificationEmail(props: VerificationProps) {
  return {
    subject: "تأكيد بريدك الإلكتروني | Verify your Made in Algeria account",
    html: renderEmail(<VerificationEmail {...props} />),
    text:
      `مرحباً ${props.username}، أكّد بريدك الإلكتروني لتفعيل حسابك على صُنع في الجزائر: ${props.verificationUrl}\n\n` +
      `Hi ${props.username}, confirm your email address to activate your Made in Algeria account: ${props.verificationUrl}`,
  };
}
