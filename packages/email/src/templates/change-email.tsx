import { Text } from "@react-email/components";
import { CTAButton } from "../components/CTAButton";
import { EmailLayout } from "../components/EmailLayout";
import { EnglishBlock } from "../components/EnglishBlock";
import { InfoPanel } from "../components/InfoPanel";
import { renderEmail } from "../render";
import { colors, text } from "../theme";

export interface ChangeEmailProps {
  username: string;
  oldEmail: string;
  newEmail: string;
  confirmUrl: string;
}

/** Sent to the CURRENT address — the one that must approve the move. */
export function ChangeEmailEmail({ username, oldEmail, newEmail, confirmUrl }: ChangeEmailProps) {
  return (
    <EmailLayout
      preview="أكّد تغيير البريد الإلكتروني لحسابك على صُنع في الجزائر"
      reason="وصلتك هذه الرسالة على عنوانك الحالي لأن تغيير البريد يحتاج تأكيدك أنت."
    >
      <Text style={text.heading}>تأكيد تغيير البريد الإلكتروني</Text>
      <Text style={text.body}>مرحباً {username}،</Text>
      <Text style={text.body}>وصلنا طلب لتغيير البريد الإلكتروني المرتبط بحسابك:</Text>
      <InfoPanel>
        <span dir="ltr">
          {oldEmail} ← {newEmail}
        </span>
      </InfoPanel>
      <CTAButton href={confirmUrl} label="تأكيد التغيير" />
      <Text style={text.muted}>إن لم تطلب هذا التغيير، تجاهل الرسالة ولن يتغير شيء.</Text>

      <EnglishBlock>
        <Text style={{ ...text.body, fontSize: "14px", color: colors.neutral500 }}>
          <strong style={{ color: colors.neutral800 }}>Confirm your email change.</strong> Approve moving your
          Made in Algeria account from {oldEmail} to {newEmail} using the button above. If you didn&apos;t request this,
          ignore this email.
        </Text>
      </EnglishBlock>
    </EmailLayout>
  );
}

export default ChangeEmailEmail;

export function changeEmailNotification(props: ChangeEmailProps) {
  return {
    subject: "تأكيد تغيير البريد الإلكتروني | Confirm your Made in Algeria email change",
    html: renderEmail(<ChangeEmailEmail {...props} />),
    text:
      `مرحباً ${props.username}، أكّد تغيير بريد حسابك من ${props.oldEmail} إلى ${props.newEmail}: ${props.confirmUrl}\n\n` +
      `Hi ${props.username}, confirm changing your Made in Algeria account email from ${props.oldEmail} to ${props.newEmail}: ${props.confirmUrl}`,
  };
}
