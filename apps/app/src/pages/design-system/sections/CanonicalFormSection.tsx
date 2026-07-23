"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@mia/ui/components/button";
import { Input } from "@mia/ui/components/input";
import { FieldRoot, Label } from "@mia/ui/components/label";
import { Checkbox } from "@mia/ui/components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mia/ui/components/select";
import { useToast } from "@mia/ui/components/toast";
import { SectionShell } from "./SectionShell";

// Validation schema — declared above the component, Arabic messages, exactly
// like apps/app/src/components/auth/LoginForm.tsx and RegisterForm.tsx.
const demoSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة").min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  plan: z.string().min(1, "يرجى اختيار الخطة"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "يجب الموافقة على الشروط والأحكام",
  }),
});

type DemoFormValues = z.infer<typeof demoSchema>;

const PLAN_OPTIONS = [
  { label: "المجانية", value: "free" },
  { label: "الاحترافية", value: "pro" },
  { label: "المؤسسات", value: "enterprise" },
];

export function CanonicalFormSection() {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    reset,
  } = useForm<DemoFormValues>({
    resolver: zodResolver(demoSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      plan: "",
      acceptTerms: false,
    },
  });

  const planValue = watch("plan");
  const acceptTermsValue = watch("acceptTerms");

  const onSubmit: SubmitHandler<DemoFormValues> = async () => {
    setIsLoading(true);
    // Simulated async submit — no network.
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    toast.add({ title: "تم إرسال النموذج بنجاح", type: "success" });
    reset();
  };

  return (
    <SectionShell
      id="form"
      title="النموذج القياسي — The canonical form"
      subtitle="react-hook-form + zod, FieldRoot/Label, Arabic validation, toast on success"
    >
      <p className="mb-4 text-sm text-neutral-500">
        هذا هو النمط القياسي للنماذج — انسخه. المرجع:{" "}
        <code className="text-primary-500" dir="ltr">
          apps/app/src/components/auth/LoginForm.tsx
        </code>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-4">
        <FieldRoot className="flex w-full flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="df-name">الاسم الكامل</Label>
            <Input
              id="df-name"
              type="text"
              className="h-12 bg-neutral-100/40"
              placeholder="أدخل اسمك الكامل"
              disabled={isLoading}
              {...register("name")}
              data-invalid={errors.name}
            />
            {errors.name && <p className="text-error-600 pr-2.5 text-xs">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="df-email">البريد الإلكتروني</Label>
            <Input
              id="df-email"
              type="email"
              className="h-12 bg-neutral-100/40"
              placeholder="أدخل بريدك الإلكتروني"
              disabled={isLoading}
              {...register("email")}
              data-invalid={errors.email}
            />
            {errors.email && <p className="text-error-600 pr-2.5 text-xs">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="df-password">كلمة المرور</Label>
            <Input
              id="df-password"
              type="password"
              className="h-12 bg-neutral-100/40"
              placeholder="8 أحرف على الأقل"
              disabled={isLoading}
              {...register("password")}
              data-invalid={errors.password}
            />
            {errors.password && <p className="text-error-600 pr-2.5 text-xs">{errors.password.message}</p>}
          </div>

          {/* Plan (Select) */}
          <div className="flex flex-col gap-2">
            <Label>الخطة</Label>
            <Select
              value={planValue}
              onValueChange={(value: string | null) => {
                setValue("plan", value ?? "");
                trigger("plan");
              }}
            >
              <SelectTrigger className="h-12" dir="rtl" data-invalid={errors.plan}>
                <SelectValue>{PLAN_OPTIONS.find((o) => o.value === planValue)?.label ?? "اختر الخطة"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.plan && <p className="text-error-600 pr-2.5 text-xs">{errors.plan.message}</p>}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="df-terms"
              checked={acceptTermsValue}
              onCheckedChange={(checked) => {
                setValue("acceptTerms", !!checked);
                trigger("acceptTerms");
              }}
              disabled={isLoading}
              className="data-[invalid]:!border-error-600 mt-1"
              data-invalid={errors.acceptTerms}
            />
            <div className="flex flex-col gap-1">
              <Label htmlFor="df-terms" className="cursor-pointer text-sm leading-relaxed">
                أوافق على الشروط والأحكام وسياسة الخصوصية
              </Label>
              {errors.acceptTerms && <p className="text-error-600 text-xs">{errors.acceptTerms.message}</p>}
            </div>
          </div>
        </FieldRoot>

        <Button type="submit" className="h-12 w-full" disabled={isLoading}>
          {isLoading ? "جارٍ الإرسال..." : "إرسال"}
        </Button>
      </form>
    </SectionShell>
  );
}
