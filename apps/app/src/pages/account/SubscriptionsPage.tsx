import { LuCalendar, LuCheck, LuSparkles } from "react-icons/lu";
import { formatDateAr } from "@mia/core";
import { Badge } from "@mia/ui/components/badge";
import { Card } from "@mia/ui/components/card";
import { useSubscription } from "@/lib/api/queries";

/**
 * Read-only entitlements view. Billing starts as a free-plan skeleton; paid
 * checkout arrives with the payment provider integration later.
 */
const PLAN_LABELS: Record<string, string> = {
  pro: "الخطة الاحترافية",
  free: "الخطة المجانية",
};
const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  expired: "منتهٍ",
  free: "مجاني",
};

const SubscriptionsPage = () => {
  const { data: entitlements, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-2xl">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-40 animate-pulse rounded bg-neutral-200" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-200" />
          </div>
          <div className="mb-6 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
          </div>
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
        </Card>
      </section>
    );
  }

  const planName = entitlements?.planName ?? "free";
  const status = entitlements?.status ?? "free";

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LuSparkles className="text-primary-500 size-5" />
            <h2 className="text-xl font-semibold text-neutral-800">اشتراكك الحالي</h2>
          </div>
          <Badge variant={status === "active" ? "success" : "soft"}>
            {PLAN_LABELS[planName] ?? planName}
          </Badge>
        </div>

        <p className="mb-6 text-neutral-600">
          {status === "active"
            ? "أنت على خطة مدفوعة نشطة. تشمل هذه الخطة كامل المزايا المتاحة لحسابك."
            : "أنت على الخطة المجانية. ترقّ إلى خطة مدفوعة للحصول على مزايا وحدود استخدام أعلى."}
        </p>

        <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
          <span className="font-medium text-neutral-600">الحالة:</span>
          <span>{STATUS_LABELS[status] ?? status}</span>
        </div>

        {entitlements?.currentPeriodEnd && (
          <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
            <LuCalendar className="size-4" />
            <span>
              نهاية الفترة الحالية:{" "}
              {formatDateAr(entitlements.currentPeriodEnd)}
            </span>
          </div>
        )}

        {entitlements && entitlements.features.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-neutral-700">المزايا</h3>
            <ul className="space-y-1">
              {entitlements.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-neutral-600">
                  <LuCheck className="text-success-500 size-4" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </section>
  );
};

export default SubscriptionsPage;
