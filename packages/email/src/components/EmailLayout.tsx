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
 * The one shell every Made in Algeria email wears: clean editorial "print on
 * paper". Arabic RTL by default. A single white content card sits on the warm
 * neutral-100 page, held by a 1px neutral-200 hairline border and one flat,
 * zero-blur "print block" offset — no rounded blue band, no soft glow.
 *
 * The wordmark is plain pine-green text at the top of the card, over a slim
 * green accent strip, so it reads in any theme and never gets eaten by an image
 * blocker. A steel-blue hairline rule closes the header.
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
              backgroundColor: colors.white,
              border: `1px solid ${colors.neutral200}`,
              borderRadius: radius.card,
              boxShadow: shadow,
            }}
          >
            {/* Slim pine-green accent strip — the print-block edge. */}
            <Section
              style={{
                backgroundColor: colors.primary500,
                borderRadius: `${radius.card} ${radius.card} 0 0`,
                fontSize: "1px",
                lineHeight: "4px",
                height: "4px",
              }}
            >
              &nbsp;
            </Section>

            {/* Header: plain-text wordmark in green — no image dependency. */}
            <Section style={{ padding: "22px 32px 0", textAlign: "right" }}>
              <Text
                style={{
                  margin: 0,
                  color: colors.primary500,
                  fontFamily,
                  fontSize: "19px",
                  fontWeight: 800,
                  letterSpacing: "0.2px",
                  lineHeight: "1.3",
                }}
              >
                صُنع في الجزائر <span style={{ color: colors.neutral400, fontWeight: 400 }}>| Made in Algeria</span>
              </Text>
              {/* short steel-blue accent rule closing the header */}
              <Section
                style={{
                  backgroundColor: colors.secondary500,
                  fontSize: "1px",
                  lineHeight: "2px",
                  height: "2px",
                  margin: "16px 0 0",
                  width: "44px",
                }}
              >
                &nbsp;
              </Section>
            </Section>

            {/* Content */}
            <Section
              style={{
                padding: `${spacing.gap} ${spacing.card} ${spacing.card}`,
                textAlign: "right",
              }}
            >
              {children}
            </Section>
          </Section>

          <MailFooter reason={reason} unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  );
}
