"use client";

import React, { useState } from "react";
import { useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@mia/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@mia/ui/components/avatar";
import { Input } from "@mia/ui/components/input";
import { Badge } from "@mia/ui/components/badge";
import { FieldRoot, Label } from "@mia/ui/components/label";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@mia/ui/components/dialog";
import EditPencilIcon from "@mia/ui/icons/EditPencilIcon";
import LockIcon from "@mia/ui/icons/LockIcon";
import { useAuth } from "@/hooks/useAuth";
import { authClient } from "@/lib/auth-client";
import { useUploadImage } from "@/lib/api/queries";
import { cn } from "@mia/ui";
import { buttonVariants } from "@mia/ui";
import { useToast } from "@mia/ui/components/toast";
import { clearAuthDataPreservePreferences } from "@/lib/cookie-utils";

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.email("البريد الإلكتروني غير صحيح"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

const deleteAccountSchema = z.object({
  confirmation: z.string().refine((val) => val === "DELETE", {
    message: "يجب كتابة DELETE للتأكيد",
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type DeleteFormValues = { confirmation: string };

const AccountSettingsPage = () => {
  const toastManager = useToast();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  const uploadImage = useUploadImage();

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Check for invalid token error
  const hasTokenError = searchParams.get("error") === "invalid_token";

  // Form handlers
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const deleteForm = useForm<DeleteFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmation: "" },
  });

  // Handle resend verification
  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResending(true);
    try {
      await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: "https://www.madeinalgeria.dev/dashboard/account",
      });
      toastManager.add({
        title: "تم إرسال رابط التفعيل",
        description: "يرجى التحقق من بريدك الإلكتروني",
        type: "success",
      });
      window.history.replaceState({}, "", "/dashboard/account");
    } catch {
      toastManager.add({
        title: "فشل إرسال البريد",
        description: "حدث خطأ أثناء إرسال رابط التفعيل",
        type: "error",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Handle image selection with preview
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset dialog state
  const resetProfileDialog = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    profileForm.reset({
      name: user?.name || "",
      email: user?.email || "",
    });
  };

  // Update profile (name, email, and image)
  const handleProfileUpdate = async (data: ProfileFormValues) => {
    try {
      let imageUrl = user?.image;

      // Upload image if selected
      if (selectedFile) {
        setIsUploadingImage(true);
        const uploadResult = await uploadImage.mutateAsync({
          file: selectedFile,
          imageType: "profile",
        });
        imageUrl = uploadResult.url;
        setIsUploadingImage(false);
      }

      // Update user info
      const updates: { name?: string; image?: string } = {};
      if (data.name !== user?.name) updates.name = data.name;
      if (imageUrl !== user?.image && imageUrl !== null) updates.image = imageUrl;

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await authClient.updateUser(updates);
        if (updateError) {
          toastManager.add({
            title: "فشل في تحديث المعلومات",
            description: updateError.message || "حدث خطأ أثناء تحديث البيانات",
            type: "error",
          });
          return;
        }
      }

      // Update email if changed
      const newEmail = data.email.trim().toLowerCase();
      const currentEmail = user?.email.trim().toLowerCase();

      if (newEmail !== currentEmail) {
        // Check if current email is verified before allowing change
        if (!user?.emailVerified) {
          toastManager.add({
            title: "يجب تفعيل البريد الحالي أولاً",
            description: "لا يمكنك تغيير البريد الإلكتروني قبل تفعيل بريدك الحالي",
            type: "error",
          });
          return;
        }

        const { error: emailError } = await authClient.changeEmail({
          newEmail: data.email.trim(),
          callbackURL: "https://www.madeinalgeria.dev/dashboard/account",
        });
        if (emailError) {
          toastManager.add({
            title: "فشل في تحديث البريد",
            description: emailError.message || "حدث خطأ أثناء تغيير البريد الإلكتروني",
            type: "error",
          });
          return;
        }
        toastManager.add({
          title: "تم إرسال رابط التحقق",
          description: "يرجى التحقق من بريدك الإلكتروني الجديد لإتمام التغيير",
          type: "success",
        });
      } else if (Object.keys(updates).length > 0) {
        toastManager.add({
          title: "تم تحديث المعلومات بنجاح",
          type: "success",
        });
      } else {
        toastManager.add({
          title: "لم يتم تغيير أي معلومات",
          type: "info",
        });
        setIsProfileDialogOpen(false);
        resetProfileDialog();
        return;
      }

      setIsProfileDialogOpen(false);
      resetProfileDialog();

      if (Object.keys(updates).length > 0) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      toastManager.add({
        title: "حدث خطأ غير متوقع",
        description: "يرجى المحاولة مرة أخرى",
        type: "error",
      });
      setIsUploadingImage(false);
    }
  };

  // Change password
  const handlePasswordChange = async (data: PasswordFormValues) => {
    try {
      const { error } = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });
      if (error) {
        console.error("[Settings] Password change failed:", error);

        // Clear auth data if the error is auth-related (e.g., invalid current password, invalid session)
        if (
          error.message?.toLowerCase().includes("invalid") ||
          error.message?.toLowerCase().includes("unauthorized") ||
          error.message?.toLowerCase().includes("session")
        ) {
          clearAuthDataPreservePreferences();
        }

        toastManager.add({
          title: "فشل في تغيير كلمة المرور",
          description: error.message || "حدث خطأ أثناء تغيير كلمة المرور",
          type: "error",
        });
        return;
      }
      toastManager.add({
        title: "تم تغيير كلمة المرور بنجاح",
        description: "تم تسجيل الخروج من جميع الأجهزة الأخرى",
        type: "success",
      });
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
    } catch (err) {
      console.error("[Settings] Unexpected password change error:", err);
      clearAuthDataPreservePreferences();

      toastManager.add({
        title: "حدث خطأ غير متوقع",
        description: "يرجى المحاولة مرة أخرى",
        type: "error",
      });
    }
  };

  // Delete account
  const handleAccountDeletion = async () => {
    try {
      const { error } = await authClient.deleteUser({
        callbackURL: `${window.location.origin}/login`,
      });
      if (error) {
        console.error("[Settings] Account deletion failed:", error);

        // Clear auth data on deletion errors
        clearAuthDataPreservePreferences();

        toastManager.add({
          title: "فشل في حذف الحساب",
          description: error.message || "حدث خطأ أثناء حذف الحساب",
          type: "error",
        });
        return;
      }
      toastManager.add({
        title: "تم إرسال رابط التأكيد",
        description: "يرجى التحقق من بريدك الإلكتروني لتأكيد حذف الحساب",
        type: "success",
      });

      // Clear auth data and redirect after successful deletion request
      setTimeout(() => {
        clearAuthDataPreservePreferences();
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      console.error("[Settings] Unexpected account deletion error:", err);
      clearAuthDataPreservePreferences();

      toastManager.add({
        title: "حدث خطأ غير متوقع",
        description: "يرجى المحاولة مرة أخرى",
        type: "error",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex h-full w-full max-w-4xl items-center justify-center">
        <div className="border-t-primary-500 size-16 animate-spin rounded-full border-4 border-neutral-200"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex h-full w-full max-w-4xl items-center justify-center">
        <p className="text-neutral-500">لم يتم العثور على بيانات المستخدم</p>
      </div>
    );
  }

  // Show error UI if invalid token
  if (hasTokenError) {
    return (
      <section className="mx-auto flex h-full w-full max-w-2xl items-center justify-center p-4">
        <div className="rounded-card w-full bg-neutral-50 p-8 text-center shadow-lg">
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-error-50 border-error-100 flex size-20 items-center justify-center rounded-full border">
              <svg className="text-error-500 size-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <h2 className="mb-3 text-2xl font-bold text-neutral-700">رابط التحقق غير صالح</h2>
          <p className="mb-6 leading-relaxed text-neutral-500">
            عذراً، الرابط الذي استخدمته منتهي الصلاحية أو غير صحيح.
            <br />
            يمكنك طلب رابط تفعيل جديد من خلال الزر أدناه.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={handleResendVerification} disabled={isResending} size="lg" className="w-full sm:w-auto">
              {isResending ? "جاري الإرسال..." : "إرسال رابط تفعيل جديد"}
            </Button>
            <Button
              variant="light-solid"
              size="lg"
              onClick={() => window.history.replaceState({}, "", "/dashboard/account")}
              className="w-full sm:w-auto"
            >
              العودة إلى الإعدادات
            </Button>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-sm text-neutral-400">
            إذا استمرت المشكلة، يرجى{" "}
            <a href="mailto:support@madeinalgeria.dev" className="text-primary-500 hover:underline">
              التواصل مع الدعم
            </a>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center gap-[20px]">
      <section className="rounded-card drop-shadow-default w-full overflow-hidden bg-neutral-50">
        {/* Header with profile image */}
        <section className="from-primary-400 via-primary-400 to-primary-500 relative h-[160px] bg-gradient-to-r">
          <section className="flex translate-y-[110px] gap-2 px-4">
            <div className="relative flex aspect-square h-[100px] items-center justify-center rounded">
              <Avatar className="z-10 size-[100px] rounded">
                <AvatarImage src={user.image ?? undefined} alt={user.name} className="rounded object-cover" />
                <AvatarFallback className="bg-primary-50 text-primary-500 rounded text-3xl font-semibold">
                  {user.name.trim().charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="from-primary-300 via-primary-200 to-primary-50 absolute inset-0 scale-105 rounded bg-gradient-to-b opacity-40 backdrop-blur-lg" />
            </div>

            <section className="flex flex-col gap-2">
              <div className="flex h-full flex-col justify-around">
                <Dialog
                  open={isProfileDialogOpen}
                  onOpenChange={(open) => {
                    setIsProfileDialogOpen(open);
                    if (!open) resetProfileDialog();
                  }}
                >
                  <DialogTrigger className={cn(buttonVariants({ variant: "light-solid", size: "small-icon" }))}>
                    <EditPencilIcon className="size-4" />
                  </DialogTrigger>
                  <DialogPopup dir="rtl" className="sm:max-w-lg">
                    <DialogHeader dir="rtl">
                      <DialogTitle>تعديل الملف الشخصي</DialogTitle>
                      <DialogDescription>قم بتحديث معلوماتك الشخصية وصورة الملف الشخصي</DialogDescription>
                    </DialogHeader>

                    <form dir="rtl" onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                      {/* Image Upload Section */}
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative aspect-square h-24 w-24 overflow-hidden rounded-full">
                          <Avatar className="size-24 rounded-full">
                            <AvatarImage
                              src={previewImage || user.image || undefined}
                              alt={user.name}
                              className="rounded-full object-cover"
                            />
                            <AvatarFallback className="bg-primary-50 text-primary-500 rounded-full text-2xl font-semibold">
                              {user.name.trim().charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isUploadingImage && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <div className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <label
                            className={cn(buttonVariants({ variant: "light-solid", size: "sm" }), "cursor-pointer")}
                          >
                            <EditPencilIcon className="size-4" />
                            <span>تغيير الصورة</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              disabled={isUploadingImage}
                              className="hidden"
                            />
                          </label>
                          {previewImage && (
                            <Button
                              type="button"
                              variant="light-solid"
                              size="sm"
                              onClick={() => {
                                setPreviewImage(null);
                                setSelectedFile(null);
                              }}
                            >
                              إلغاء
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-4">
                        <FieldRoot dir="rtl" className="flex flex-col gap-2">
                          <Label htmlFor="name">الاسم</Label>
                          <Input
                            id="name"
                            className="bg-neutral-100/40"
                            defaultValue={user.name}
                            {...profileForm.register("name")}
                          />
                          {profileForm.formState.errors.name && (
                            <p className="pr-2.5 text-xs text-red-600">{profileForm.formState.errors.name.message}</p>
                          )}
                        </FieldRoot>

                        <FieldRoot dir="rtl" className="flex flex-col gap-2">
                          <Label htmlFor="email">البريد الإلكتروني</Label>
                          <Input
                            id="email"
                            type="email"
                            className="bg-neutral-100/40"
                            defaultValue={user.email}
                            disabled={!user.emailVerified}
                            {...profileForm.register("email")}
                          />
                          {profileForm.formState.errors.email && (
                            <p className="pr-2.5 text-xs text-red-600">{profileForm.formState.errors.email.message}</p>
                          )}
                          {!user.emailVerified && (
                            <p className="pr-2.5 text-xs text-red-600">
                              يجب تفعيل بريدك الحالي قبل التغيير.{" "}
                              <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={isResending}
                                className="text-primary-500 hover:underline"
                              >
                                {isResending ? "جاري الإرسال..." : "إرسال رابط التفعيل"}
                              </button>
                            </p>
                          )}
                          {user.emailVerified &&
                            profileForm.watch("email")?.trim().toLowerCase() !== user.email.trim().toLowerCase() && (
                              <p className="pr-2.5 text-xs text-amber-600">سيتم إرسال رابط تحقق إلى البريد الجديد</p>
                            )}
                        </FieldRoot>
                      </div>

                      <div dir="rtl" className="flex justify-end gap-2">
                        <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>
                          إلغاء
                        </DialogClose>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={profileForm.formState.isSubmitting || isUploadingImage}
                        >
                          {profileForm.formState.isSubmitting || isUploadingImage ? "جاري الحفظ..." : "حفظ التغييرات"}
                        </Button>
                      </div>
                    </form>
                  </DialogPopup>
                </Dialog>
              </div>
              <div className="h-full">
                <h3 className="font-semibold text-neutral-700">{user.name}</h3>
                <h5 className="text-sm">{user.email}</h5>
              </div>
            </section>
          </section>
        </section>

        {/* User Information Display */}
        <section className="flex w-full flex-wrap items-center justify-between gap-4 p-4 pt-[70px]">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-neutral-400">الإسم</span>
            <p className="font-semibold text-neutral-700">{user.name}</p>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-neutral-400">البريد الإلكتروني</span>
            <p className="font-semibold text-neutral-700">{user.email}</p>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-neutral-400">تاريخ الإنشاء</span>
            <p className="font-semibold text-neutral-700">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-neutral-400">حالة التحقق</span>
            {user.emailVerified ? (
              <Badge variant="success" className="w-fit gap-1">
                <span className="text-success-600">✓</span>
                محقق
              </Badge>
            ) : (
              <div className="flex flex-col gap-1">
                <Badge variant="warning" className="w-fit gap-1">
                  <span className="text-warning-600">⚠</span>
                  غير محقق
                </Badge>
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="text-primary-500 text-xs hover:underline"
                >
                  {isResending ? "جاري الإرسال..." : "إرسال رابط التفعيل"}
                </button>
              </div>
            )}
          </div>
        </section>


        {/* Action Buttons */}
        <div className="mx-4 border-b" />
        <section className="flex w-full items-center justify-end gap-5 px-4 pb-4 pt-4">
          {/* Change Password */}
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger className={cn(buttonVariants({ variant: "light-solid", size: "sm" }), "gap-2")}>
              <LockIcon className="size-4" />
              <span>تغيير كلمة المرور</span>
            </DialogTrigger>
            <DialogPopup dir="rtl" className="sm:max-w-md">
              <DialogHeader dir="rtl">
                <DialogTitle>تغيير كلمة المرور</DialogTitle>
                <DialogDescription>أدخل كلمة المرور الحالية والجديدة</DialogDescription>
              </DialogHeader>

              <form dir="rtl" onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                <FieldRoot className="flex flex-col gap-2">
                  <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    className="bg-neutral-100/40"
                    {...passwordForm.register("currentPassword")}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="pr-2.5 text-xs text-red-600">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </FieldRoot>

                <FieldRoot className="flex flex-col gap-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    className="bg-neutral-100/40"
                    {...passwordForm.register("newPassword")}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="pr-2.5 text-xs text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </FieldRoot>

                <FieldRoot className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="bg-neutral-100/40"
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="pr-2.5 text-xs text-red-600">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </FieldRoot>

                <div className="flex justify-end gap-2">
                  <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>
                    إلغاء
                  </DialogClose>
                  <Button type="submit" size="sm" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting ? "جاري التغيير..." : "تغيير كلمة المرور"}
                  </Button>
                </div>
              </form>
            </DialogPopup>
          </Dialog>

          {/* Delete Account */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger className={cn(buttonVariants({ variant: "error-solid", size: "sm" }))}>
              حذف الحساب
            </DialogTrigger>
            <DialogPopup dir="rtl" className="sm:max-w-md">
              <DialogHeader dir="rtl">
                <DialogTitle>تأكيد حذف الحساب</DialogTitle>
                <DialogDescription>
                  هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك نهائياً.
                  <br />
                  <br />
                  لتأكيد الحذف، اكتب <strong>DELETE</strong> في الحقل أدناه:
                </DialogDescription>
              </DialogHeader>
              <form dir="rtl" onSubmit={deleteForm.handleSubmit(handleAccountDeletion)} className="space-y-4">
                <FieldRoot className="flex flex-col gap-2">
                  <Input
                    placeholder="اكتب DELETE للتأكيد"
                    className="bg-neutral-100/40"
                    {...deleteForm.register("confirmation")}
                  />
                  {deleteForm.formState.errors.confirmation && (
                    <p className="pr-2.5 text-xs text-red-600">{deleteForm.formState.errors.confirmation.message}</p>
                  )}
                </FieldRoot>

                <div className="flex justify-end gap-2">
                  <DialogClose className={cn(buttonVariants({ variant: "light-solid", size: "sm" }))}>
                    إلغاء
                  </DialogClose>
                  <Button
                    type="submit"
                    variant="error-solid"
                    size="sm"
                    disabled={deleteForm.formState.isSubmitting || deleteForm.watch("confirmation") !== "DELETE"}
                  >
                    {deleteForm.formState.isSubmitting ? "جاري الحذف..." : "حذف الحساب"}
                  </Button>
                </div>
              </form>
            </DialogPopup>
          </Dialog>
        </section>
      </section>
    </section>
  );
};

export default AccountSettingsPage;
