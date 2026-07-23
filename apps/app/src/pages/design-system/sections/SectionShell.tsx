import type { ReactNode } from "react";
import { Card } from "@mia/ui/components/card";
import { cn } from "@mia/ui";

interface SectionShellProps {
  id: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}

/**
 * Consistent wrapper for every showcase section: an anchor-target <section>,
 * a Card with design-system radius/shadow, and an Arabic heading with a Latin
 * technical subtitle. Kept local to the design-system page.
 */
export function SectionShell({ id, title, subtitle, children, className }: SectionShellProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card className={cn("rounded-card w-full p-5 sm:p-6", className)}>
        <header className="mb-5 border-b !border-neutral-100 pb-3">
          <h2 className="text-xl font-bold text-neutral-800 sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-neutral-400" dir="ltr">
            {subtitle}
          </p>
        </header>
        {children}
      </Card>
    </section>
  );
}

/** Small labelled cell used to caption an individual sample. */
export function SampleTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex min-h-[44px] items-center">{children}</div>
      <code className="text-[11px] text-neutral-400" dir="ltr">
        {label}
      </code>
    </div>
  );
}
