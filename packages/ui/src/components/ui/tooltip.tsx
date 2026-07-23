"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { Slot } from "radix-ui";

import { cn } from "../../lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = ({
  asChild = false,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger> & { asChild?: boolean }) => {
  if (asChild) {
    return <Slot.Root />;
  }
  return <TooltipPrimitive.Trigger {...props} />;
};
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipArrow = ({
  asChild = false,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Arrow> & { asChild?: boolean }) => {
  if (asChild) {
    return <Slot.Root />;
  }
  return <TooltipPrimitive.Arrow {...props} />;
};
TooltipArrow.displayName = "TooltipArrow";

const TooltipContent = ({
  className,
  sideOffset = 4,
  asChild = false,
  children,
  side = "bottom",
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Popup> & {
  sideOffset?: number;
  asChild?: boolean;
  side?:  React.ComponentProps<typeof TooltipPrimitive.Positioner>["side"];
}) => {
  const Comp = asChild ? Slot.Root : TooltipPrimitive.Popup;

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner side={side} sideOffset={sideOffset}>
        <Comp
          className={cn(
            "bg-neutral-900 text-neutral-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 overflow-hidden rounded px-3 py-1.5 text-xs",
            className,
          )}
          {...props}
        >
          {children}
        </Comp>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
};
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow };
