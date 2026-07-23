"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "../../lib/utils";
import { useIsMobile } from "../../hooks/useIsMobile";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

/**
 * One modal, two presentations: the existing centered Dialog on desktop and a
 * bottom sheet (vaul Drawer) on mobile — the desktop experience is untouched.
 *
 * Big-content edge cases (the vaul footgun): the drawer content is capped at
 * `max-h-[94dvh]` with a `flex-1 overflow-y-auto` body, so tall forms scroll
 * instead of overflowing the viewport, and vaul only starts a dismiss-drag
 * when that body is scrolled to the top. `dvh` (not `vh`) accounts for mobile
 * browser chrome. The optional `contentRef` is attached to a non-scrolling
 * element in BOTH modes, so a Select/Popover portaled into it (via its
 * `container` prop) is never clipped by the scroll area.
 */

const Ctx = React.createContext<{ isMobile: boolean }>({ isMobile: false });
const useResponsive = () => React.useContext(Ctx);

interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  /** Allow dismiss by swipe/overlay (mobile). Default true. */
  dismissible?: boolean;
}

function ResponsiveDialog({ open, onOpenChange, children, dismissible = true }: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  return (
    <Ctx.Provider value={{ isMobile }}>
      {isMobile ? (
        <DrawerPrimitive.Root
          open={open}
          onOpenChange={onOpenChange}
          shouldScaleBackground={false}
          dismissible={dismissible}
        >
          {children}
        </DrawerPrimitive.Root>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      )}
    </Ctx.Provider>
  );
}

function ResponsiveDialogTrigger(props: React.ComponentProps<"button">) {
  const { isMobile } = useResponsive();
  return isMobile ? <DrawerPrimitive.Trigger {...props} /> : <DialogTrigger {...props} />;
}

function ResponsiveDialogClose(props: React.ComponentProps<"button">) {
  const { isMobile } = useResponsive();
  return isMobile ? <DrawerPrimitive.Close {...props} /> : <DialogClose {...props} />;
}

interface ResponsiveDialogContentProps {
  className?: string;
  children: React.ReactNode;
  dir?: "rtl" | "ltr";
  /**
   * Attached to a NON-scrolling element in each mode — pass the same ref to a
   * Select/Popover `container` so its dropdown isn't clipped by the drawer's
   * scroll area.
   */
  contentRef?: React.RefObject<HTMLDivElement | null>;
}

function ResponsiveDialogContent({ className, children, dir = "rtl", contentRef }: ResponsiveDialogContentProps) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <DrawerPrimitive.Content
          ref={contentRef}
          dir={dir}
          aria-describedby={undefined}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[94dvh] flex-col rounded-t-card border-t !border-neutral-200 bg-white outline-none",
            className,
          )}
        >
          {/* Drag handle */}
          <div className="mx-auto mt-3 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-neutral-300" />
          {/* Scroll body — vaul drags to dismiss only when this is at the top.
              Extra bottom padding clears the iOS home indicator. */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    );
  }

  // Desktop is intentionally the original Dialog, unchanged. No overflow/max-h
  // here: DialogPopup has a translate transform (a containing block), so
  // clipping it would cut off a Select/Popover dropdown portaled inside.
  return (
    <DialogPopup dir={dir} className={cn("bg-white p-6", className)}>
      <div ref={contentRef}>{children}</div>
    </DialogPopup>
  );
}

/** Header/Title/Description switch primitives so a11y wiring is correct in each mode. */
function ResponsiveDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <DialogHeader className={className} {...props} />;
}

function ResponsiveDialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  const { isMobile } = useResponsive();
  return isMobile ? (
    <DrawerPrimitive.Title
      className={cn("text-lg leading-none font-semibold tracking-tight text-neutral-900", className)}
    >
      {children}
    </DrawerPrimitive.Title>
  ) : (
    <DialogTitle className={className}>{children}</DialogTitle>
  );
}

function ResponsiveDialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { isMobile } = useResponsive();
  return isMobile ? (
    <DrawerPrimitive.Description className={cn("text-sm text-neutral-500", className)}>
      {children}
    </DrawerPrimitive.Description>
  ) : (
    <DialogDescription className={className}>{children}</DialogDescription>
  );
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
};
