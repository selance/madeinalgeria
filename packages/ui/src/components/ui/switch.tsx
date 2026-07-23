"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "../../lib/utils";

const Switch = ({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) => (
  <SwitchPrimitive.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-primary-500 data-checked:bg-primary-500 data-unchecked:border-neutral-300 data-unchecked:bg-neutral-50",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full border border-neutral-300 bg-white shadow-sm ring-0 transition-transform data-checked:translate-x-4 data-unchecked:translate-x-0"
      )}
    />
  </SwitchPrimitive.Root>
);
Switch.displayName = "Switch";

export { Switch };