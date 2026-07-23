"use client";

import * as React from "react";
import { Combobox } from "@base-ui/react/combobox";
import { cn } from "../../lib/utils";
import { selectTriggerInputClasses } from "../../styles/ui/input";
import ChevronDownIcon from "../../icons/ChevronDownIcon";
import CheckIcon from "../../icons/CheckIcon";

const ComboboxRoot = Combobox.Root;

const ComboboxValue = Combobox.Value;

type ComboboxTriggerProps = React.ComponentProps<typeof Combobox.Trigger>;

const ComboboxTrigger = ({ className, children, ...props }: ComboboxTriggerProps) => (
  <Combobox.Trigger dir="rtl" className={cn(selectTriggerInputClasses, className)} {...props}>
    {children}
    <Combobox.Icon className="flex h-4 w-4 items-center justify-center">
      <ChevronDownIcon />
    </Combobox.Icon>
  </Combobox.Trigger>
);
ComboboxTrigger.displayName = "ComboboxTrigger";

type ComboboxContentProps = React.ComponentProps<typeof Combobox.Popup> & {
  sideOffset?: number;
  align?: "center" | "start" | "end";
  inputPlaceholder?: string;
  container?: HTMLElement | React.RefObject<HTMLElement | null> | null | undefined;
  hideBackdrop?: boolean;
};

const ComboboxContent = ({
  className,
  children,
  sideOffset = 4,
  align = "start",
  // destructured only to keep it off the DOM spread; no input is rendered here
  inputPlaceholder,
  container,
  hideBackdrop = false,
  ...props
}: ComboboxContentProps) => (
  <Combobox.Portal container={container}>
    {!hideBackdrop && <Combobox.Backdrop />}
    <Combobox.Positioner  sideOffset={sideOffset} align={align}>
      <Combobox.Popup
        dir="rtl"
        className={cn(
          "data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50  min-w-[var(--anchor-width)] rounded-card border border-neutral-200 bg-white text-neutral-500 shadow-lg",
          className,
        )}
        {...props}
      >
        <Combobox.List className="scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent max-h-[calc(24rem-3rem)] overflow-auto p-1">
          {children}
        </Combobox.List>
      </Combobox.Popup>
    </Combobox.Positioner>
  </Combobox.Portal>
);
ComboboxContent.displayName = "ComboboxContent";

type ComboboxItemProps = React.ComponentProps<typeof Combobox.Item>;

const ComboboxItem = ({ className, children, ...props }: ComboboxItemProps) => (
  <Combobox.Item
    className={cn(
      "relative flex h-9 w-full cursor-default items-center rounded py-1.5 pr-2 pl-8 text-sm text-neutral-600 outline-none select-none focus:bg-neutral-100 focus:text-neutral-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-800 data-[selected]:bg-primary-50 data-[selected]:text-primary-700",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Combobox.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </Combobox.ItemIndicator>
    </span>
    <div>{children}</div>
  </Combobox.Item>
);
ComboboxItem.displayName = "ComboboxItem";

export { ComboboxRoot as Combobox, ComboboxValue, ComboboxTrigger, ComboboxContent, ComboboxItem };
