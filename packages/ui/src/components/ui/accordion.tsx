"use client";

import * as React from "react";
import { Accordion } from "@base-ui/react/accordion";
import { LuChevronDown } from "react-icons/lu";

import { cn } from "../../lib/utils";

const AccordionItem = ({ className, ...props }: React.ComponentProps<typeof Accordion.Item>) => (
  <Accordion.Item className={cn("border-b border-neutral-200", className)} {...props} />
);
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = ({ className, children, ...props }: React.ComponentProps<typeof Accordion.Trigger>) => (
  <Accordion.Header className="flex">
    <Accordion.Trigger
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-left text-sm font-medium text-neutral-700 transition-all hover:text-neutral-900 [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <LuChevronDown className="text-neutral-500 h-4 w-4 shrink-0 transition-transform duration-200" />
    </Accordion.Trigger>
  </Accordion.Header>
);
AccordionTrigger.displayName = "AccordionTrigger";

const Panel = ({ className, children, ...props }: React.ComponentProps<typeof Accordion.Panel>) => (
  <Accordion.Panel
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
    {...props}
  >
    <div className={cn("pt-0 pb-4", className)}>{children}</div>
  </Accordion.Panel>
);
Panel.displayName = "Panel";

export { Accordion, AccordionItem, AccordionTrigger, Panel };
