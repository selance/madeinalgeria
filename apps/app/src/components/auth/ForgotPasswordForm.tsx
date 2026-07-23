"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@mia/ui/components/button";
import { Input } from "@mia/ui/components/input";
import { FieldRoot, Label } from "@mia/ui/components/label";
import { Link } from "react-router";
import ReturnIcon from "@mia/ui/icons/ReturnIcon";
import { authClient } from "@/lib/auth-client";

// Schema for requesting password reset
const resetRequestSchema = z.object({
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("البريد الإلكتروني غير صحيح"),
});

// Schema for resetting password with token
const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(1, "كلمة المرور الجديدة مطلوبة").min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

type ResetRequestFormValues = z.infer<typeof resetRequestSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if we have a reset token in the URL
  const token = searchParams.get("token");
  const isResetMode = !!token;

  // Form for requesting password reset
  const resetRequestForm = useForm<ResetRequestFormValues>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: "" },
  });

  // Form for actually resetting password
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const handleRequestReset: SubmitHandler<ResetRequestFormValues> = async (values) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message || "حدث خطأ أثناء إرسال رابط إعادة التعيين");
        return;
      }

      setSuccess("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
    } catch (err) {
      setError("حدث خطأ غير متوقع");
      console.error("Reset request error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword: SubmitHandler<ResetPasswordFormValues> = async (values) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: values.newPassword,
        token,
      });

      if (error) {
        setError(error.message || "حدث خطأ أثناء إعادة تعيين كلمة المرور");
        return;
      }

      setSuccess("تم إعادة تعيين كلمة المرور بنجاح");
      // errorirect to login after successful reset
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError("حدث خطأ غير متوقع");
      console.error("Reset password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isResetMode) {
    // Reset password form (with token)
    return (
      <div className="w-full max-w-md space-y-6">
        <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
          <FieldRoot className="flex w-full flex-col gap-5">
            {/* New Password Field */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                type="password"
                className="h-12 bg-neutral-100/40"
                placeholder="أدخل كلمة المرور الجديدة"
                disabled={isLoading}
                {...resetPasswordForm.register("newPassword")}
              />
              {resetPasswordForm.formState.errors.newPassword && (
                <p className="text-error-600 pr-2.5 text-xs">
                  {resetPasswordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm New Password Field */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
              <Input
                id="confirmPassword"
                type="password"
                className="h-12 bg-neutral-100/40"
                placeholder="أعد إدخال كلمة المرور الجديدة"
                disabled={isLoading}
                {...resetPasswordForm.register("confirmPassword")}
              />
              {resetPasswordForm.formState.errors.confirmPassword && (
                <p className="text-error-600 pr-2.5 text-xs">
                  {resetPasswordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Error/Success Messages */}
            {error && <div className="text-error-600 rounded bg-gradient-to-t from-error-50 via-error-50/50 to-error-50/20 border !border-error-100 p-3 text-sm">{error}</div>}

            {success && <div className="rounded bg-gradient-to-t from-success-50 via-success-50/50 to-success-50/20 border !border-success-100 p-3 text-sm text-success-600">{success}</div>}
          </FieldRoot>

          {/* Submit Button */}
          <Button type="submit" className="h-12 w-full" disabled={isLoading}>
            {isLoading ? "جاري إعادة التعيين..." : "إعادة تعيين كلمة المرور"}
          </Button>
        </form>

        {/* Back to Login Link */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-primary-500 hover:text-primary-600 inline-flex items-center gap-2 font-medium transition-colors"
          >
            <ReturnIcon className="size-4" />
            العودة إلى تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  // Request password reset form (no token)
  return (
    <div className="w-full max-w-md space-y-6">
      <form onSubmit={resetRequestForm.handleSubmit(handleRequestReset)} className="space-y-4">
        <FieldRoot className="flex w-full flex-col gap-5">
          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              className="h-12 bg-neutral-100/40"
              placeholder="أدخل بريدك الإلكتروني"
              disabled={isLoading}
              {...resetRequestForm.register("email")}
            />
            {resetRequestForm.formState.errors.email && (
              <p className="text-error-600 pr-2.5 text-xs">{resetRequestForm.formState.errors.email.message}</p>
            )}
          </div>

          {/* Help Text */}
          <div className="text-sm text-neutral-500">سنرسل لك رابط إعادة تعيين كلمة المرور على بريدك الإلكتروني</div>

          {/* Error/Success Messages */}
          {error && <div className="text-error-600 bg-error-50 rounded-lg p-3 text-sm">{error}</div>}

          {success && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">{success}</div>}
        </FieldRoot>

        {/* Submit Button */}
        <Button type="submit" className="h-12 w-full" disabled={isLoading}>
          {isLoading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
        </Button>
      </form>

      {/* Back to Login Link */}
      <div className="text-center">
        <Link
          to="/login"
          className="text-primary-500 hover:text-primary-600 inline-flex items-center gap-2 font-medium transition-colors"
        >
          <ReturnIcon className="size-4" />
          العودة إلى تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
