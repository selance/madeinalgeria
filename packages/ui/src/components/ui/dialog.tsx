"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { cn } from "../../lib/utils";
import CloseIcon from "../../icons/CloseIcon";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

type DialogBackdropProps = React.ComponentProps<typeof DialogPrimitive.Backdrop>;

const DialogBackdrop = ({ className, ...props }: DialogBackdropProps) => (
  <DialogPrimitive.Backdrop
    className={cn(
      "data-[open]:bg-black/40 data-[starting-style]:animate-in data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[starting-style]:fade-in-0 fixed inset-0 z-50 transition-all data-[closed]:bg-transparent",
      className,
    )}
    {...props}
  />
);
DialogBackdrop.displayName = DialogPrimitive.Backdrop.displayName;

type DialogPopupProps = React.ComponentProps<typeof DialogPrimitive.Popup>;

const DialogPopup = ({ className, children, dir = "rtl", ...props }: DialogPopupProps) => (
  <DialogPortal>
    <DialogBackdrop />
    <DialogPrimitive.Popup
      className={cn(
        "data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[closed]:slide-out-to-left-1/2 data-[closed]:slide-out-to-top-[48%] data-[open]:slide-in-from-left-1/2 data-[open]:slide-in-from-top-[48%] shadow-xl sm:rounded-card fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-neutral-200 bg-neutral-50 p-3 duration-200",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          dir === "rtl" ? "left-4" : "right-4",
          "absolute top-4 rounded opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none data-[open]:bg-neutral-100 data-[open]:text-neutral-600",
        )}
      >
        <CloseIcon className="h-4 w-4 fill-neutral-500" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Popup>
  </DialogPortal>
);
DialogPopup.displayName = DialogPrimitive.Popup.displayName;

const DialogHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-start", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

type DialogTitleProps = React.ComponentProps<typeof DialogPrimitive.Title>;

const DialogTitle = ({ className, ...props }: DialogTitleProps) => (
  <DialogPrimitive.Title className={cn("text-lg leading-none font-semibold tracking-tight", className)} {...props} />
);
DialogTitle.displayName = DialogPrimitive.Title.displayName;

type DialogDescriptionProps = React.ComponentProps<typeof DialogPrimitive.Description>;

const DialogDescription = ({ className, ...props }: DialogDescriptionProps) => (
  <DialogPrimitive.Description className={cn("text-sm text-neutral-500", className)} {...props} />
);
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogBackdrop,
  DialogTrigger,
  DialogClose,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
