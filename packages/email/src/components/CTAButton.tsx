import { Button, Section, Text } from "@react-email/components";
import { colors, radius } from "../theme";

/**
 * The design system's primary button, as far as email allows: pine green, the
 * darker primary-700 edge, and the lighter primary-400 top border that gives the
 * real button its bevel (packages/ui/src/styles/ui/buttons.ts).
 *
 * The URL is also printed underneath as plain text — a link whose href a client
 * mangles (or a button an image-blocker eats) still leaves the user a way in.
 */
export interface CTAButtonProps {
  href: string;
  label: string;
  /** Show the raw URL below the button. On by default; off for secondary CTAs. */
  showUrl?: boolean;
}

export function CTAButton({ href, label, showUrl = true }: CTAButtonProps) {
  return (
    <Section style={{ padding: "8px 0 4px" }}>
      <Button
        href={href}
        style={{
          backgroundColor: colors.primary500,
          border: `1px solid ${colors.primary700}`,
          borderTop: `1px solid ${colors.primary400}`,
          borderRadius: radius.button,
          color: colors.neutral50,
          display: "inline-block",
          fontSize: "15px",
          fontWeight: 700,
          lineHeight: "1",
          padding: "14px 28px",
          textAlign: "center",
          textDecoration: "none",
        }}
      >
        {label}
      </Button>
      {showUrl ? (
        <Text style={{ margin: "14px 0 0", fontSize: "12px", lineHeight: "1.6", color: colors.neutral400 }}>
          أو انسخ هذا الرابط: <span style={{ color: colors.neutral500 }}>{href}</span>
        </Text>
      ) : null}
    </Section>
  );
}
