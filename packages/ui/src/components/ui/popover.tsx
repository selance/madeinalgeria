"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "../../lib/utils";
import { selectTriggerInputClasses } from "../../styles/ui/input";

const Popover = PopoverPrimitive.Root;

type PopoverTriggerProps = React.ComponentProps<typeof PopoverPrimitive.Trigger>;

const PopoverTrigger = ({ className, children, ...props }: PopoverTriggerProps) => (
  <PopoverPrimitive.Trigger dir="rtl" className={cn(selectTriggerInputClasses, className)} {...props}>
    {children}
  </PopoverPrimitive.Trigger>
);
PopoverTrigger.displayName = "PopoverTrigger";

type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Popup> & {
  align?: "center" | "start" | "end";
  sideOffset?: number;
  side?: "top" | "right" | "bottom" | "left";
  ref?: React.Ref<HTMLDivElement>;
};

const PopoverContent = ({
  className,
  align = "center",
  sideOffset = 4,
  side = "bottom",
  ref,
  ...props
}: PopoverContentProps) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Positioner align={align} sideOffset={sideOffset} side={side}>
      <PopoverPrimitive.Popup
        ref={ref}
        className={cn(
          "overflow-visible data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] rounded-card border border-neutral-200 p-3 bg-white text-neutral-500 shadow-lg",
          "min-w-[var(--anchor-width)] data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        {...props}
      >
        {/* // TODO I really want to this to work correctly in the future */}
        {/* <PopoverArrow className={"bg-white data-[side=bottom]:rotate-0 data-[side=bottom]:-top-[8px] data-[side=right]:-right-[13px] data-[side=right]:-rotate-90 data-[side=top]:-bottom-[8px] data-[side=top]:rotate-180 data-[side=left]:-rotate-90 data-[side=left]:-top-[-13px]"} >
          <ArrowPopupSvg />
        </PopoverArrow> */}
        {props.children}
      </PopoverPrimitive.Popup>
    </PopoverPrimitive.Positioner>
  </PopoverPrimitive.Portal>
);
PopoverContent.displayName = "PopoverContent";

type PopoverArrowProps = React.ComponentProps<typeof PopoverPrimitive.Arrow>;

const PopoverArrow = ({ className, ...props }: PopoverArrowProps) => (
  <PopoverPrimitive.Arrow className={cn("fill-white stroke-neutral-200", className)} {...props} />
);
PopoverArrow.displayName = "PopoverArrow";

type PopoverTitleProps = React.ComponentProps<typeof PopoverPrimitive.Title>;

const PopoverTitle = ({ className, ...props }: PopoverTitleProps) => (
  <PopoverPrimitive.Title className={cn("font-semibold text-neutral-900", className)} {...props} />
);
PopoverTitle.displayName = "PopoverTitle";

type PopoverDescriptionProps = React.ComponentProps<typeof PopoverPrimitive.Description>;

const PopoverDescription = ({ className, ...props }: PopoverDescriptionProps) => (
  <PopoverPrimitive.Description className={cn("text-sm text-neutral-600", className)} {...props} />
);
PopoverDescription.displayName = "PopoverDescription";

type PopoverCloseProps = React.ComponentProps<typeof PopoverPrimitive.Close>;

const PopoverClose = ({ className, ...props }: PopoverCloseProps) => (
  <PopoverPrimitive.Close
    className={cn(
      "rounded opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
);
PopoverClose.displayName = "PopoverClose";

export { Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverTitle, PopoverDescription, PopoverClose };
