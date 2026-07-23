import { Card } from "@mia/ui/components/card";
import { useProfile } from "@/lib/api/queries";
import { useAuth } from "@/hooks/useAuth";

/** Layout-mirroring skeleton — mirrors the welcome card's anatomy. */
function DashboardSkeleton() {
  return (
    <Card className="w-full p-6" dir="rtl">
      <div className="flex items-center gap-4">
        <div className="size-16 shrink-0 animate-pulse rounded-2xl bg-neutral-200" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-neutral-200" />
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
      </div>
    </Card>
  );
}

const DashboardPage = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-3xl">
        <DashboardSkeleton />
      </section>
    );
  }

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
    user?.name ||
    "بك";
  const initial = displayName.trim().charAt(0).toUpperCase() || "؟";

  return (
    <section className="mx-auto w-full max-w-3xl">
      <Card className="w-full p-6" dir="rtl">
        <div className="flex items-center gap-4">
          <div className="bg-primary-50 text-primary-500 flex size-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold">
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">مرحباً، {displayName}</h1>
            <p className="text-neutral-500">أهلاً بك في لوحة تحكم صُنع في الجزائر</p>
          </div>
        </div>
        <p className="mt-6 leading-relaxed text-neutral-600">
          من هنا يمكنك إدارة حسابك ومتابعة اشتراكك. استخدم القائمة الجانبية للتنقل بين
          صفحة الحساب وصفحة الاشتراك.
        </p>
      </Card>
    </section>
  );
};

export default DashboardPage;
