"use client";

import * as React from "react";
import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar";
import { Menu } from "@base-ui/react/menu";
import { LuCheck, LuChevronRight, LuCircle } from "react-icons/lu";

import { cn } from "../../lib/utils";

const MenubarMenu = Menu.Root;

const MenubarGroup = Menu.Group;

const MenubarPortal = Menu.Portal;

const MenubarSub = Menu.SubmenuRoot;

const MenubarRadioGroup = Menu.RadioGroup;

type MenubarProps = React.ComponentProps<typeof MenubarPrimitive>;

const Menubar = ({ className, ...props }: MenubarProps) => (
  <MenubarPrimitive
    className={cn(
      "flex h-9 items-center space-x-1 rounded border border-neutral-200 bg-white p-1 shadow-sm",
      className
    )}
    {...props}
  />
);
Menubar.displayName = "Menubar";

type MenubarTriggerProps = React.ComponentProps<typeof Menu.Trigger>;

const MenubarTrigger = ({ className, ...props }: MenubarTriggerProps) => (
  <Menu.Trigger
    className={cn(
      "flex cursor-default select-none items-center rounded px-3 py-1 text-sm font-medium text-neutral-700 outline-none focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 data-[open]:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
);
MenubarTrigger.displayName = "MenubarTrigger";

type MenubarSubTriggerProps = React.ComponentProps<typeof Menu.SubmenuTrigger> & {
  inset?: boolean;
};

const MenubarSubTrigger = ({ className, inset, children, ...props }: MenubarSubTriggerProps) => (
  <Menu.SubmenuTrigger
    className={cn(
      "flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm text-neutral-700 outline-none focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 data-[open]:bg-neutral-100",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <LuChevronRight className="ml-auto h-4 w-4" />
  </Menu.SubmenuTrigger>
);
MenubarSubTrigger.displayName = "MenubarSubTrigger";

type MenubarSubContentProps = React.ComponentProps<typeof Menu.Popup>;

const MenubarSubContent = ({ className, ...props }: MenubarSubContentProps) => (
  <Menu.Portal>
    <Menu.Positioner alignOffset={-4}>
      <Menu.Popup
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-card border border-neutral-200 bg-white p-1 text-neutral-700 shadow-lg data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </Menu.Positioner>
  </Menu.Portal>
);
MenubarSubContent.displayName = "MenubarSubContent";

type MenubarContentProps = React.ComponentProps<typeof Menu.Popup> & {
  align?: "start" | "center" | "end";
  alignOffset?: number;
  sideOffset?: number;
};

const MenubarContent = ({ 
  className, 
  align = "start", 
  alignOffset = -2, 
  sideOffset = 6, 
  ...props 
}: MenubarContentProps) => (
  <Menu.Portal>
    <Menu.Positioner
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
    >
      <Menu.Popup
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-card border border-neutral-200 bg-white p-1 text-neutral-700 shadow-lg data-[open]:animate-in data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </Menu.Positioner>
  </Menu.Portal>
);
MenubarContent.displayName = "MenubarContent";

type MenubarItemProps = React.ComponentProps<typeof Menu.Item> & {
  inset?: boolean;
};

const MenubarItem = ({ className, inset, ...props }: MenubarItemProps) => (
  <Menu.Item
    className={cn(
      "relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm text-neutral-700 outline-none focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
);
MenubarItem.displayName = "MenubarItem";

type MenubarCheckboxItemProps = React.ComponentProps<typeof Menu.CheckboxItem>;

const MenubarCheckboxItem = ({ className, children, checked, ...props }: MenubarCheckboxItemProps) => (
  <Menu.CheckboxItem
    className={cn(
      "relative flex cursor-default select-none items-center rounded py-1.5 pl-8 pr-2 text-sm text-neutral-700 outline-none focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
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
MenubarCheckboxItem.displayName = "MenubarCheckboxItem";

type MenubarRadioItemProps = React.ComponentProps<typeof Menu.RadioItem>;

const MenubarRadioItem = ({ className, children, ...props }: MenubarRadioItemProps) => (
  <Menu.RadioItem
    className={cn(
      "relative flex cursor-default select-none items-center rounded py-1.5 pl-8 pr-2 text-sm text-neutral-700 outline-none focus:bg-neutral-100 data-[highlighted]:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
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
MenubarRadioItem.displayName = "MenubarRadioItem";

type MenubarLabelProps = React.ComponentProps<typeof Menu.GroupLabel> & {
  inset?: boolean;
};

const MenubarLabel = ({ className, inset, ...props }: MenubarLabelProps) => (
  <Menu.GroupLabel
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
);
MenubarLabel.displayName = "MenubarLabel";

type MenubarSeparatorProps = React.ComponentProps<typeof Menu.Separator>;

const MenubarSeparator = ({ className, ...props }: MenubarSeparatorProps) => (
  <Menu.Separator
    className={cn("-mx-1 my-1 h-px bg-neutral-200", className)}
    {...props}
  />
);
MenubarSeparator.displayName = "MenubarSeparator";

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-neutral-400",
        className
      )}
      {...props}
    />
  );
};
MenubarShortcut.displayName = "MenubarShortcut";

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
};