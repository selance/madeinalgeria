import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@mia/ui/components/toast";
import { Badge } from "@mia/ui/components/badge";
import { Button } from "@mia/ui/components/button";
import { Card } from "@mia/ui/components/card";
import { Input } from "@mia/ui/components/input";
import { FieldRoot, Label } from "@mia/ui/components/label";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@mia/ui/components/dialog";
import { Switch } from "@mia/ui/components/switch";
import { Tabs, TabsList, TabsTrigger } from "@mia/ui/components/tabs";
import { PaginationControls } from "@mia/ui/components/pagination";
import { cn, buttonVariants } from "@mia/ui";
import { SearchBar } from "@/components/SearchBar";
import { paginateClientSide } from "@/lib/paginate";
import { pickName, useReferenceList, useReferenceMutations, type ReferenceEntity } from "@/lib/hooks";

const refSchema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب"),
  // Categories only — ignored for the other entities. `coerce` makes the input
  // (string from the number field) differ from the output (number), so the
  // form is typed with both z.input and z.output below.
  sortOrder: z.coerce.number().int("رقم صحيح").optional(),
  isActive: z.boolean().optional(),
});
type RefFormInput = z.input<typeof refSchema>;
type RefFormValues = z.output<typeof refSchema>;

/** List placeholder mirroring the reference rows (id badge + name + actions). */
function ReferenceListSkeleton() {
  return (
    <Card className="animate-pulse divide-y divide-neutral-100 p-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="size-6 rounded bg-neutral-200" />
            <div className="h-4 w-40 rounded bg-neutral-200" />
          </div>
          <div className="flex gap-1">
            <div className="h-8 w-16 rounded bg-neutral-200" />
            <div className="h-8 w-14 rounded bg-neutral-200" />
          </div>
        </div>
      ))}
    </Card>
  );
}

const TABS: { value: ReferenceEntity; label: string }[] = [
  { value: "categories", label: "الفئات" },
  { value: "states", label: "الولايات" },
  { value: "countries", label: "الدول" },
  { value: "languages", label: "اللغات" },
];

interface RefItem {
  id: number;
  names?: Record<string, string>;
  name?: string;
  code?: string | null;
  countryId?: number;
  // Categories only.
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * Translated entities (categories/natures/legal-forms) create with
 * `translations: [{languageId, name}]`; countries/states/languages have their
 * own shapes — creation for those is rarer and kept minimal (ar translation).
 */
const ReferencePage = () => {
  const [entity, setEntity] = useState<ReferenceEntity>("categories");
  const [editTarget, setEditTarget] = useState<RefItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  const toastManager = useToast();

  const form = useForm<RefFormInput, unknown, RefFormValues>({
    resolver: zodResolver(refSchema),
    defaultValues: { name: "", sortOrder: 0, isActive: true },
  });

  // Algeria's states need its countryId — resolve from the countries list.
  const countries = useReferenceList("countries");
  const dzId = useMemo(
    () => (countries.data as RefItem[] | undefined)?.find((c) => c.code?.toLowerCase() === "dz")?.id,
    [countries.data],
  );

  const list = useReferenceList(entity, entity === "states" ? dzId : undefined);
  const mutations = useReferenceMutations(entity);
  const translated = entity === "categories";
  const isCategory = entity === "categories";

  const filtered = useMemo(() => {
    const all = (list.data as RefItem[] | undefined) ?? [];
    if (!filter.trim()) return all;
    const q = filter.trim().toLowerCase();
    return all.filter((item) => pickName(item.names, item.name ?? "").toLowerCase().includes(q));
  }, [list.data, filter]);

  const { items, pagination } = paginateClientSide(filtered, page, 20);

  const dialogOpen = createOpen || editTarget !== null;

  // Sync the form with the row being edited (or blank for create) on open.
  useEffect(() => {
    if (dialogOpen)
      form.reset({
        name: editTarget ? pickName(editTarget.names, editTarget.name ?? "") : "",
        sortOrder: editTarget?.sortOrder ?? 0,
        isActive: editTarget?.isActive ?? true,
      });
  }, [dialogOpen, editTarget, form]);

  const isSaving = mutations.create.isPending || mutations.update.isPending;

  const onSubmit = async (values: RefFormValues) => {
    const name = values.name.trim();
    // Category edit sends sortOrder/isActive too (slug is server-managed and
    // never sent). Category create is name-only — the slug is auto-generated.
    const body =
      isCategory && editTarget
        ? {
            translations: [{ languageId: 2, name }],
            sortOrder: values.sortOrder ?? 0,
            isActive: values.isActive ?? true,
          }
        : translated
          ? { translations: [{ languageId: 2, name }] }
          : entity === "states"
            ? { countryId: dzId, translations: [{ languageId: 2, name }] }
            : { code: name.toLowerCase().slice(0, 2), translations: [{ languageId: 2, name }] };
    try {
      if (editTarget) await mutations.update.mutateAsync({ id: editTarget.id, body });
      else await mutations.create.mutateAsync(body);
      toastManager.add({ title: "تم الحفظ", type: "success" });
      setCreateOpen(false);
      setEditTarget(null);
    } catch {
      toastManager.add({ title: "فشل الحفظ — تحقق من الحقول", type: "error" });
    }
  };

  const remove = async (id: number) => {
    try {
      await mutations.remove.mutateAsync(id);
      toastManager.add({ title: "تم الحذف", type: "success" });
    } catch {
      toastManager.add({ title: "تعذر الحذف (قد يكون العنصر مستخدماً)", type: "error" });
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <Tabs
        value={entity}
        onValueChange={(value: string | null) => {
          if (!value) return;
          setEntity(value as ReferenceEntity);
          setFilter("");
          setPage(1);
        }}
      >
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <SearchBar
        value={filter}
        onValueChange={(value) => {
          setFilter(value);
          setPage(1);
        }}
        placeholder="تصفية بالاسم..."
        actions={
          <>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              إضافة
            </Button>
            <span className="text-sm text-neutral-500">{filtered.length} عنصر</span>
          </>
        }
      />

      {list.isLoading ? (
        <ReferenceListSkeleton />
      ) : (
        <>
          <Card className="divide-y divide-neutral-100 p-0">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <Badge variant="soft">{item.id}</Badge>
                  <span className="text-neutral-700">{pickName(item.names, item.name ?? "—")}</span>
                  {item.code && <span dir="ltr" className="text-xs text-neutral-400">{item.code}</span>}
                  {isCategory && item.slug && (
                    <span dir="ltr" className="font-mono text-xs text-neutral-400">
                      {item.slug}
                    </span>
                  )}
                  {isCategory && (
                    <Badge variant={item.isActive ? "success" : "soft"}>
                      {item.isActive ? "نشطة" : "معطّلة"}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="light-solid" onClick={() => setEditTarget(item)}>
                    تعديل
                  </Button>
                  <Button size="sm" variant="error-solid" onClick={() => void remove(item.id)}>
                    حذف
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="p-8 text-center text-neutral-400">لا توجد عناصر</p>}
          </Card>
          <PaginationControls pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setCreateOpen(false);
            setEditTarget(null);
          }
        }}
      >
        <DialogPopup dir="rtl" className="sm:max-w-md">
          <DialogHeader dir="rtl">
            <DialogTitle>{editTarget ? "تعديل العنصر" : "إضافة عنصر"}</DialogTitle>
          </DialogHeader>
          <form dir="rtl" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="ref-name">الاسم بالعربية</Label>
              <Input
                id="ref-name"
                placeholder="الاسم بالعربية"
                data-invalid={form.formState.errors.name}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-error-600 text-xs">{form.formState.errors.name.message}</p>
              )}
              <p className="text-xs text-neutral-400">
                يتم الحفظ كترجمة عربية. التعديلات تنعكس على الموقع العام خلال دقيقة تقريباً (كاش KV).
              </p>
            </FieldRoot>

            {isCategory && editTarget && (
              <>
                {editTarget.slug && (
                  <FieldRoot className="flex flex-col gap-2">
                    <Label>المعرّف (slug)</Label>
                    <span dir="ltr" className="font-mono text-sm text-neutral-400">
                      {editTarget.slug}
                    </span>
                    <p className="text-xs text-neutral-400">ثابت ولا يتغيّر عند التعديل.</p>
                  </FieldRoot>
                )}
                <FieldRoot className="flex flex-col gap-2">
                  <Label htmlFor="ref-sort-order">الترتيب</Label>
                  <Input
                    id="ref-sort-order"
                    type="number"
                    dir="ltr"
                    data-invalid={form.formState.errors.sortOrder}
                    {...form.register("sortOrder")}
                  />
                  {form.formState.errors.sortOrder && (
                    <p className="text-error-600 text-xs">{form.formState.errors.sortOrder.message}</p>
                  )}
                </FieldRoot>
                <FieldRoot className="flex flex-row items-center justify-between gap-2">
                  <Label htmlFor="ref-is-active">الحالة</Label>
                  <Controller
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-500">
                          {field.value ? "نشطة" : "معطّلة"}
                        </span>
                        <Switch
                          id="ref-is-active"
                          checked={field.value ?? true}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </FieldRoot>
              </>
            )}

            <div className="flex justify-end gap-2">
              <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>إلغاء</DialogClose>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </Dialog>
    </section>
  );
};

export default ReferencePage;
