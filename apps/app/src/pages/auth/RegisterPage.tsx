import { RegisterForm } from "@/components/auth/RegisterForm";
import Logo from "@mia/ui/icons/Logo";
import ArabicLogo from "@mia/ui/icons/ArabicLogo";
import React from "react";
import { useSearchParams } from "react-router";

/** Same-origin relative path only — never an absolute/protocol URL (open-redirect guard). */
function isSafeReturnTo(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !value.includes("://");
}

const RegisterPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Accept `returnTo` (same-origin relative path) as an alias for the form's
  // own `redirect` param.
  React.useEffect(() => {
    const returnTo = searchParams.get("returnTo");
    if (returnTo && !searchParams.get("redirect") && isSafeReturnTo(returnTo)) {
      const next = new URLSearchParams(searchParams);
      next.delete("returnTo");
      next.set("redirect", returnTo);
      setSearchParams(next, { replace: true });
    }
  }, []);

  return (
    <section dir="rtl" className="flex h-dvh w-full gap-5 bg-neutral-50 p-5">
      <section className="mx-auto flex h-full w-full max-w-xl flex-col justify-center sm:px-8 sm:py-12 lg:px-10 lg:py-20">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <Logo className="text-primary-500 mx-auto mb-2.5 h-16 md:mx-0" />
          <div className="mb-5 w-full border-b border-neutral-200" />
          <div className="mb-6">
            <h2 className="mb-2 text-2xl text-neutral-700 lg:text-[26px]">إنشاء حساب جديد</h2>
            <h4 className="text-lg text-neutral-500 lg:text-[20px]">مرحباً بك! من فضلك أدخل معلوماتك لإنشاء حسابك</h4>
          </div>

          <RegisterForm />
        </div>
      </section>
      <section className="rounded-card bg-primary-500 relative hidden h-full w-full items-center justify-center overflow-hidden lg:flex">
        <ArabicLogo className="z-10 h-24 text-white xl:h-32" />
      </section>
    </section>
  );
};

export default RegisterPage;
