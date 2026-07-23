import { Link, useRouteError } from "react-router";
import { Button } from "@mia/ui/components/button";
import { Card } from "@mia/ui/components/card";
import { cn, buttonVariants } from "@mia/ui";
import Logo from "@mia/ui/icons/Logo";
import WarningBoxIcon from "@mia/ui/icons/WarningBoxIcon";

/** Route-level error boundary — friendly Arabic card instead of the raw stack. */
export function ErrorPage() {
  const error = useRouteError();
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "خطأ غير معروف";

  return (
    <div dir="rtl" className="flex min-h-dvh w-full items-center justify-center bg-neutral-100 p-6">
      <Card className="w-full max-w-md p-8 text-center">
        <Logo className="text-primary-500 mx-auto mb-6 h-10" />
        <WarningBoxIcon className="fill-warning-500 mx-auto mb-4 size-12" />
        <h1 className="mb-2 text-xl font-semibold text-neutral-800">حدث خطأ غير متوقع</h1>
        <p className="mb-6 text-sm text-neutral-500">
          نعتذر عن هذا الخلل. حاول تحديث الصفحة، وإذا استمرت المشكلة تواصل معنا.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => window.location.reload()}>تحديث الصفحة</Button>
          <Link to="/dashboard" className={cn(buttonVariants({ variant: "light-solid" }))}>
            العودة للرئيسية
          </Link>
        </div>
        <details className="mt-6 text-right">
          <summary className="cursor-pointer text-xs text-neutral-400">التفاصيل التقنية</summary>
          <pre
            dir="ltr"
            className="mt-2 max-h-32 overflow-auto rounded bg-neutral-50 p-2 text-left text-[11px] text-neutral-500"
          >
            {message}
          </pre>
        </details>
      </Card>
    </div>
  );
}
