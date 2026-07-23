"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { LuCheck, LuChevronRight, LuCircle } from "react-icons/lu";

import { cn } from "../../lib/utils";

const ContextMenu = Menu.Root;

type ContextMenuTriggerProps = React.ComponentProps<typeof Menu.Trigger>;

const ContextMenuTrigger = ({ children, ...props }: ContextMenuTriggerProps) => (
  <Menu.Trigger
    {...props}
    onContextMenu={(e) => {
      e.preventDefault();
      // Trigger menu open on right-click
      props.onClick?.(e);
    }}
    onClick={undefined}
  >
    {children}
  </Menu.Trigger>
);
ContextMenuTrigger.displayName = "ContextMenuTrigger";

const ContextMenuGroup = Menu.Group;

const ContextMenuPortal = Menu.Portal;

const ContextMenuSub = Menu.SubmenuRoot;

const ContextMenuRadioGroup = Menu.RadioGroup;

type ContextMenuSubTriggerProps = React.ComponentProps<typeof Menu.SubmenuTrigger> & {
  inset?: boolean;
};

const ContextMenuSubTrigger = ({ className, inset, children, ...props }: ContextMenuSubTriggerProps) => (
  <Menu.SubmenuTrigger
    className={cn(
      "focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 flex cursor-default items-center rounded px-2 py-1.5 text-sm text-neutral-700 outline-none select-none",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <LuChevronRight className="ml-auto h-4 w-4" />
  </Menu.SubmenuTrigger>
);
ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";

type ContextMenuSubContentProps = React.ComponentProps<typeof Menu.Popup>;

const ContextMenuSubContent = ({ className, ...props }: ContextMenuSubContentProps) => (
  <Menu.Portal>
    <Menu.Positioner sideOffset={4}>
      <Menu.Popup
        className={cn(
          "bg-white text-neutral-700 data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-card border border-neutral-200 p-1 shadow-lg",
          className,
        )}
        {...props}
      />
    </Menu.Positioner>
  </Menu.Portal>
);
ContextMenuSubContent.displayName = "ContextMenuSubContent";

type ContextMenuContentProps = React.ComponentProps<typeof Menu.Popup>;

const ContextMenuContent = ({ className, ...props }: ContextMenuContentProps) => (
  <Menu.Portal>
    <Menu.Positioner>
      <Menu.Popup
        className={cn(
          "bg-white text-neutral-700 data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-card border border-neutral-200 p-1 shadow-lg",
          className,
        )}
        {...props}
      />
    </Menu.Positioner>
  </Menu.Portal>
);
ContextMenuContent.displayName = "ContextMenuContent";

type ContextMenuItemProps = React.ComponentProps<typeof Menu.Item> & {
  inset?: boolean;
};

const ContextMenuItem = ({ className, inset, ...props }: ContextMenuItemProps) => (
  <Menu.Item
    className={cn(
      "focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 relative flex cursor-default items-center rounded px-2 py-1.5 text-sm text-neutral-700 outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
);
ContextMenuItem.displayName = "ContextMenuItem";

type ContextMenuCheckboxItemProps = React.ComponentProps<typeof Menu.CheckboxItem>;

const ContextMenuCheckboxItem = ({ className, children, checked, ...props }: ContextMenuCheckboxItemProps) => (
  <Menu.CheckboxItem
    className={cn(
      "focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 relative flex cursor-default items-center rounded py-1.5 pr-2 pl-8 text-sm text-neutral-700 outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Menu.CheckboxItemIndicator>
        <LuCheck className="h-4 w-4" />
      </Menu.CheckboxItemIndicator>
    </span>
    {children}
  </Menu.CheckboxItem>
);
ContextMenuCheckboxItem.displayName = "ContextMenuCheckboxItem";

type ContextMenuRadioItemProps = React.ComponentProps<typeof Menu.RadioItem>;

const ContextMenuRadioItem = ({ className, children, ...props }: ContextMenuRadioItemProps) => (
  <Menu.RadioItem
    className={cn(
      "focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 relative flex cursor-default items-center rounded py-1.5 pr-2 pl-8 text-sm text-neutral-700 outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Menu.RadioItemIndicator>
        <LuCircle className="h-4 w-4 fill-current" />
      </Menu.RadioItemIndicator>
    </span>
    {children}
  </Menu.RadioItem>
);
ContextMenuRadioItem.displayName = "ContextMenuRadioItem";

type ContextMenuLabelProps = React.ComponentProps<typeof Menu.GroupLabel> & {
  inset?: boolean;
};

const ContextMenuLabel = ({ className, inset, ...props }: ContextMenuLabelProps) => (
  <Menu.GroupLabel
    className={cn("text-neutral-900 px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props}
  />
);
ContextMenuLabel.displayName = "ContextMenuLabel";

type ContextMenuSeparatorProps = React.ComponentProps<typeof Menu.Separator>;

const ContextMenuSeparator = ({ className, ...props }: ContextMenuSeparatorProps) => (
  <Menu.Separator className={cn("bg-neutral-200 -mx-1 my-1 h-px", className)} {...props} />
);
ContextMenuSeparator.displayName = "ContextMenuSeparator";

const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("text-neutral-400 ml-auto text-xs tracking-widest", className)} {...props} />;
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
