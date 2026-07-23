import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { colors, fontFamily, radius, shadow, spacing } from "../theme";
import { MailFooter } from "./MailFooter";

/**
 * The one shell every Made in Algeria email wears. Arabic RTL by default, echoing the
 * public site's footer: a solid brand-blue header band (no gradient — Outlook's
 * Word engine won't paint one) with the warm secondary rule under it, then the
 * white 20px card on the neutral-100 page.
 *
 * The wordmark is plain white-on-blue text so it reads in both light and dark
 * email themes and never gets eaten by an image blocker.
 */
export interface EmailLayoutProps {
  /** The line Gmail prints next to the subject. Never leave this empty. */
  preview: string;
  children: ReactNode;
  /** Why the recipient got this — shown in the footer. */
  reason: string;
  /** Bulk mail only; also drives the List-Unsubscribe header. */
  unsubscribeUrl?: string;
}

export function EmailLayout({ preview, children, reason, unsubscribeUrl }: EmailLayoutProps) {
  return (
    <Html dir="rtl" lang="ar">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "24px 12px",
          backgroundColor: colors.neutral100,
          fontFamily,
          direction: "rtl",
        }}
      >
        <Container style={{ margin: "0 auto", maxWidth: "560px", width: "100%" }}>
          <Section
            style={{
              backgroundColor: colors.primary500,
              borderRadius: `${radius.card} ${radius.card} 0 0`,
              padding: "26px 32px",
              textAlign: "center",
            }}
          >
            {/* Plain-text wordmark — no image dependency, always renders. */}
            <Text
              style={{
                margin: 0,
                color: colors.white,
                fontFamily,
                fontSize: "28px",
                fontWeight: 800,
                letterSpacing: "0.5px",
                lineHeight: "1",
              }}
            >
              صُنع في الجزائر | Made in Algeria
            </Text>
          </Section>
          {/* the "sunset" band from the site footer, reduced to a rule */}
          <Section style={{ backgroundColor: colors.secondary500, fontSize: "1px", lineHeight: "3px", height: "3px" }}>
            &nbsp;
          </Section>

          <Section
            style={{
              backgroundColor: colors.white,
              borderRadius: `0 0 ${radius.card} ${radius.card}`,
              boxShadow: shadow,
              padding: spacing.card,
              textAlign: "right",
            }}
          >
            {children}
          </Section>

          <MailFooter reason={reason} unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  );
}
