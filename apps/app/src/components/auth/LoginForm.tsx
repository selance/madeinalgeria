"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "react-router";
import { Button } from "@mia/ui/components/button";
import { Input } from "@mia/ui/components/input";
import { FieldRoot, Label } from "@mia/ui/components/label";
import { Link } from "react-router";
import { authClient } from "@/lib/auth-client";
import GoogleIcon from "@mia/ui/icons/GoogleIcon";
import { clearAuthDataPreservePreferences } from "@/lib/cookie-utils";

// Validation schema
const loginSchema = z.object({
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة").min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Get redirect URL from query params, default to dashboard
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const handleFormSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
        callbackURL: `${window.location.origin}${redirectUrl}`,
      });

      if (error) {
        console.error("[Login] Authentication failed:", error);

        // Clear all auth data on login failure
        clearAuthDataPreservePreferences();

        setError(error.message || "حدث خطأ أثناء تسجيل الدخول");
        return;
      }

      // Hard navigation (replace): guarantees ProtectedRoute boots with a
      // cold session fetch — the client-side store still caches null here.
      window.location.replace(redirectUrl);
    } catch (err) {
      console.error("[Login] Unexpected error:", err);

      // Clear auth data on unexpected errors too
      clearAuthDataPreservePreferences();

      setError("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}${redirectUrl}`,
      });

      if (error) {
        console.error("[Login] Google authentication failed:", error);

        // Clear auth data on Google login failure
        clearAuthDataPreservePreferences();

        setError(error.message || "حدث خطأ أثناء تسجيل الدخول باستخدام Google");
      }
    } catch (err) {
      console.error("[Login] Google login error:", err);

      // Clear auth data on error
      clearAuthDataPreservePreferences();

      setError("حدث خطأ غير متوقع");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <FieldRoot className={"flex w-full flex-col gap-5"}>
          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              className={"h-12 bg-neutral-100/40"}
              placeholder="أدخل بريدك الإلكتروني"
              disabled={isLoading}
              data-invalid={errors.email}
              {...register("email")}
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
              className={"h-12 bg-neutral-100/40"}
              {...register("password")}
              data-invalid={errors.password}
            />
            {errors.password && <p className="text-error-600 pr-2.5 text-xs">{errors.password.message}</p>}
          </div>

          {/* Error Message */}
          {error && (
            <div className="from-error-50 via-error-50/50 to-error-50/20 !border-error-100 text-error-600 rounded-lg border bg-gradient-to-t p-3 text-sm">
              {error}
            </div>
          )}

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <Link to="/reset-password" className="text-primary-500 hover:text-primary-600 text-sm transition-colors">
              نسيت كلمة المرور؟
            </Link>
          </div>
        </FieldRoot>

        {/* Submit Button — each button reflects only its OWN pending state, so
            starting the Google flow doesn't paint this one as pressed/disabled. */}
        <Button type="submit" className="h-12 w-full" disabled={isLoading}>
          {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
        </Button>
        {/* Login Through Google */}
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

      {/* Register Link */}
      <div className="text-center">
        <span className="text-sm text-neutral-500">
          لا تملك حساباً؟{" "}
          <Link to={redirectUrl !== "/dashboard" ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"} className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
            إنشاء حساب جديد
          </Link>
        </span>
      </div>
    </div>
  );
}
