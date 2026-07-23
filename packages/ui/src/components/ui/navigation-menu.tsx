"use client";

import * as React from "react";
import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";
import { cva } from "class-variance-authority";
import { LuChevronDown } from "react-icons/lu";

import { cn } from "../../lib/utils";

type NavigationMenuProps = React.ComponentProps<typeof NavigationMenuPrimitive.Root>;

const NavigationMenu = ({ className, children, ...props }: NavigationMenuProps) => (
  <NavigationMenuPrimitive.Root
    className={cn("relative z-10 flex max-w-max flex-1 items-center justify-center", className)}
    {...props}
  >
    {children}
    <NavigationMenuPrimitive.Portal>
      <NavigationMenuPrimitive.Positioner sideOffset={10} collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}>
        <NavigationMenuPrimitive.Popup>
          <NavigationMenuViewport />
        </NavigationMenuPrimitive.Popup>
      </NavigationMenuPrimitive.Positioner>
    </NavigationMenuPrimitive.Portal>
  </NavigationMenuPrimitive.Root>
);
NavigationMenu.displayName = "NavigationMenu";

type NavigationMenuListProps = React.ComponentProps<typeof NavigationMenuPrimitive.List>;

const NavigationMenuList = ({ className, ...props }: NavigationMenuListProps) => (
  <NavigationMenuPrimitive.List
    className={cn("group flex flex-1 list-none items-center justify-center space-x-1", className)}
    {...props}
  />
);
NavigationMenuList.displayName = "NavigationMenuList";

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded bg-transparent px-4 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[popup-open]:bg-neutral-100 data-[popup-open]:text-neutral-900",
);

type NavigationMenuTriggerProps = React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>;

const NavigationMenuTrigger = ({ className, children, ...props }: NavigationMenuTriggerProps) => (
  <NavigationMenuPrimitive.Trigger className={cn(navigationMenuTriggerStyle(), "group", className)} {...props}>
    {children}
    <NavigationMenuPrimitive.Icon className="relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[popup-open]:rotate-180">
      <LuChevronDown aria-hidden="true" />
    </NavigationMenuPrimitive.Icon>
  </NavigationMenuPrimitive.Trigger>
);
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

type NavigationMenuContentProps = React.ComponentProps<typeof NavigationMenuPrimitive.Content>;

const NavigationMenuContent = ({ className, ...props }: NavigationMenuContentProps) => (
  <NavigationMenuPrimitive.Content
    className={cn(
      "data-[starting-style]:animate-in data-[ending-style]:animate-out data-[starting-style]:fade-in data-[ending-style]:fade-out data-[activation-direction=from-end]:slide-in-from-right-52 data-[activation-direction=from-start]:slide-in-from-left-52 data-[ending-style]:slide-out-to-right-52 data-[ending-style]:slide-out-to-left-52 top-0 left-0 w-full md:absolute md:w-auto",
      className,
    )}
    {...props}
  />
);
NavigationMenuContent.displayName = "NavigationMenuContent";

const NavigationMenuLink = NavigationMenuPrimitive.Link;

type NavigationMenuViewportProps = React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>;

const NavigationMenuViewport = ({ className, ...props }: NavigationMenuViewportProps) => (
  <NavigationMenuPrimitive.Viewport
    className={cn(
      "origin-top-center bg-white text-neutral-900 data-[open]:animate-in data-[closed]:animate-out data-[closed]:zoom-out-95 data-[open]:zoom-in-90 relative mt-1.5 h-[var(--popup-height)] w-full overflow-hidden rounded-card border border-neutral-200 shadow-sm md:w-[var(--popup-width)]",
      className,
    )}
    {...props}
  />
);
NavigationMenuViewport.displayName = "NavigationMenuViewport";

type NavigationMenuArrowProps = React.ComponentProps<typeof NavigationMenuPrimitive.Arrow>;

const NavigationMenuArrow = ({ className, ...props }: NavigationMenuArrowProps) => (
  <NavigationMenuPrimitive.Arrow
    className={cn(
      "data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out data-[open]:fade-in top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden",
      className,
    )}
    {...props}
  >
    <div className="bg-white border border-neutral-200 relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm" />
  </NavigationMenuPrimitive.Arrow>
);
NavigationMenuArrow.displayName = "NavigationMenuArrow";

type NavigationMenuBackdropProps = React.ComponentProps<typeof NavigationMenuPrimitive.Backdrop>;

const NavigationMenuBackdrop = ({ className, ...props }: NavigationMenuBackdropProps) => (
  <NavigationMenuPrimitive.Backdrop className={cn("fixed inset-0 z-10 bg-neutral-950/20", className)} {...props} />
);
NavigationMenuBackdrop.displayName = "NavigationMenuBackdrop";

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuArrow,
  NavigationMenuViewport,
  NavigationMenuBackdrop,
};
