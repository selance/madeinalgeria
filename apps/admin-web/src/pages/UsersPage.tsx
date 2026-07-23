import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDateAr } from "@mia/core";
import { useToast } from "@mia/ui/components/toast";
import { Badge } from "@mia/ui/components/badge";
import { Button } from "@mia/ui/components/button";
import { Input } from "@mia/ui/components/input";
import { FieldRoot, Label } from "@mia/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mia/ui/components/select";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@mia/ui/components/dialog";
import { cn, buttonVariants } from "@mia/ui";
import { DataTable } from "@/components/DataTable";
import { SearchBar } from "@/components/SearchBar";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdminUsers, useBanUser, useSetUserRole, useUnbanUser, type AdminUser } from "@/lib/hooks";

const PAGE_SIZE = 20;

type RoleFilter = "" | "user" | "admin";

const banSchema = z.object({
  reason: z.string().max(500, "السبب طويل جداً").optional(),
});
type BanFormValues = z.infer<typeof banSchema>;

/** Toolbar placeholder mirroring the SearchBar pill (search + role filter + count). */
function UsersToolbarSkeleton() {
  return (
    <div className="rounded-card drop-shadow-default w-full animate-pulse bg-gradient-to-t from-neutral-50 via-neutral-50 to-white p-[1px] sm:h-[60px]">
      <div className="flex h-full w-full flex-col items-center justify-between gap-3 rounded-[19px] bg-neutral-50 px-3 py-3 sm:flex-row sm:py-0">
        <div className="flex w-full items-center gap-3 sm:w-fit">
          <div className="h-10 w-full rounded bg-neutral-200 sm:w-[300px]" />
          <div className="h-10 w-[140px] rounded bg-neutral-200" />
          <div className="size-11 rounded bg-neutral-200" />
        </div>
        <div className="h-4 w-24 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("");
  const [page, setPage] = useState(1);
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);

  const toastManager = useToast();
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useAdminUsers(debouncedSearch, role, (page - 1) * PAGE_SIZE, PAGE_SIZE);
  const ban = useBanUser();
  const unban = useUnbanUser();
  const setUserRole = useSetUserRole();

  const banForm = useForm<BanFormValues>({
    resolver: zodResolver(banSchema),
    defaultValues: { reason: "" },
  });

  // Reset the reason field each time a new ban target opens the dialog.
  useEffect(() => {
    if (banTarget) banForm.reset({ reason: "" });
  }, [banTarget, banForm]);

  const onBan = async (values: BanFormValues) => {
    if (!banTarget) return;
    try {
      await ban.mutateAsync({ id: banTarget.id, reason: values.reason?.trim() || undefined });
      toastManager.add({ title: "تم الحظر", type: "success" });
      setBanTarget(null);
    } catch {
      toastManager.add({ title: "فشلت العملية", type: "error" });
    }
  };

  const total = data?.total ?? 0;
  const pagination = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      total_count: total,
      total_pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    }),
    [page, total],
  );

  const act = async (action: Promise<unknown>, ok: string) => {
    try {
      await action;
      toastManager.add({ title: ok, type: "success" });
    } catch {
      toastManager.add({ title: "فشلت العملية", type: "error" });
    }
  };

  const columns: ColumnDef<AdminUser, unknown>[] = [
    {
      header: "المستخدم",
      accessorKey: "email",
      cell: ({ row }) => (
        <div className="text-right">
          <div className="font-medium text-neutral-700">{row.original.name || "—"}</div>
          <div dir="ltr" className="text-xs text-neutral-500">{row.original.email}</div>
        </div>
      ),
    },
    {
      header: "الدور",
      cell: ({ row }) =>
        row.original.role === "admin" ? <Badge variant="info">مشرف</Badge> : <Badge variant="soft">مستخدم</Badge>,
    },
    {
      header: "الحالة",
      cell: ({ row }) =>
        row.original.banned ? <Badge variant="error">محظور</Badge> : <Badge variant="success">نشط</Badge>,
    },
    {
      header: "تاريخ التسجيل",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500">
          {formatDateAr(row.original.createdAt)}
        </span>
      ),
    },
    {
      header: "الإجراءات",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex justify-center gap-1">
            {user.banned ? (
              <Button size="sm" variant="light-solid" onClick={() => void act(unban.mutateAsync(user.id), "تم رفع الحظر")}>
                رفع الحظر
              </Button>
            ) : (
              <Button size="sm" variant="error-solid" onClick={() => setBanTarget(user)}>
                حظر
              </Button>
            )}
            <Button
              size="sm"
              variant="light-solid"
              onClick={() =>
                void act(
                  setUserRole.mutateAsync({ id: user.id, role: user.role === "admin" ? "user" : "admin" }),
                  "تم تحديث الدور",
                )
              }
            >
              {user.role === "admin" ? "إزالة الإشراف" : "ترقية لمشرف"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      {isLoading && !data ? (
        <UsersToolbarSkeleton />
      ) : (
        <SearchBar
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="بحث بالبريد الإلكتروني..."
          filters={
            <Select
              value={role}
              onValueChange={(value: string | null) => {
                setRole((value ?? "") as RoleFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue>
                  {role === "admin" ? "المشرفون" : role === "user" ? "المستخدمون" : "كل الأدوار"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">كل الأدوار</SelectItem>
                <SelectItem value="admin">المشرفون</SelectItem>
                <SelectItem value="user">المستخدمون</SelectItem>
              </SelectContent>
            </Select>
          }
          actions={<span className="text-sm text-neutral-500">{total.toLocaleString()} مستخدم</span>}
        />
      )}

      <DataTable
        columns={columns}
        data={data?.users ?? []}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="لا يوجد مستخدمون"
      />

      <Dialog open={banTarget !== null} onOpenChange={(open: boolean) => !open && setBanTarget(null)}>
        <DialogPopup dir="rtl" className="sm:max-w-md">
          <DialogHeader dir="rtl">
            <DialogTitle>حظر المستخدم</DialogTitle>
            <DialogDescription>سيمنع {banTarget?.email} من تسجيل الدخول.</DialogDescription>
          </DialogHeader>
          <form dir="rtl" onSubmit={banForm.handleSubmit(onBan)} className="space-y-4">
            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="ban-reason">سبب الحظر (اختياري)</Label>
              <Input id="ban-reason" placeholder="سبب الحظر" {...banForm.register("reason")} />
              {banForm.formState.errors.reason && (
                <p className="text-error-600 text-xs">{banForm.formState.errors.reason.message}</p>
              )}
            </FieldRoot>
            <div className="flex justify-end gap-2">
              <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>إلغاء</DialogClose>
              <Button type="submit" size="sm" variant="error-solid" disabled={ban.isPending}>
                {ban.isPending ? "جارٍ الحظر..." : "تأكيد الحظر"}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </Dialog>
    </section>
  );
};

export default UsersPage;
