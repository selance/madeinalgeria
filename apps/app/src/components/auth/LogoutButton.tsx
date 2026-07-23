"use client";

import { useState } from "react";
import { Button } from "@mia/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@mia/ui/components/dialog";
import { SidebarMenuButton } from "@mia/ui/components/sidebar";
import LogoutIcon from "@mia/ui/icons/LogoutIcon";
import { useLogout } from "@/hooks/useLogout";
import { cn } from "@mia/ui";
import { buttonVariants } from "@mia/ui";

interface LogoutButtonProps {
  variant?: "sidebar" | "button";
  redirectTo?: string;
}

export function LogoutButton({ variant = "sidebar", redirectTo = "/" }: LogoutButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { logout, isLoggingOut, error } = useLogout();

  const handleLogout = async () => {
    setIsConfirmOpen(false);
    await logout(redirectTo);
  };

  const buttonContent = (
    <>
      <LogoutIcon
        className={`size-4 transition-all duration-200 ${
          isLoggingOut ? "fill-error-500 animate-spin" : "fill-neutral-500"
        }`}
      />
      <span className={isLoggingOut ? "text-error-500" : ""}>
        {isLoggingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
      </span>
    </>
  );

  if (variant === "button") {
    return (
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogTrigger render={<Button variant="light-ghost" disabled={isLoggingOut} size="sm" className="w-full justify-start gap-2">{buttonContent}</Button>} />
        <DialogPopup dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد تسجيل الخروج</DialogTitle>
            <DialogDescription>هل أنت متأكد من أنك تريد تسجيل الخروج من حسابك؟</DialogDescription>
          </DialogHeader>
          {error && <div className="text-error-600 bg-error-50 rounded-lg p-3 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>إلغاء</DialogClose>
            <Button variant="error-solid" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
            </Button>
          </div>
        </DialogPopup>
      </Dialog>
    );
  }

  return (
    <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <DialogTrigger render={<SidebarMenuButton variant={'simple'} disabled={isLoggingOut}>{buttonContent}</SidebarMenuButton>} />
      <DialogPopup dir="rtl" className="sm:max-w-md">
        <DialogHeader dir="rtl">
          <DialogTitle>تأكيد تسجيل الخروج</DialogTitle>
          <DialogDescription>هل أنت متأكد من أنك تريد تسجيل الخروج من حسابك؟</DialogDescription>
        </DialogHeader>
        {error && <div className="text-error-600 bg-error-50 rounded-lg p-3 text-sm">{error}</div>}
        <div className="flex justify-end gap-2 w-full">
          <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>إلغاء</DialogClose>
          <Button variant="error-solid" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}