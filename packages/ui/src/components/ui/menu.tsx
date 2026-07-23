"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";

import { cn } from "../../lib/utils";
import { LuCheck, LuChevronRight, LuCircle } from "react-icons/lu";

const DropdownMenu = Menu.Root;

const DropdownMenuTrigger = Menu.Trigger;

const DropdownMenuGroup = Menu.Group;

const DropdownMenuPortal = Menu.Portal;

const DropdownMenuSub = Menu.SubmenuRoot;

const DropdownMenuRadioGroup = Menu.RadioGroup;

const DropdownMenuArrow = Menu.Arrow;

const DropdownMenuSubTrigger = ({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof Menu.SubmenuTrigger> & {
  inset?: boolean;
}) => (
  <Menu.SubmenuTrigger
    className={cn(
      "focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 data-[popup-open]:bg-neutral-100 flex cursor-default items-center gap-2 rounded px-2 py-1.5 text-sm text-neutral-700 outline-none select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <LuChevronRight className="ml-auto" />
  </Menu.SubmenuTrigger>
);
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = ({ className, ...props }: React.ComponentProps<typeof Menu.Popup>) => (
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
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

const DropdownMenuContent = ({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof Menu.Popup> & {
  sideOffset?: number;
}) => (
  <Menu.Portal>
    <Menu.Positioner sideOffset={sideOffset}>
      <Menu.Popup
        className={cn(
          "bg-white text-neutral-700 z-50 min-w-[8rem] overflow-hidden rounded-card border border-neutral-200 p-1 shadow-lg",
          "data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        {...props}
      />
    </Menu.Positioner>
  </Menu.Portal>
);
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = ({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof Menu.Item> & {
  inset?: boolean;
}) => (
  <Menu.Item
    className={cn(
      "focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 relative flex cursor-default items-center gap-2 rounded px-2 py-1.5 text-sm text-neutral-700 transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
);
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuCheckboxItem = ({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof Menu.CheckboxItem>) => (
  <Menu.CheckboxItem
    className={cn(
      "focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 relative flex cursor-default items-center rounded py-1.5 pr-2 pl-8 text-sm text-neutral-700 transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

const DropdownMenuRadioItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Menu.RadioItem>) => (
  <Menu.RadioItem
    className={cn(
      "focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 relative flex cursor-default items-center rounded py-1.5 pr-2 pl-8 text-sm text-neutral-700 transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Menu.RadioItemIndicator>
        <LuCircle className="h-2 w-2 fill-current" />
      </Menu.RadioItemIndicator>
    </span>
    {children}
  </Menu.RadioItem>
);
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

const DropdownMenuLabel = ({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof Menu.GroupLabel> & {
  inset?: boolean;
}) => <Menu.GroupLabel className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)} {...props} />;
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = ({ className, ...props }: React.ComponentProps<typeof Menu.Separator>) => (
  <Menu.Separator className={cn("bg-neutral-200 -mx-1 my-1 h-px", className)} {...props} />
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />;
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuArrow,
};
