import { SectionShell } from "./SectionShell";

export function TypographySection() {
  return (
    <SectionShell
      id="typography"
      title="الخط — Typography"
      subtitle="Heading scale, body & muted text as styled in this app"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-neutral-800 sm:text-4xl">عنوان رئيسي كبير (H1)</h1>
          <code className="text-[11px] text-neutral-400" dir="ltr">
            text-4xl font-bold text-neutral-800
          </code>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-neutral-800">عنوان ثانوي (H2)</h2>
          <code className="text-[11px] text-neutral-400" dir="ltr">
            text-2xl font-semibold
          </code>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold text-neutral-700">عنوان فرعي (H3)</h3>
          <code className="text-[11px] text-neutral-400" dir="ltr">
            text-xl font-semibold
          </code>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-lg font-medium text-neutral-700">عنوان صغير (H4)</h4>
          <code className="text-[11px] text-neutral-400" dir="ltr">
            text-lg font-medium
          </code>
        </div>
        <div className="flex flex-col gap-1">
          <p className="leading-relaxed text-neutral-600">
            نص المتن الأساسي — يُستخدم للفقرات الطويلة داخل الصفحات. يعتمد على خط المرعي بمقاس مريح
            للقراءة مع تباعد أسطر مناسب للغة العربية من اليمين إلى اليسار.
          </p>
          <code className="text-[11px] text-neutral-400" dir="ltr">
            text-base leading-relaxed text-neutral-600
          </code>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-neutral-400">نص خافت للملاحظات الثانوية والوصف المساعد.</p>
          <code className="text-[11px] text-neutral-400" dir="ltr">
            text-sm text-neutral-400
          </code>
        </div>
        <div className="flex flex-col gap-1">
          <a href="#" className="text-primary-500 hover:text-primary-600 text-sm font-medium transition-colors">
            رابط نصّي (Link)
          </a>
          <code className="text-[11px] text-neutral-400" dir="ltr">
            text-primary-500 hover:text-primary-600
          </code>
        </div>
      </div>
    </SectionShell>
  );
}
