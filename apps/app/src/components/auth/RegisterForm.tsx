"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "react-router";
import { Button } from "@mia/ui/components/button";
import { Input } from "@mia/ui/components/input";
import { Checkbox } from "@mia/ui/components/checkbox";
import { FieldRoot, Label } from "@mia/ui/components/label";
import { Link } from "react-router";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@mia/ui/components/toast";
import GoogleIcon from "@mia/ui/icons/GoogleIcon";

// Validation schema
const registerSchema = z
  .object({
    firstName: z.string().min(1, "الاسم الأول مطلوب").min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
    lastName: z.string().min(1, "اسم العائلة مطلوب").min(2, "اسم العائلة يجب أن يكون حرفين على الأقل"),
    email: z.string().min(1, "البريد الإلكتروني مطلوب").email("البريد الإلكتروني غير صحيح"),
    password: z.string().min(1, "كلمة المرور مطلوبة").min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "يجب الموافقة على الشروط والأحكام",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const toastManager = useToast();

  // Get redirect URL from query params, default to dashboard
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const handleFormSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await authClient.signUp.email({
        name: `${values.firstName} ${values.lastName}`,
        email: values.email,
        password: values.password,
        callbackURL: `${window.location.origin}${redirectUrl}`,
      });

      if (error) {
        setError(error.message || "حدث خطأ أثناء إنشاء الحساب");
        return;
      }

      // Show success message about verification email
      toastManager.add({
        title: "تم إنشاء حسابك بنجاح! تفقد بريدك لتفعيل الحساب",
        type: "success",
      });

      // Replace history so back button doesn't return to register page
      window.location.replace(redirectUrl);
    } catch {
      setError("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };
  const acceptTermsValue = watch("acceptTerms");

  const signInWithGoogle = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}${redirectUrl}`,
      });

      if (error) {
        console.log(error, "this is an error while trying to login with google");
        setError(error.message || "حدث خطأ أثناء تسجيل الدخول باستخدام Google");
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع");
      console.error("Google Login error:", err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <FieldRoot className="flex w-full flex-col gap-5">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">الاسم الأول</Label>
              <Input
                id="firstName"
                type="text"
                className="h-12 bg-neutral-100/40"
                placeholder="الاسم الأول"
                disabled={isLoading}
                {...register("firstName")}
                data-invalid={errors.firstName}
              />
              {errors.firstName && <p className="text-error-600 pr-2.5 text-xs">{errors.firstName.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">اسم العائلة</Label>
              <Input
                id="lastName"
                type="text"
                className="h-12 bg-neutral-100/40"
                placeholder="اسم العائلة"
                disabled={isLoading}
                {...register("lastName")}
                data-invalid={errors.lastName}
              />
              {errors.lastName && <p className="text-error-600 pr-2.5 text-xs">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              className="h-12 bg-neutral-100/40"
              placeholder="أدخل بريدك الإلكتروني"
              disabled={isLoading}
              {...register("email")}
              data-invalid={errors.email}
            />
            {errors.email && <p className="text-error-600 pr-2.5 text-xs">{errors.email.message}</p>}
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              placeholder="أدخل كلمة المرور"
              disabled={isLoading}
              className="h-12 bg-neutral-100/40"
              {...register("password")}
              data-invalid={errors.password}
            />
            {errors.password && <p className="text-error-600 pr-2.5 text-xs">{errors.password.message}</p>}
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="أعد إدخال كلمة المرور"
              disabled={isLoading}
              className="h-12 bg-neutral-100/40"
              {...register("confirmPassword")}
              data-invalid={errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-error-600 pr-2.5 text-xs">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-error-600 from-error-50 via-error-50/50 to-error-50/20 !border-error-100 rounded border bg-gradient-to-t p-3 text-sm">
              {error}
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="flex items-start gap-1">
            <Checkbox
              id="acceptTerms"
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
              <Label htmlFor="acceptTerms" className="cursor-pointer text-sm leading-relaxed">
                أوافق على{" "}
                <Link to="/terms" className="text-primary-500 hover:text-primary-600 transition-colors">
                  الشروط والأحكام
                </Link>{" "}
                و{" "}
                <Link to="/privacy" className="text-primary-500 hover:text-primary-600 transition-colors">
                  سياسة الخصوصية
                </Link>
              </Label>
              {errors.acceptTerms && <p className="text-error-600 text-xs">{errors.acceptTerms.message}</p>}
            </div>
          </div>
        </FieldRoot>

        {/* Submit Button */}
        <Button type="submit" className="h-12 w-full" disabled={isLoading}>
          {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
        </Button>
        {/* Register Through Google */}
        <div className="flex items-center justify-center">
          <Button
            type="button"
            variant={"dark-solid"}
            className="h-12 w-full"
            onClick={() => signInWithGoogle()}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? "جاري التحويل إلى Google..." : <>تسجيل الدخول باستخدام <GoogleIcon className="size-6" /></>}
          </Button>
        </div>
      </form>

      {/* Login Link */}
      <div className="text-center">
        <span className="text-sm text-neutral-500">
          تملك حساباً بالفعل؟{" "}
          <Link to={redirectUrl !== "/dashboard" ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"} className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
            تسجيل الدخول
          </Link>
        </span>
      </div>
    </div>
  );
}
