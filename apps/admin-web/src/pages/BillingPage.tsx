import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDateAr } from "@mia/core";
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
import { Tabs, TabsList, TabsTrigger } from "@mia/ui/components/tabs";
import { PaginationControls } from "@mia/ui/components/pagination";
import { cn, buttonVariants } from "@mia/ui";
import { SearchBar } from "@/components/SearchBar";
import { paginateClientSide } from "@/lib/paginate";
import { useBilling } from "@/lib/hooks";

type Tab = "plans" | "subscriptions" | "invoices";

const planSchema = z.object({
  name: z.string().trim().min(1, "اسم الخطة مطلوب"),
  price: z.string().regex(/^\d+(\.\d+)?$/, "أدخل سعراً صحيحاً"),
  interval: z.enum(["monthly", "yearly"]),
});
type PlanFormValues = z.infer<typeof planSchema>;

/** Content placeholder mirroring the active tab (plan cards grid or a rows list). */
function BillingContentSkeleton({ tab }: { tab: Tab }) {
  if (tab === "plans") {
    return (
      <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 rounded bg-neutral-200" />
              <div className="h-6 w-14 rounded-full bg-neutral-200" />
            </div>
            <div className="h-7 w-20 rounded bg-neutral-200" />
            <div className="h-4 w-3/4 rounded bg-neutral-200" />
            <div className="mt-2 h-8 w-full rounded bg-neutral-200" />
          </Card>
        ))}
      </div>
    );
  }
  return (
    <Card className="animate-pulse divide-y divide-neutral-100 p-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div className="space-y-2">
            <div className="h-4 w-48 rounded bg-neutral-200" />
            <div className="h-3 w-32 rounded bg-neutral-200" />
          </div>
          <div className="h-6 w-16 rounded-full bg-neutral-200" />
        </div>
      ))}
    </Card>
  );
}

const BillingPage = () => {
  const [tab, setTab] = useState<Tab>("plans");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [planOpen, setPlanOpen] = useState(false);
  const toastManager = useToast();
  const billing = useBilling();

  const planForm = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: "", price: "0", interval: "monthly" },
  });

  const q = filter.trim().toLowerCase();
  const plans = useMemo(
    () => (billing.plans.data ?? []).filter((p) => !q || p.name.toLowerCase().includes(q)),
    [billing.plans.data, q],
  );
  const subscriptions = useMemo(
    () => (billing.subscriptions.data ?? []).filter((s) => !q || s.userId.toLowerCase().includes(q)),
    [billing.subscriptions.data, q],
  );
  const invoices = useMemo(
    () => (billing.invoices.data ?? []).filter((i) => !q || String(i.id).includes(q)),
    [billing.invoices.data, q],
  );

  const plansPage = paginateClientSide(plans, page, 12);
  const subsPage = paginateClientSide(subscriptions, page, 20);
  const invoicesPage = paginateClientSide(invoices, page, 20);
  const activePagination =
    tab === "plans" ? plansPage.pagination : tab === "subscriptions" ? subsPage.pagination : invoicesPage.pagination;

  const activeLoading =
    tab === "plans"
      ? billing.plans.isLoading
      : tab === "subscriptions"
        ? billing.subscriptions.isLoading
        : billing.invoices.isLoading;

  const resetTab = (next: Tab) => {
    setTab(next);
    setFilter("");
    setPage(1);
  };

  // Reset the plan form whenever the dialog opens.
  useEffect(() => {
    if (planOpen) planForm.reset({ name: "", price: "0", interval: "monthly" });
  }, [planOpen, planForm]);

  const createPlan = async (values: PlanFormValues) => {
    try {
      await billing.createPlan.mutateAsync({
        name: values.name.trim(),
        price: Number(values.price) || 0,
        interval: values.interval,
        features: [],
        isActive: true,
      });
      toastManager.add({ title: "تم إنشاء الخطة", type: "success" });
      setPlanOpen(false);
    } catch {
      toastManager.add({ title: "فشل الإنشاء", type: "error" });
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <Tabs value={tab} onValueChange={(value: string | null) => value && resetTab(value as Tab)}>
        <TabsList>
          <TabsTrigger value="plans">الخطط</TabsTrigger>
          <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
        </TabsList>
      </Tabs>

      <SearchBar
        value={filter}
        onValueChange={(value) => {
          setFilter(value);
          setPage(1);
        }}
        placeholder={
          tab === "plans" ? "ابحث عن خطة..." : tab === "subscriptions" ? "بحث بمعرّف المستخدم..." : "بحث برقم الفاتورة..."
        }
        actions={
          tab === "plans" ? (
            <Button size="sm" onClick={() => setPlanOpen(true)}>
              إضافة خطة
            </Button>
          ) : undefined
        }
      />

      {activeLoading && <BillingContentSkeleton tab={tab} />}

      {!activeLoading && tab === "plans" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plansPage.items.map((plan) => (
            <Card key={plan.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-700">{plan.name}</h3>
                <Badge variant={plan.isActive ? "success" : "soft"}>{plan.isActive ? "مفعّلة" : "معطّلة"}</Badge>
              </div>
              <div className="text-primary-500 text-2xl font-bold">
                {plan.price}
                <span className="text-sm text-neutral-400"> / {plan.interval === "monthly" ? "شهر" : "سنة"}</span>
              </div>
              {plan.description && <p className="text-sm text-neutral-500">{plan.description}</p>}
              <Button
                size="sm"
                variant="light-solid"
                className="mt-auto"
                onClick={() =>
                  void billing.updatePlan
                    .mutateAsync({ id: plan.id, body: { isActive: !plan.isActive } })
                    .then(() => toastManager.add({ title: "تم التحديث", type: "success" }))
                    .catch(() => toastManager.add({ title: "فشل التحديث", type: "error" }))
                }
              >
                {plan.isActive ? "تعطيل" : "تفعيل"}
              </Button>
            </Card>
          ))}
          {plans.length === 0 && (
            <Card className="p-8 text-center text-neutral-400 sm:col-span-2 lg:col-span-3">لا توجد خطط بعد</Card>
          )}
        </div>
      )}

      {!activeLoading && tab === "subscriptions" && (
        <Card className="divide-y divide-neutral-100 p-0">
          {subsPage.items.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div dir="ltr" className="text-sm text-neutral-600">{sub.userId}</div>
                <div className="text-xs text-neutral-400">
                  خطة #{sub.planId} · حتى {sub.currentPeriodEnd ? formatDateAr(sub.currentPeriodEnd) : "—"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={sub.status === "active" ? "success" : "soft"}>{sub.status}</Badge>
                {sub.status === "active" && (
                  <Button
                    size="sm"
                    variant="error-solid"
                    onClick={() =>
                      void billing.cancelSubscription
                        .mutateAsync(sub.id)
                        .then(() => toastManager.add({ title: "تم الإلغاء", type: "success" }))
                        .catch(() => toastManager.add({ title: "فشل الإلغاء", type: "error" }))
                    }
                  >
                    إلغاء
                  </Button>
                )}
              </div>
            </div>
          ))}
          {subscriptions.length === 0 && <p className="p-8 text-center text-neutral-400">لا توجد اشتراكات</p>}
        </Card>
      )}

      {!activeLoading && tab === "invoices" && (
        <Card className="divide-y divide-neutral-100 p-0">
          {invoicesPage.items.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium text-neutral-700">فاتورة #{invoice.id}</div>
                <div className="text-xs text-neutral-400">
                  {invoice.amount} · {formatDateAr(invoice.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={invoice.status === "paid" ? "success" : "warning"}>{invoice.status}</Badge>
                {invoice.status !== "paid" && (
                  <Button
                    size="sm"
                    variant="light-solid"
                    onClick={() =>
                      void billing.markInvoicePaid
                        .mutateAsync(invoice.id)
                        .then(() => toastManager.add({ title: "سُجلت كمدفوعة", type: "success" }))
                        .catch(() => toastManager.add({ title: "فشل التسجيل", type: "error" }))
                    }
                  >
                    تسجيل كمدفوعة
                  </Button>
                )}
              </div>
            </div>
          ))}
          {invoices.length === 0 && <p className="p-8 text-center text-neutral-400">لا توجد فواتير</p>}
        </Card>
      )}

      <PaginationControls pagination={activePagination} onPageChange={setPage} />

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogPopup dir="rtl" className="sm:max-w-md">
          <DialogHeader dir="rtl">
            <DialogTitle>إضافة خطة</DialogTitle>
          </DialogHeader>
          <form dir="rtl" onSubmit={planForm.handleSubmit(createPlan)} className="space-y-4 pt-2">
            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="plan-name">اسم الخطة *</Label>
              <Input
                id="plan-name"
                placeholder="اسم الخطة"
                data-invalid={planForm.formState.errors.name}
                {...planForm.register("name")}
              />
              {planForm.formState.errors.name && (
                <p className="text-error-600 text-xs">{planForm.formState.errors.name.message}</p>
              )}
            </FieldRoot>

            <FieldRoot className="flex flex-col gap-2">
              <Label htmlFor="plan-price">السعر</Label>
              <Input
                id="plan-price"
                type="number"
                placeholder="السعر"
                data-invalid={planForm.formState.errors.price}
                {...planForm.register("price")}
              />
              {planForm.formState.errors.price && (
                <p className="text-error-600 text-xs">{planForm.formState.errors.price.message}</p>
              )}
            </FieldRoot>

            <FieldRoot className="flex flex-col gap-2">
              <Label>دورة الفوترة</Label>
              <div className="flex gap-2">
                {(["monthly", "yearly"] as const).map((interval) => (
                  <Button
                    key={interval}
                    type="button"
                    size="sm"
                    variant={planForm.watch("interval") === interval ? "primary-solid" : "light-solid"}
                    onClick={() => planForm.setValue("interval", interval)}
                  >
                    {interval === "monthly" ? "شهري" : "سنوي"}
                  </Button>
                ))}
              </div>
            </FieldRoot>

            <div className="flex justify-end gap-2">
              <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>إلغاء</DialogClose>
              <Button type="submit" size="sm" disabled={billing.createPlan.isPending}>
                {billing.createPlan.isPending ? "جارٍ الإنشاء..." : "إنشاء"}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </Dialog>
    </section>
  );
};

export default BillingPage;
