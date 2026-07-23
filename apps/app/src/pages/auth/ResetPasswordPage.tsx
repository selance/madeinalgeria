import Logo from "@mia/ui/icons/Logo";
import ArabicLogo from "@mia/ui/icons/ArabicLogo";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

const ResetPasswordPage = () => {
  return (
    <section dir="rtl" className="flex h-dvh w-full gap-5 bg-neutral-50 p-5">
      <section className="mx-auto flex h-full w-full max-w-xl flex-col justify-center sm:px-8 sm:py-12 lg:px-10 lg:py-20">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <Logo className="text-primary-500 mx-auto mb-2.5 h-16 md:mx-0" />
          <div className="mb-5 w-full border-b border-neutral-200" />
          <div className="mb-6">
            <h2 className="mb-2 text-2xl text-neutral-700 lg:text-[26px]">إعادة تعيين كلمة المرور</h2>
            <h4 className="text-lg text-neutral-500 lg:text-[20px]">
              لا تقلق! أدخل بريدك الإلكتروني وسنرسل لك رابط الإعادة
            </h4>
          </div>
          <ForgotPasswordForm />
        </div>
      </section>
      <section className="rounded-card bg-primary-500 relative hidden h-full w-full items-center justify-center overflow-hidden lg:flex">
        <ArabicLogo className="z-10 h-24 text-white xl:h-32" />
      </section>
    </section>
  );
};

export default ResetPasswordPage;
