"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "../../lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      "relative inline-flex items-center justify-center gap-1 rounded bg-neutral-100 p-1 text-neutral-500",
      className,
    )}
    {...props}
  />
);
TabsList.displayName = "TabsList";

const TabsTrigger = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Tab>) => (
  <TabsPrimitive.Tab
    className={cn(
      "relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 rounded border border-transparent px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-neutral-500 transition-colors",
      "hover:text-neutral-700",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // base-ui marks the active tab with data-active (not data-selected). The
      // white pill lives on the trigger itself so any <TabsList> is styled
      // without needing a separate <TabsIndicator>.
      "data-[active]:bg-white data-[active]:border-neutral-200 data-[active]:font-semibold data-[active]:text-neutral-900",
      className,
    )}
    {...props}
  />
);
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Panel>) => (
  <TabsPrimitive.Panel
    className={cn("mt-4 focus-visible:outline-none", className)}
    {...props}
  />
);
TabsContent.displayName = "TabsContent";

/**
 * The sliding white pill behind the active tab. Sized/positioned by base-ui via
 * the --active-tab-* CSS vars; render it as the FIRST child of <TabsList>.
 */
const TabsIndicator = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Indicator>) => (
  <TabsPrimitive.Indicator
    className={cn(
      "absolute top-1 left-0 z-0 rounded border border-neutral-200 bg-white transition-all duration-200 ease-out",
      "h-[var(--active-tab-height)] w-[var(--active-tab-width)]",
      "translate-x-[var(--active-tab-left)] translate-y-0",
      className,
    )}
    {...props}
  />
);
TabsIndicator.displayName = "TabsIndicator";

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator };
