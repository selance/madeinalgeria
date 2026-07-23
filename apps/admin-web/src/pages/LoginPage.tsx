import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useSearchParams } from "react-router";
import { Button } from "@mia/ui/components/button";
import { Input } from "@mia/ui/components/input";
import { FieldRoot, Label } from "@mia/ui/components/label";
import Logo from "@mia/ui/icons/Logo";
import { authClient } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: standardSchemaResolver(loginSchema) });

  const onSubmit: SubmitHandler<LoginValues> = async (values) => {
    setIsLoading(true);
    setError(null);
    const { error: signInError } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    setIsLoading(false);
    if (signInError) {
      setError(signInError.message || "فشل تسجيل الدخول");
      return;
    }
    // Hard navigation: the session store still caches the pre-login null,
    // so a client-side navigate lets the guard bounce us straight back.
    window.location.replace(redirectUrl);
  };

  return (
    <section dir="rtl" className="flex h-dvh w-full items-center justify-center bg-neutral-50 p-5">
      <div className="w-full max-w-md">
        <Logo className="text-primary-500 mx-auto mb-4 h-14" />
        <h1 className="mb-1 text-center text-2xl text-neutral-700">لوحة إدارة صُنع في الجزائر</h1>
        <p className="mb-6 text-center text-neutral-500">تسجيل دخول المشرفين فقط</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldRoot className="flex w-full flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                className="h-12 bg-neutral-100/40"
                disabled={isLoading}
                data-invalid={errors.email}
                {...register("email")}
              />
              {errors.email && <p className="text-error-600 pr-2.5 text-xs">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                className="h-12 bg-neutral-100/40"
                disabled={isLoading}
                data-invalid={errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-error-600 pr-2.5 text-xs">{errors.password.message}</p>
              )}
            </div>
            {error && (
              <div className="from-error-50 via-error-50/50 to-error-50/20 !border-error-100 text-error-600 rounded-lg border bg-gradient-to-t p-3 text-sm">
                {error}
              </div>
            )}
          </FieldRoot>
          <Button type="submit" className="h-12 w-full" disabled={isLoading}>
            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default LoginPage;
