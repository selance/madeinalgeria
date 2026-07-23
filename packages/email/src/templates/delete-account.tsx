import { Text } from "@react-email/components";
import { CTAButton } from "../components/CTAButton";
import { EmailLayout } from "../components/EmailLayout";
import { EnglishBlock } from "../components/EnglishBlock";
import { renderEmail } from "../render";
import { colors, radius, text } from "../theme";

export interface DeleteAccountProps {
  username: string;
  confirmationUrl: string;
}

export function DeleteAccountEmail({ username, confirmationUrl }: DeleteAccountProps) {
  return (
    <EmailLayout
      preview="أكّد حذف حسابك على صُنع في الجزائر — هذا الإجراء نهائي"
      reason="وصلتك هذه الرسالة لأن أحدهم طلب حذف حسابك على صُنع في الجزائر. إن لم تكن أنت، تجاهلها ولن يُحذف شيء."
    >
      <Text style={text.heading}>تأكيد حذف الحساب</Text>
      <Text style={text.body}>مرحباً {username}،</Text>
      <Text style={text.body}>وصلنا طلب لحذف حسابك على صُنع في الجزائر.</Text>
      <Text
        style={{
          margin: "0 0 16px",
          padding: "12px 16px",
          borderRadius: radius.panel,
          border: `1px solid ${colors.error500}`,
          backgroundColor: colors.error50,
          color: colors.neutral700,
          fontSize: "14px",
          lineHeight: "1.8",
        }}
      >
        هذا الإجراء نهائي: ستُحذف بياناتك ولا يمكن التراجع.
      </Text>
      <CTAButton href={confirmationUrl} label="تأكيد حذف الحساب" />

      <EnglishBlock>
        <Text style={{ ...text.body, fontSize: "14px", color: colors.neutral500 }}>
          <strong style={{ color: colors.neutral800 }}>Confirm account deletion.</strong> This is permanent
          and cannot be undone. If you didn&apos;t request it, ignore this email.
        </Text>
      </EnglishBlock>
    </EmailLayout>
  );
}

export default DeleteAccountEmail;

export function deleteAccountConfirmationEmail(props: DeleteAccountProps) {
  return {
    subject: "تأكيد حذف الحساب | Confirm your Made in Algeria account deletion",
    html: renderEmail(<DeleteAccountEmail {...props} />),
    text:
      `مرحباً ${props.username}، أكّد حذف حسابك على صُنع في الجزائر (الإجراء نهائي): ${props.confirmationUrl}\n\n` +
      `Hi ${props.username}, confirm deleting your Made in Algeria account. This is permanent: ${props.confirmationUrl}`,
  };
}
