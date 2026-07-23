"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";

import { cn } from "../../lib/utils";
import { selectTriggerInputClasses } from "../../styles/ui/input";
import ChevronDownIcon from "../../icons/ChevronDownIcon";
import CheckIcon from "../../icons/CheckIcon";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

type SelectTriggerProps = React.ComponentProps<typeof SelectPrimitive.Trigger>;

const SelectTrigger = ({ className, children, ...props }: SelectTriggerProps) => (
  <SelectPrimitive.Trigger dir="rtl" className={cn(selectTriggerInputClasses, className)} {...props}>
    {children}
    <SelectPrimitive.Icon className="h-4 w-4 flex justify-center items-center">
      <ChevronDownIcon />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);
SelectTrigger.displayName = "SelectTrigger";

type SelectContentProps = React.ComponentProps<typeof SelectPrimitive.Popup> & {
  position?: "popper" | "item-aligned";
  sideOffset?: number;
  align?: "center" | "start" | "end";
  container?: HTMLElement | ShadowRoot | React.RefObject<HTMLElement | ShadowRoot | null> | null | undefined
};

const SelectContent = ({
  className,
  children,
  position = "popper",
  sideOffset = 4,
  align = "center",
  container,
  ...props
}: SelectContentProps) => (
  <SelectPrimitive.Portal container={container}>
    <SelectPrimitive.Backdrop />
    {/* z-50 on the positioner itself: with z-index auto it paints in DOM order,
        so when portaled into an in-dialog container the popup slides UNDER any
        later sibling that forms a stacking context (e.g. an Input's drop-shadow
        filter) — the ClaimCompanyDialog role-select bug. */}
    <SelectPrimitive.Positioner
      className="z-50"
      sideOffset={sideOffset}
      align={align}
      alignItemWithTrigger={position === "item-aligned"}
    >
      <SelectPrimitive.Popup
        dir="rtl"
        className={cn(
          "data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-60 min-w-[8rem] overflow-auto rounded-card border border-neutral-200 bg-white p-1 text-neutral-500 shadow-lg scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent",
          position === "popper" &&
            "min-w-[var(--anchor-width)] data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        {...props}
      >
        {children}
      </SelectPrimitive.Popup>
    </SelectPrimitive.Positioner>
  </SelectPrimitive.Portal>
);
SelectContent.displayName = "SelectContent";

type SelectLabelProps = React.ComponentProps<typeof SelectPrimitive.GroupLabel>;

const SelectLabel = ({ className, ref, ...props }: SelectLabelProps) => (
  <SelectPrimitive.GroupLabel
    className={cn("py-1.5 pr-2 pl-8 text-sm font-semibold text-neutral-600", className)}
    {...props}
  />
);
SelectLabel.displayName = "SelectLabel";

type SelectItemProps = React.ComponentProps<typeof SelectPrimitive.Item>;

const SelectItem = ({ className, children, ...props }: SelectItemProps) => (
  <SelectPrimitive.Item
    className={cn(
      "relative flex h-9 w-full cursor-default items-center rounded py-1.5 pr-2 pl-8 text-sm text-neutral-600 outline-none select-none focus:bg-neutral-100 focus:text-neutral-800 data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[selected]:bg-primary-50 data-[selected]:text-primary-700",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText className={'line-clamp-1'}>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);
SelectItem.displayName = "SelectItem";

type SelectSeparatorProps = React.ComponentProps<typeof SelectPrimitive.Separator>;

const SelectSeparator = ({ className, ...props }: SelectSeparatorProps) => (
  <SelectPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-neutral-200", className)} {...props} />
);
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};