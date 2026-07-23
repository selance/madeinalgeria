import { Badge } from "@mia/ui/components/badge";
import { Alert, AlertTitle, AlertDescription } from "@mia/ui/components/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@mia/ui/components/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@mia/ui/components/card";
import { Separator } from "@mia/ui/components/separator";
import { Progress } from "@mia/ui/components/progress";
import { Skeleton } from "@mia/ui/components/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@mia/ui/components/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
} from "@mia/ui/components/popover";
import { PreviewCard, PreviewCardTrigger, PreviewCardContent } from "@mia/ui/components/preview-card";
import { Button } from "@mia/ui/components/button";
import { buttonVariants, cn } from "@mia/ui";
import WarningBoxIcon from "@mia/ui/icons/WarningBoxIcon";
import { SectionShell } from "./SectionShell";

const BADGES = ["default", "soft", "primary", "success", "warning", "error", "info", "dark", "outline"] as const;

export function DisplaySection() {
  return (
    <SectionShell
      id="display"
      title="العرض — Display"
      subtitle="Badge, Alert, Avatar, Card, Separator, Progress, Skeleton, Tooltip, Popover, PreviewCard"
    >
      <div className="space-y-6">
        {/* Badges */}
        <div>
          <code className="mb-2 block text-[11px] text-neutral-400" dir="ltr">
            Badge variants
          </code>
          <div className="flex flex-wrap items-center gap-2">
            {BADGES.map((v) => (
              <Badge key={v} variant={v}>
                {v}
              </Badge>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-3">
          <code className="block text-[11px] text-neutral-400" dir="ltr">
            Alert
          </code>
          <Alert className="border !border-neutral-200 bg-white text-neutral-700">
            <AlertTitle>معلومة</AlertTitle>
            <AlertDescription>هذا تنبيه افتراضي لعرض معلومة عامة للمستخدم.</AlertDescription>
          </Alert>
          <Alert className="border-error-200 bg-error-50/40 text-error-700">
            <WarningBoxIcon className="size-4" />
            <AlertTitle>تحذير</AlertTitle>
            <AlertDescription>حدث خطأ ما، يرجى المحاولة مرة أخرى.</AlertDescription>
          </Alert>
        </div>

        {/* Avatar + Progress + Separator */}
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="https://i.pravatar.cc/80?img=12" alt="مستخدم" />
                <AvatarFallback className="bg-primary-100 text-primary-600 text-sm font-semibold">
                  أ ك
                </AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback className="bg-neutral-200 text-sm font-semibold text-neutral-600">
                  م ع
                </AvatarFallback>
              </Avatar>
            </div>
            <code className="text-[11px] text-neutral-400" dir="ltr">
              Avatar (image + fallback)
            </code>
          </div>

          <div className="flex min-w-[220px] flex-1 flex-col gap-2">
            <code className="text-[11px] text-neutral-400" dir="ltr">
              Progress value=66
            </code>
            <Progress value={66} />
          </div>
        </div>

        {/* Separator */}
        <div>
          <code className="mb-2 block text-[11px] text-neutral-400" dir="ltr">
            Separator (horizontal / vertical)
          </code>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span>القسم الأول</span>
            <Separator orientation="vertical" className="!h-5 !bg-neutral-200" />
            <span>القسم الثاني</span>
          </div>
          <Separator className="mt-3 !bg-neutral-200" />
        </div>

        {/* Card anatomy */}
        <div>
          <code className="mb-2 block text-[11px] text-neutral-400" dir="ltr">
            Card anatomy
          </code>
          <Card className="max-w-sm p-0">
            <CardHeader>
              <CardTitle className="text-neutral-800">عنوان البطاقة</CardTitle>
              <CardDescription className="text-neutral-400">وصف مختصر لمحتوى البطاقة.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-neutral-600">
              محتوى البطاقة الأساسي يظهر هنا مع نص توضيحي قصير.
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">إجراء</Button>
              <Button size="sm" variant="light-outline">
                إلغاء
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Skeleton */}
        <div>
          <code className="mb-2 block text-[11px] text-neutral-400" dir="ltr">
            Skeleton (layout-mirroring)
          </code>
          <Card className="max-w-sm">
            <div className="flex items-center gap-4">
              <Skeleton className="size-14 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          </Card>
        </div>

        {/* Overlays: Tooltip / Popover / PreviewCard */}
        <div className="flex flex-wrap items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className={cn(buttonVariants({ variant: "light-outline" }))}>
                مرّر فوقي (Tooltip)
              </TooltipTrigger>
              <TooltipContent>هذه تلميحة توضيحية</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Popover>
            <PopoverTrigger className="!w-fit px-4">افتح Popover</PopoverTrigger>
            <PopoverContent className="w-64">
              <PopoverTitle>عنوان</PopoverTitle>
              <PopoverDescription className="mt-1">
                محتوى منبثق يظهر بجانب الزر لعرض تفاصيل إضافية.
              </PopoverDescription>
              <PopoverClose className={cn(buttonVariants({ variant: "light-outline", size: "sm" }), "mt-3")}>
                إغلاق
              </PopoverClose>
            </PopoverContent>
          </Popover>

          <PreviewCard>
            <PreviewCardTrigger
              href="#display"
              className="text-primary-500 hover:text-primary-600 text-sm font-medium underline"
            >
              مرّر فوق الرابط (PreviewCard)
            </PreviewCardTrigger>
            <PreviewCardContent>
              <p className="text-sm font-semibold text-neutral-700">بطاقة معاينة</p>
              <p className="mt-1 text-xs text-neutral-500">
                تظهر عند تمرير المؤشر فوق الرابط لعرض معاينة سريعة للمحتوى.
              </p>
            </PreviewCardContent>
          </PreviewCard>
        </div>
      </div>
    </SectionShell>
  );
}
