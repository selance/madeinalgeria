"use client";

import * as React from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";

import { cn } from "../../lib/utils";
import { buttonVariants } from "../../styles/ui/buttons";

const AlertDialogTrigger = AlertDialog.Trigger;

const AlertDialogPortal = AlertDialog.Portal;

const AlertDialogBackdrop = ({ className, ...props }: React.ComponentProps<typeof AlertDialog.Backdrop>) => (
  <AlertDialog.Backdrop
    className={cn(
      "bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50",
      className,
    )}
    {...props}
  />
);
AlertDialogBackdrop.displayName = "AlertDialogBackdrop";

const AlertDialogPopup = ({ className, ...props }: React.ComponentProps<typeof AlertDialog.Popup>) => (
  <AlertDialogPortal>
    <AlertDialogBackdrop />
    <AlertDialog.Popup
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-neutral-200 bg-white p-6 text-neutral-500 shadow-xl duration-100 sm:rounded-card",
        className,
      )}
      {...props}
    />
  </AlertDialogPortal>
);
AlertDialogPopup.displayName = "AlertDialogPopup";

const AlertDialogHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col space-y-2 text-center text-neutral-800 sm:text-left", className)} {...props} />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = ({ className, ...props }: React.ComponentProps<typeof AlertDialog.Title>) => (
  <AlertDialog.Title className={cn("text-lg font-semibold", className)} {...props} />
);
AlertDialogTitle.displayName = "AlertDialogTitle";

const AlertDialogDescription = ({ className, ...props }: React.ComponentProps<typeof AlertDialog.Description>) => (
  <AlertDialog.Description className={cn("text-sm text-neutral-500", className)} {...props} />
);
AlertDialogDescription.displayName = "AlertDialogDescription";

const AlertDialogClose = ({ className, ...props }: React.ComponentProps<typeof AlertDialog.Close>) => (
  <AlertDialog.Close
    className={cn(buttonVariants({ variant: "light-outline", size: "sm" }), "mt-2 sm:mt-0", className)}
    {...props}
  />
);
AlertDialogClose.displayName = "AlertDialogClose";

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogTrigger,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
};
