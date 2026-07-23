import { useState } from "react";
import { Button } from "@mia/ui/components/button";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@mia/ui/components/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@mia/ui/components/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@mia/ui/components/drawer";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@mia/ui/components/alert-dialog";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogClose,
} from "@mia/ui/components/responsive-dialog";
import { useToast } from "@mia/ui/components/toast";
import { buttonVariants, cn } from "@mia/ui";
import { SectionShell } from "./SectionShell";

export function OverlaysSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [responsiveOpen, setResponsiveOpen] = useState(false);
  const toast = useToast();

  return (
    <SectionShell
      id="overlays"
      title="الحوارات والطبقات — Overlays"
      subtitle="Dialog, Sheet, Drawer, AlertDialog, ResponsiveDialog & Toasts"
    >
      <div className="flex flex-wrap gap-3">
        <Button variant="primary-solid" onClick={() => setDialogOpen(true)}>
          فتح Dialog
        </Button>
        <Button variant="dark-outline" onClick={() => setSheetOpen(true)}>
          فتح Sheet
        </Button>
        <Button variant="dark-outline" onClick={() => setDrawerOpen(true)}>
          فتح Drawer
        </Button>
        <Button variant="secondary-outline" onClick={() => setResponsiveOpen(true)}>
          فتح ResponsiveDialog
        </Button>
        <Button variant="error-solid" onClick={() => setAlertOpen(true)}>
          حذف (AlertDialog)
        </Button>
        <Button
          variant="success-outline"
          onClick={() => toast.add({ title: "تم الحفظ بنجاح", type: "success" })}
        >
          Toast نجاح
        </Button>
        <Button
          variant="error-outline"
          onClick={() => toast.add({ title: "تعذّر إتمام العملية", type: "error" })}
        >
          Toast خطأ
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-neutral-800">تعديل الملف الشخصي</DialogTitle>
            <DialogDescription>مثال على حوار مركزي بعنوان ووصف وأزرار.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-neutral-600">ضع هنا محتوى النموذج أو التفاصيل.</p>
          <DialogFooter className="mt-4 gap-2">
            <DialogClose className={cn(buttonVariants({ variant: "light-outline", size: "sm" }))}>
              إلغاء
            </DialogClose>
            <DialogClose className={cn(buttonVariants({ variant: "primary-solid", size: "sm" }))}>
              حفظ
            </DialogClose>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle className="text-neutral-800">لوحة جانبية</SheetTitle>
            <SheetDescription>تنزلق من جانب الشاشة لعرض إعدادات أو تفاصيل.</SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-4">
            <SheetClose className={cn(buttonVariants({ variant: "light-outline", size: "sm" }))}>
              إغلاق
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader className="text-right">
            <DrawerTitle className="text-neutral-800">درج سفلي</DrawerTitle>
            <DrawerDescription>يظهر من أسفل الشاشة، مناسب للأجهزة المحمولة.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose className={cn(buttonVariants({ variant: "light-outline", size: "sm" }))}>
              إغلاق
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Responsive dialog */}
      <ResponsiveDialog open={responsiveOpen} onOpenChange={setResponsiveOpen}>
        <ResponsiveDialogContent className="max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>حوار متجاوب</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              حوار مركزي على سطح المكتب ودرج سفلي على الهاتف — نفس المكوّن.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="mt-4 flex justify-end">
            <ResponsiveDialogClose className={cn(buttonVariants({ variant: "light-outline", size: "sm" }))}>
              إغلاق
            </ResponsiveDialogClose>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Alert dialog */}
      <AlertDialog.Root open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogPopup className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-800">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف العنصر نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogClose>إلغاء</AlertDialogClose>
            <Button
              variant="error-solid"
              size="sm"
              onClick={() => {
                setAlertOpen(false);
                toast.add({ title: "تم الحذف", type: "success" });
              }}
            >
              حذف نهائي
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog.Root>
    </SectionShell>
  );
}
