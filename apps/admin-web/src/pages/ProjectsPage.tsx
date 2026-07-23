import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CategoryItem } from "@mia/contracts";
import { formatDateAr } from "@mia/core";
import { useToast } from "@mia/ui/components/toast";
import { Badge } from "@mia/ui/components/badge";
import { Button } from "@mia/ui/components/button";
import { Input } from "@mia/ui/components/input";
import { Textarea } from "@mia/ui/components/textarea";
import { Switch } from "@mia/ui/components/switch";
import { FieldRoot, Label } from "@mia/ui/components/label";
import { Tabs, TabsList, TabsTrigger } from "@mia/ui/components/tabs";
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
import {
  pickName,
  useAdminProjects,
  useProjectCounts,
  useReferenceList,
  useRefreshProject,
  useReviewProject,
  useUpdateProject,
  type ProjectRow,
  type ProjectStatus,
} from "@/lib/hooks";

const PAGE_SIZE = 20;

type StatusTab = ProjectStatus | "all";

const TABS: { value: StatusTab; label: string }[] = [
  { value: "pending", label: "قيد المراجعة" },
  { value: "approved", label: "مقبولة" },
  { value: "rejected", label: "مرفوضة" },
  { value: "all", label: "الكل" },
];

const rejectSchema = z.object({
  reviewNotes: z.string().max(500, "الملاحظات طويلة جداً (500 حرف كحد أقصى)").optional(),
});
type RejectFormValues = z.infer<typeof rejectSchema>;

const editSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "اسم المشروع مطلوب")
    .max(120, "الاسم طويل جداً (120 حرفاً كحد أقصى)"),
  description: z.string().max(2000, "الوصف طويل جداً (2000 حرف كحد أقصى)").optional(),
  descriptionAr: z.string().max(2000, "الوصف طويل جداً (2000 حرف كحد أقصى)").optional(),
  // "" = بدون تصنيف؛ otherwise the category id as a string (Select values are strings).
  categoryId: z.string().optional(),
  isFeatured: z.boolean(),
});
type EditFormValues = z.infer<typeof editSchema>;

/** Toolbar placeholder mirroring the SearchBar pill (search + count). */
function ProjectsToolbarSkeleton() {
  return (
    <div className="rounded-card drop-shadow-default w-full animate-pulse bg-gradient-to-t from-neutral-50 via-neutral-50 to-white p-[1px] sm:h-[60px]">
      <div className="flex h-full w-full flex-col items-center justify-between gap-3 rounded-[19px] bg-neutral-50 px-3 py-3 sm:flex-row sm:py-0">
        <div className="flex w-full items-center gap-3 sm:w-fit">
          <div className="h-10 w-full rounded bg-neutral-200 sm:w-[300px]" />
          <div className="size-11 rounded bg-neutral-200" />
        </div>
        <div className="h-4 w-24 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === "approved") return <Badge variant="success">مقبول</Badge>;
  if (status === "rejected") return <Badge variant="error">مرفوض</Badge>;
  return <Badge variant="warning">قيد المراجعة</Badge>;
}

/** Grey quote block showing the submitter's notes inside the review dialogs. */
function SubmissionNotes({ project }: { project: ProjectRow | null }) {
  if (!project?.submissionNotes) return null;
  return (
    <div className="rounded bg-neutral-50 p-3 text-sm text-neutral-600">
      <span className="font-medium text-neutral-700">ملاحظات المرسل: </span>
      {project.submissionNotes}
    </div>
  );
}

const ProjectsPage = () => {
  const [tab, setTab] = useState<StatusTab>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState<ProjectRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ProjectRow | null>(null);
  const [editTarget, setEditTarget] = useState<ProjectRow | null>(null);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);

  const toastManager = useToast();
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useAdminProjects({
    status: tab === "all" ? "" : tab,
    q: debouncedSearch,
    page,
    limit: PAGE_SIZE,
  });
  const counts = useProjectCounts();
  const review = useReviewProject();
  const updateProject = useUpdateProject();
  const refresh = useRefreshProject();

  // Category id → Arabic display name (fallback chain handled by pickName).
  const categoriesQuery = useReferenceList("categories");
  const categories = (categoriesQuery.data as CategoryItem[] | undefined) ?? [];
  const categoryNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of categories) map.set(c.id, pickName(c.names, c.slug));
    return map;
  }, [categories]);
  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories]);

  const rejectForm = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reviewNotes: "" },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", description: "", descriptionAr: "", categoryId: "", isFeatured: false },
  });

  // Reset the reject notes each time a new target opens the dialog.
  useEffect(() => {
    if (rejectTarget) rejectForm.reset({ reviewNotes: rejectTarget.reviewNotes ?? "" });
  }, [rejectTarget, rejectForm]);

  // Sync the edit form with the row being edited on open.
  useEffect(() => {
    if (editTarget)
      editForm.reset({
        name: editTarget.name,
        description: editTarget.description ?? "",
        descriptionAr: editTarget.descriptionAr ?? "",
        categoryId: editTarget.categoryId != null ? String(editTarget.categoryId) : "",
        isFeatured: editTarget.isFeatured,
      });
  }, [editTarget, editForm]);

  const countFor = (value: StatusTab): number | null => {
    if (!counts.data) return null;
    if (value === "all") return counts.data.pending + counts.data.approved + counts.data.rejected;
    return counts.data[value];
  };

  const total = data?.pagination.total_count ?? 0;
  const pagination = useMemo(
    () => ({
      page: data?.pagination.page ?? page,
      limit: PAGE_SIZE,
      total_count: total,
      total_pages: data?.pagination.total_pages ?? 1,
    }),
    [data, page, total],
  );

  const onApprove = async () => {
    if (!approveTarget) return;
    try {
      await review.mutateAsync({ id: approveTarget.id, status: "approved" });
      toastManager.add({ title: "تم قبول المشروع", type: "success" });
      setApproveTarget(null);
    } catch {
      toastManager.add({ title: "فشلت العملية", type: "error" });
    }
  };

  const onReject = async (values: RejectFormValues) => {
    if (!rejectTarget) return;
    try {
      await review.mutateAsync({
        id: rejectTarget.id,
        status: "rejected",
        reviewNotes: values.reviewNotes?.trim() || undefined,
      });
      toastManager.add({ title: "تم رفض المشروع", type: "success" });
      setRejectTarget(null);
    } catch {
      toastManager.add({ title: "فشلت العملية", type: "error" });
    }
  };

  const onEdit = async (values: EditFormValues) => {
    if (!editTarget) return;
    try {
      await updateProject.mutateAsync({
        id: editTarget.id,
        body: {
          name: values.name.trim(),
          description: values.description?.trim() || null,
          descriptionAr: values.descriptionAr?.trim() || null,
          categoryId: values.categoryId ? Number(values.categoryId) : null,
          isFeatured: values.isFeatured,
        },
      });
      toastManager.add({ title: "تم حفظ التعديلات", type: "success" });
      setEditTarget(null);
    } catch {
      toastManager.add({ title: "فشل الحفظ", type: "error" });
    }
  };

  const onRefresh = async (project: ProjectRow) => {
    setRefreshingId(project.id);
    try {
      await refresh.mutateAsync(project.id);
      toastManager.add({ title: "تم تحديث بيانات GitHub", type: "success" });
    } catch {
      toastManager.add({ title: "فشل التحديث", type: "error" });
    } finally {
      setRefreshingId(null);
    }
  };

  const columns: ColumnDef<ProjectRow, unknown>[] = [
    {
      header: "المشروع",
      accessorKey: "name",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex items-center gap-2 text-right">
            {project.ownerAvatarUrl ? (
              <img
                src={project.ownerAvatarUrl}
                alt={project.ownerLogin}
                className="size-8 rounded-full"
                loading="lazy"
              />
            ) : (
              <div className="size-8 shrink-0 rounded-full bg-neutral-200" />
            )}
            <div className="flex flex-col">
              <span className="font-medium text-neutral-700">{project.name}</span>
              <a
                href={project.htmlUrl}
                target="_blank"
                rel="noreferrer"
                dir="ltr"
                className="hover:text-primary-600 text-xs text-neutral-500 hover:underline"
              >
                {project.repoFullName}
              </a>
            </div>
          </div>
        );
      },
    },
    {
      header: "النجوم",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-600">{row.original.stars.toLocaleString("ar-DZ")}</span>
      ),
    },
    {
      header: "اللغة",
      cell: ({ row }) => (
        <span dir="ltr" className="text-sm text-neutral-500">
          {row.original.primaryLanguage ?? "—"}
        </span>
      ),
    },
    {
      header: "التصنيف",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500">
          {row.original.categoryId != null
            ? (categoryNames.get(row.original.categoryId) ?? "—")
            : "—"}
        </span>
      ),
    },
    {
      header: "المصدر",
      cell: ({ row }) => (
        <div className="flex flex-col items-center gap-1">
          {row.original.source === "submission" ? (
            <Badge variant="info">إرسال</Badge>
          ) : (
            <Badge variant="soft">استكشاف</Badge>
          )}
          {row.original.submitterEmail && (
            <span dir="ltr" className="text-xs text-neutral-400">
              {row.original.submitterEmail}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "الحالة",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: "تاريخ الإضافة",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500">
          {formatDateAr(row.original.createdAt)}
        </span>
      ),
    },
    {
      header: "إجراءات",
      cell: ({ row }) => {
        const project = row.original;
        const isRefreshing = refreshingId === project.id && refresh.isPending;
        return (
          <div className="flex flex-wrap justify-center gap-1">
            {project.status !== "approved" && (
              <Button size="sm" variant="success-solid" onClick={() => setApproveTarget(project)}>
                قبول
              </Button>
            )}
            {project.status !== "rejected" && (
              <Button size="sm" variant="error-solid" onClick={() => setRejectTarget(project)}>
                رفض
              </Button>
            )}
            <Button size="sm" variant="light-solid" onClick={() => setEditTarget(project)}>
              تعديل
            </Button>
            <Button
              size="sm"
              variant="light-solid"
              disabled={isRefreshing}
              onClick={() => void onRefresh(project)}
            >
              {isRefreshing ? "جارٍ التحديث..." : "تحديث"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Tabs
        value={tab}
        onValueChange={(value: string | null) => {
          if (!value) return;
          setTab(value as StatusTab);
          setPage(1);
        }}
      >
        <TabsList>
          {TABS.map(({ value, label }) => {
            const count = countFor(value);
            return (
              <TabsTrigger key={value} value={value}>
                {label}
                {count !== null && (
                  <span className="rounded bg-neutral-100 px-1.5 text-xs text-neutral-500">
                    {count.toLocaleString("ar-DZ")}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {isLoading && !data ? (
        <ProjectsToolbarSkeleton />
      ) : (
        <SearchBar
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="بحث بالمستودع أو الاسم أو المالك..."
          actions={
            <span className="text-sm text-neutral-500">{total.toLocaleString("ar-DZ")} مشروع</span>
          }
        />
      )}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="لا توجد مشاريع"
      />

      {/* Approve — confirm dialog */}
      <Dialog open={approveTarget !== null} onOpenChange={(open: boolean) => !open && setApproveTarget(null)}>
        <DialogPopup dir="rtl" className="sm:max-w-md">
          <DialogHeader dir="rtl">
            <DialogTitle>قبول المشروع</DialogTitle>
            <DialogDescription>
              سيظهر «{approveTarget?.name}» في الدليل العام بعد القبول.
            </DialogDescription>
          </DialogHeader>
          <div dir="rtl" className="space-y-4">
            <SubmissionNotes project={approveTarget} />
            <div className="flex justify-end gap-2">
              <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>إلغاء</DialogClose>
              <Button size="sm" variant="success-solid" disabled={review.isPending} onClick={() => void onApprove()}>
                {review.isPending ? "جارٍ القبول..." : "تأكيد القبول"}
              </Button>
            </div>
          </div>
        </DialogPopup>
      </Dialog>

      {/* Reject — dialog with optional review notes */}
      <Dialog open={rejectTarget !== null} onOpenChange={(open: boolean) => !open && setRejectTarget(null)}>
        <DialogPopup dir="rtl" className="sm:max-w-md">
          <DialogHeader dir="rtl">
            <DialogTitle>رفض المشروع</DialogTitle>
            <DialogDescription>لن يظهر «{rejectTarget?.name}» في الدليل العام.</DialogDescription>
          </DialogHeader>
          <form dir="rtl" onSubmit={rejectForm.handleSubmit(onReject)} className="space-y-4">
            <SubmissionNotes project={rejectTarget} />
            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="reject-notes">ملاحظات المراجعة (اختياري)</Label>
              <Textarea
                id="reject-notes"
                rows={3}
                placeholder="سبب الرفض..."
                data-invalid={rejectForm.formState.errors.reviewNotes}
                disabled={review.isPending}
                {...rejectForm.register("reviewNotes")}
              />
              {rejectForm.formState.errors.reviewNotes && (
                <p className="text-error-600 pr-2.5 text-xs">
                  {rejectForm.formState.errors.reviewNotes.message}
                </p>
              )}
            </FieldRoot>
            <div className="flex justify-end gap-2">
              <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>إلغاء</DialogClose>
              <Button type="submit" size="sm" variant="error-solid" disabled={review.isPending}>
                {review.isPending ? "جارٍ الرفض..." : "تأكيد الرفض"}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </Dialog>

      {/* Edit — canonical form anatomy */}
      <Dialog open={editTarget !== null} onOpenChange={(open: boolean) => !open && setEditTarget(null)}>
        <DialogPopup dir="rtl" className="sm:max-w-lg">
          <DialogHeader dir="rtl">
            <DialogTitle>تعديل المشروع</DialogTitle>
            <DialogDescription dir="ltr" className="text-start">
              {editTarget?.repoFullName}
            </DialogDescription>
          </DialogHeader>
          <form dir="rtl" onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="edit-name">اسم المشروع</Label>
              <Input
                id="edit-name"
                placeholder="اسم المشروع"
                data-invalid={editForm.formState.errors.name}
                disabled={updateProject.isPending}
                {...editForm.register("name")}
              />
              {editForm.formState.errors.name && (
                <p className="text-error-600 pr-2.5 text-xs">{editForm.formState.errors.name.message}</p>
              )}
            </FieldRoot>

            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="edit-description">الوصف (إنجليزية)</Label>
              <Textarea
                id="edit-description"
                rows={3}
                dir="ltr"
                placeholder="Description"
                data-invalid={editForm.formState.errors.description}
                disabled={updateProject.isPending}
                {...editForm.register("description")}
              />
              {editForm.formState.errors.description && (
                <p className="text-error-600 pr-2.5 text-xs">
                  {editForm.formState.errors.description.message}
                </p>
              )}
            </FieldRoot>

            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="edit-description-ar">الوصف بالعربية</Label>
              <Textarea
                id="edit-description-ar"
                rows={3}
                placeholder="وصف عربي يظهر في الصفحات العربية"
                data-invalid={editForm.formState.errors.descriptionAr}
                disabled={updateProject.isPending}
                {...editForm.register("descriptionAr")}
              />
              {editForm.formState.errors.descriptionAr && (
                <p className="text-error-600 pr-2.5 text-xs">
                  {editForm.formState.errors.descriptionAr.message}
                </p>
              )}
            </FieldRoot>

            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="edit-category">التصنيف</Label>
              <Controller
                control={editForm.control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value: string | null) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger id="edit-category" className="w-full" disabled={updateProject.isPending}>
                      <SelectValue>
                        {field.value
                          ? (categoryNames.get(Number(field.value)) ?? "بدون تصنيف")
                          : "بدون تصنيف"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون تصنيف</SelectItem>
                      {activeCategories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {pickName(category.names, category.slug)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FieldRoot>

            <FieldRoot className="flex flex-row items-center justify-between gap-2">
              <Label htmlFor="edit-featured">مشروع مميّز</Label>
              <Controller
                control={editForm.control}
                name="isFeatured"
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">{field.value ? "مميّز" : "عادي"}</span>
                    <Switch
                      id="edit-featured"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={updateProject.isPending}
                    />
                  </div>
                )}
              />
            </FieldRoot>

            <div className="flex justify-end gap-2">
              <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>إلغاء</DialogClose>
              <Button type="submit" size="sm" disabled={updateProject.isPending}>
                {updateProject.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </Dialog>
    </section>
  );
};

export default ProjectsPage;
