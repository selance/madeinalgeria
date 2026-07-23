"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { LuX } from "react-icons/lu";

import { cn } from "../../lib/utils";

const Sheet = Dialog.Root;

const SheetTrigger = Dialog.Trigger;

const SheetClose = Dialog.Close;

const SheetPortal = Dialog.Portal;

type SheetOverlayProps = React.ComponentProps<typeof Dialog.Backdrop>;

const SheetOverlay = ({ className, ...props }: SheetOverlayProps) => (
  <Dialog.Backdrop
    className={cn(
      "data-[open]:bg-black/40 data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[starting-style]:animate-in data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[starting-style]:fade-in-0 fixed inset-0 z-50 transition-all data-[closed]:bg-transparent",
      className,
    )}
    {...props}
  />
);
SheetOverlay.displayName = "SheetOverlay";

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-white border-neutral-200 p-6 shadow-lg transition ease-in-out data-[closed]:duration-300 data-[open]:duration-500 data-[open]:animate-in data-[closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[closed]:slide-out-to-top data-[open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[closed]:slide-out-to-bottom data-[open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[closed]:slide-out-to-left data-[open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[closed]:slide-out-to-right data-[open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

type SheetContentProps = React.ComponentProps<typeof Dialog.Popup> & VariantProps<typeof sheetVariants>;

const SheetContent = ({ side = "right", className, children, ...props }: SheetContentProps) => (
  <SheetPortal>
    <SheetOverlay />
    <Dialog.Popup className={cn(sheetVariants({ side }), className)} {...props}>
      <Dialog.Close className="absolute top-4 right-4 rounded text-neutral-500 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none data-[open]:bg-neutral-100">
        <LuX className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Dialog.Close>
      {children}
    </Dialog.Popup>
  </SheetPortal>
);
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
SheetFooter.displayName = "SheetFooter";

type SheetTitleProps = React.ComponentProps<typeof Dialog.Title>;
const SheetTitle = ({ className, ...props }: SheetTitleProps) => (
  <Dialog.Title className={cn("text-lg font-semibold text-neutral-900", className)} {...props} />
);
SheetTitle.displayName = "SheetTitle";

type SheetDescriptionProps = React.ComponentProps<typeof Dialog.Description>;

const SheetDescription = ({ className, ...props }: SheetDescriptionProps) => (
  <Dialog.Description className={cn("text-sm text-neutral-500", className)} {...props} />
);
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
