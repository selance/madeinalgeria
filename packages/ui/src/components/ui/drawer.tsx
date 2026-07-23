"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "../../lib/utils";

const Drawer = ({ shouldScaleBackground = true, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

type DrawerOverlayProps = React.ComponentProps<typeof DrawerPrimitive.Overlay>;

const DrawerOverlay = ({ className, ...props }: DrawerOverlayProps) => (
  <DrawerPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />
);
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

type DrawerContentProps = React.ComponentProps<typeof DrawerPrimitive.Content>;

const DrawerContent = ({ className, children, ...props }: DrawerContentProps) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-card border border-neutral-200 bg-white",
        className,
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-neutral-300" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
);
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
);
DrawerFooter.displayName = "DrawerFooter";

type DrawerTitleProps = React.ComponentProps<typeof DrawerPrimitive.Title>;

const DrawerTitle = ({ className, ...props }: DrawerTitleProps) => (
  <DrawerPrimitive.Title className={cn("text-lg leading-none font-semibold tracking-tight", className)} {...props} />
);
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

type DrawerDescriptionProps = React.ComponentProps<typeof DrawerPrimitive.Description>;

const DrawerDescription = ({ className, ...props }: DrawerDescriptionProps) => (
  <DrawerPrimitive.Description className={cn("text-sm text-neutral-500", className)} {...props} />
);
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
