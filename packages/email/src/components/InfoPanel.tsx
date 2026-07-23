import type { ReactNode } from "react";
import { Section, Text } from "@react-email/components";
import { colors, radius } from "../theme";

/**
 * The quoted-content surface: message previews, reviewer notes, security
 * details. neutral-50 on white, 10px radius — the design system's panel.
 */
export function InfoPanel({ children }: { children: ReactNode }) {
  return (
    <Section
      style={{
        backgroundColor: colors.neutral50,
        border: `1px solid ${colors.neutral200}`,
        borderRadius: radius.panel,
        margin: "0 0 16px",
        padding: "14px 16px",
      }}
    >
      <Text style={{ margin: 0, fontSize: "14px", lineHeight: "1.8", color: colors.neutral600 }}>
        {children}
      </Text>
    </Section>
  );
}
