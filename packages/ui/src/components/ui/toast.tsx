"use client";

import * as React from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { Slot } from "radix-ui";
import { LuX } from "react-icons/lu";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { buttonVariants } from "../../styles/ui/buttons";

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = ({ className, ref, ...props }: React.ComponentProps<typeof ToastPrimitive.Viewport>) => (
  <ToastPrimitive.Viewport ref={ref} className={cn(className)} {...props} />
);
ToastViewport.displayName = "ToastViewport";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-card border p-4 pr-6 drop-shadow-default transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full z-[9999]",
  {
    variants: {
      variant: {
        default: "border border-neutral-200 bg-white text-neutral-800",
        destructive: "destructive group border-error-200 bg-error-50 text-error-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = ({
  className,
  variant,
  ref,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>) => {
  return <ToastPrimitive.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />;
};
Toast.displayName = "Toast";

const ToastAction = ({
  className,
  asChild = false,
  ref,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Action> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot.Root : ToastPrimitive.Action;
  return (
    <Comp
      ref={ref}
      className={cn(
        "group-[.destructive]:border-error-200 group-[.destructive]:hover:border-error-300 group-[.destructive]:hover:bg-error-100 group-[.destructive]:hover:text-error-700 group-[.destructive]:focus:ring-error-400 inline-flex h-8 shrink-0 items-center justify-center rounded bg-transparent px-3 text-sm font-medium transition-colors focus:ring-1 focus:outline-none disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
};
ToastAction.displayName = "ToastAction";

const ToastClose = ({
  className,
  asChild = false,
  ref,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Close> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot.Root : ToastPrimitive.Close;
  return (
    <Comp
      ref={ref}
      className={cn(
        "text-neutral-400 hover:text-neutral-600 absolute top-1 right-1 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-error-400 group-[.destructive]:hover:text-error-600 focus:opacity-100 focus:ring-1 focus:outline-none group-[.destructive]:focus:ring-error-400 group-[.destructive]:focus:ring-offset-error-50",
        className,
      )}
      toast-close=""
      {...props}
    >
      {asChild ? props.children : <LuX className="h-4 w-4" />}
    </Comp>
  );
};
ToastClose.displayName = "ToastClose";

const ToastTitle = ({ className, ref, ...props }: React.ComponentProps<typeof ToastPrimitive.Title>) => (
  <ToastPrimitive.Title ref={ref} className={cn("text-sm font-semibold [&+div]:text-xs", className)} {...props} />
);
ToastTitle.displayName = "ToastTitle";

const ToastDescription = ({ className, ref, ...props }: React.ComponentProps<typeof ToastPrimitive.Description>) => (
  <ToastPrimitive.Description ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
);
ToastDescription.displayName = "ToastDescription";

type ToasterProps = React.ComponentProps<typeof ToastProvider>;

const toastManager = ToastPrimitive.createToastManager();

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {props.children}
      <ToastPrimitive.Portal>
        <ToastViewport
          className={
            "fixed top-auto right-auto bottom-[1rem] left-[1rem] z-[99999] mx-0 my-auto w-74 md:bottom-[2rem] md:left-[2rem]"
          }
        >
          <ToastList />
        </ToastViewport>
      </ToastPrimitive.Portal>
    </ToastProvider>
  );
};

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          dir="rtl"
          swipeDirection={"left"}
          className={cn(
            toast.type === "success"
              ? "bg-success-50 !border-success-200 border"
              : toast.type === "error"
                ? "bg-error-50 !border-error-200 border"
                : "border !border-neutral-200 bg-white",
            "Toast relative rounded-card",
          )}
          key={toast.id}
          toast={toast}
        >
          <div className="grid h-full w-full gap-1 rounded-card">
            {toast.title && (
              <ToastTitle
                className={cn(
                  toast.type === "error"
                    ? "text-error-500"
                    : toast.type === "success"
                      ? "text-success-600"
                      : "text-neutral-800",
                )}
              >
                {toast.title}
              </ToastTitle>
            )}
            {toast.description && (
              <ToastDescription
                className={cn(
                  toast.type === "error"
                    ? "text-error-400"
                    : toast.type === "success"
                      ? "text-success-400"
                      : "text-neutral-500",
                )}
              >
                {toast.description}
              </ToastDescription>
            )}
          </div>
          {toast.actionProps && (
            <ToastAction
              {...toast.actionProps}
              className={cn(
                toast.type === "error"
                  ? buttonVariants({ variant: "error-solid" })
                  : toast.type === "success"
                    ? buttonVariants({ variant: "success-solid" })
                    : buttonVariants({ variant: "dark-solid" }),
                "w-fit",
              )}
            />
          )}
          <ToastClose
            className={cn(
              toast.type === "error"
                ? "text-error-500"
                : toast.type === "success"
                  ? "text-success-500"
                  : "text-neutral-500",
              "rounded",
            )}
          />
        </Toast>
      ))}
    </>
  );
}

const useToast = () => {
  return toastManager;
};

export {
  type ToasterProps,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription,
  ToastList,
  Toaster,
  useToast,
};
