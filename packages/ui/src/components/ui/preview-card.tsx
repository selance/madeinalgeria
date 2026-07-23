"use client";

import * as React from "react";
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";

import { cn } from "../../lib/utils";

const PreviewCard = PreviewCardPrimitive.Root;


type PreviewCardTriggerProps = React.ComponentProps<typeof PreviewCardPrimitive.Trigger>;

const PreviewCardTrigger = ({ className, ...props }: PreviewCardTriggerProps) => (
  <PreviewCardPrimitive.Trigger
    className={cn(className)}
    {...props}
  />
);
PreviewCardTrigger.displayName = "PreviewCardTrigger";

const PreviewCardPortal = PreviewCardPrimitive.Portal;

type PreviewCardContentProps = React.ComponentProps<typeof PreviewCardPrimitive.Popup> & {
  align?: "center" | "start" | "end";
  sideOffset?: number;
  side?: "top" | "right" | "bottom" | "left";
};

const PreviewCardContent = ({ 
  className, 
  align = "center", 
  sideOffset = 4, 
  side = "bottom",
  children,
  ...props 
}: PreviewCardContentProps) => (
  <PreviewCardPortal>
    <PreviewCardPrimitive.Positioner
      align={align}
      sideOffset={sideOffset}
      side={side}
    >
      <PreviewCardPrimitive.Popup
        className={cn(
          "z-50 w-64 rounded-card border border-neutral-200 bg-white p-4 text-neutral-500 shadow-lg outline-none data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        {children}
      </PreviewCardPrimitive.Popup>
    </PreviewCardPrimitive.Positioner>
  </PreviewCardPortal>
);
PreviewCardContent.displayName = "PreviewCardContent";

type PreviewCardArrowProps = React.ComponentProps<typeof PreviewCardPrimitive.Arrow>;

const PreviewCardArrow = ({ className, ...props }: PreviewCardArrowProps) => (
  <PreviewCardPrimitive.Arrow
    className={cn("fill-white stroke-neutral-200", className)}
    {...props}
  />
);
PreviewCardArrow.displayName = "PreviewCardArrow";

export { 
  PreviewCard, 
  PreviewCardTrigger, 
  PreviewCardContent, 
  PreviewCardPortal,
  PreviewCardArrow 
};