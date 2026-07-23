import { Text } from "@react-email/components";
import { CTAButton } from "../components/CTAButton";
import { EmailLayout } from "../components/EmailLayout";
import { EnglishBlock } from "../components/EnglishBlock";
import { renderEmail } from "../render";
import { colors, text } from "../theme";

export interface ResetPasswordProps {
  username: string;
  resetUrl: string;
}

export function ResetPasswordEmail({ username, resetUrl }: ResetPasswordProps) {
  return (
    <EmailLayout
      preview="رابط إعادة تعيين كلمة المرور الخاصة بك"
      reason="وصلتك هذه الرسالة لأن أحدهم طلب إعادة تعيين كلمة مرور حسابك على صُنع في الجزائر. إن لم تكن أنت، تجاهلها — كلمة مرورك لم تتغير."
    >
      <Text style={text.heading}>إعادة تعيين كلمة المرور</Text>
      <Text style={text.body}>مرحباً {username}،</Text>
      <Text style={text.body}>وصلنا طلب لإعادة تعيين كلمة مرور حسابك. اضغط على الزر لاختيار كلمة مرور جديدة.</Text>
      <CTAButton href={resetUrl} label="إعادة تعيين كلمة المرور" />

      <EnglishBlock>
        <Text style={{ ...text.body, fontSize: "14px", color: colors.neutral500 }}>
          <strong style={{ color: colors.neutral800 }}>Reset your password.</strong> We received a request to
          reset your Made in Algeria password. Use the button above, or open{" "}
          <span style={{ color: colors.neutral600 }}>{resetUrl}</span>
        </Text>
      </EnglishBlock>
    </EmailLayout>
  );
}

export default ResetPasswordEmail;

export function resetPasswordEmail(props: ResetPasswordProps) {
  return {
    // "Reset" is load-bearing: apps/api/test/auth.test.ts finds this mail by it.
    subject: "إعادة تعيين كلمة المرور | Reset your Made in Algeria password",
    html: renderEmail(<ResetPasswordEmail {...props} />),
    text:
      `مرحباً ${props.username}، لإعادة تعيين كلمة مرورك على صُنع في الجزائر: ${props.resetUrl}\n\n` +
      `Hi ${props.username}, reset your Made in Algeria password: ${props.resetUrl}`,
  };
}
