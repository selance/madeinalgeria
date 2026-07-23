import type { ReactNode } from "react";
import { Hr, Section } from "@react-email/components";
import { colors } from "../theme";

/**
 * The English half of the auth emails. Arabic leads (the product is Arabic and
 * so are our users); this is the condensed LTR restatement below a divider, for
 * anyone whose mail client or habits are English.
 *
 * Only the auth family carries it — lead/chat/claim mail goes to Algerian
 * business owners and stays Arabic-only.
 */
export function EnglishBlock({ children }: { children: ReactNode }) {
  return (
    <>
      <Hr style={{ borderColor: colors.neutral200, margin: "24px 0 20px" }} />
      <Section dir="ltr" style={{ textAlign: "left" }}>
        {children}
      </Section>
    </>
  );
}
