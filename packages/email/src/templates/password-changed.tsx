import { Text } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { EnglishBlock } from "../components/EnglishBlock";
import { InfoPanel } from "../components/InfoPanel";
import { renderEmail } from "../render";
import { colors, text } from "../theme";

export interface PasswordChangedProps {
  username: string;
  ipAddress?: string;
  userAgent?: string;
}

/** A security notice, not a call to action — so it carries no CTA button. */
export function PasswordChangedEmail({ username, ipAddress, userAgent }: PasswordChangedProps) {
  const hasDetails = Boolean(ipAddress || userAgent);
  return (
    <EmailLayout
      preview="تم تغيير كلمة مرور حسابك على صُنع في الجزائر"
      reason="وصلتك هذه الرسالة كإشعار أمني على حسابك في صُنع في الجزائر."
    >
      <Text style={text.heading}>تم تغيير كلمة المرور</Text>
      <Text style={text.body}>مرحباً {username}،</Text>
      <Text style={text.body}>تم تغيير كلمة مرور حسابك على صُنع في الجزائر للتو.</Text>
      {hasDetails ? (
        <InfoPanel>
          {ipAddress ? <>عنوان IP: {ipAddress}</> : null}
          {ipAddress && userAgent ? <br /> : null}
          {userAgent ? <>الجهاز: {userAgent}</> : null}
        </InfoPanel>
      ) : null}
      <Text style={text.body}>
        إن لم تكن أنت من قام بذلك، أعد تعيين كلمة مرورك فوراً وتواصل معنا.
      </Text>

      <EnglishBlock>
        <Text style={{ ...text.body, fontSize: "14px", color: colors.neutral500 }}>
          <strong style={{ color: colors.neutral800 }}>Your password was changed.</strong> If this wasn&apos;t
          you, reset your password immediately and contact support.
        </Text>
      </EnglishBlock>
    </EmailLayout>
  );
}

export default PasswordChangedEmail;

export function changePasswordConfirmation(props: PasswordChangedProps) {
  const details = [
    props.ipAddress ? `عنوان IP: ${props.ipAddress}` : null,
    props.userAgent ? `الجهاز: ${props.userAgent}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
  return {
    subject: "تم تغيير كلمة المرور | Your Made in Algeria password has been changed",
    html: renderEmail(<PasswordChangedEmail {...props} />),
    text:
      `مرحباً ${props.username}، تم تغيير كلمة مرور حسابك على صُنع في الجزائر.${details ? ` (${details})` : ""} ` +
      `إن لم تكن أنت، أعد تعيين كلمة مرورك فوراً.\n\n` +
      `Hi ${props.username}, your Made in Algeria password was just changed. If this wasn't you, reset it immediately.`,
  };
}
