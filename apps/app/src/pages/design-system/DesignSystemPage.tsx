import { Link } from "react-router";
import { Button } from "@mia/ui/components/button";
import ArabicLogo from "@mia/ui/icons/ArabicLogo";
import { TokensSection } from "./sections/TokensSection";
import { TypographySection } from "./sections/TypographySection";
import { ButtonsSection } from "./sections/ButtonsSection";
import { InputsSection } from "./sections/InputsSection";
import { DisplaySection } from "./sections/DisplaySection";
import { NavigationSection } from "./sections/NavigationSection";
import { TableSection } from "./sections/TableSection";
import { OverlaysSection } from "./sections/OverlaysSection";
import { CanonicalFormSection } from "./sections/CanonicalFormSection";

const NAV = [
  { id: "tokens", label: "الألوان" },
  { id: "typography", label: "الخط" },
  { id: "buttons", label: "الأزرار" },
  { id: "inputs", label: "الإدخال" },
  { id: "display", label: "العرض" },
  { id: "navigation", label: "التنقل" },
  { id: "table", label: "الجداول" },
  { id: "overlays", label: "الحوارات" },
  { id: "form", label: "النموذج" },
];

// Primitives intentionally not showcased (not a good fit for a static gallery).
const NOT_SHOWN = [
  "sidebar",
  "menubar",
  "menu",
  "navigation-menu",
  "context-menu",
  "command",
  "combobox",
  "carousel",
  "resizable",
  "collapsible",
  "toggle / toggle-group",
  "aspect-ratio",
  "scroll-area",
  "anchored-dropdown",
];

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="border-b !border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <ArabicLogo className="text-primary-500 h-8 w-auto" />
            <span className="hidden text-sm text-neutral-400 sm:inline" dir="ltr">
              Design System
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="light-outline" size="sm">
              <Link to="/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild variant="primary-solid" size="sm">
              <Link to="/dashboard">لوحة التحكم</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Sticky in-page nav */}
      <nav className="sticky top-0 z-40 border-b !border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <ul className="flex gap-1 overflow-x-auto py-2 text-sm">
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="hover:bg-primary-50 hover:text-primary-600 inline-block whitespace-nowrap rounded px-3 py-1.5 text-neutral-500 transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Intro / lead */}
        <div className="rounded-card drop-shadow-default border !border-neutral-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-neutral-800 sm:text-3xl">
            نظام التصميم — معرض المكوّنات
          </h1>
          <p className="mt-1 text-sm text-neutral-400" dir="ltr">
            Design System Showcase — rebrand once, review everything here
          </p>
          <p className="mt-4 max-w-3xl leading-relaxed text-neutral-600">
            بعد استنساخ القالب، يقوم المطوّر بتعديل الهوية البصرية (مقاييس الألوان بصيغة OKLCH،
            نصف القطر، الظلال، والخط) في ملف الرموز، وتعرض هذه الصفحة كل عناصر نظام التصميم في مكان
            واحد حتى يمكن مراجعة التغييرات دفعة واحدة.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-600" dir="ltr">
            <span className="text-neutral-400">edit tokens →</span>
            <code>packages/ui/src/styles/config.css</code>
          </div>
        </div>

        <TokensSection />
        <TypographySection />
        <ButtonsSection />
        <InputsSection />
        <DisplaySection />
        <NavigationSection />
        <TableSection />
        <OverlaysSection />
        <CanonicalFormSection />

        {/* Footnote: primitives not shown */}
        <footer className="rounded-card border !border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-700">غير معروضة — Not shown</h3>
          <p className="mt-1 text-xs text-neutral-400">
            مكوّنات لا تناسب المعرض الثابت (قوائم سياقية، أشرطة جانبية، عناصر تفاعلية معقّدة):
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {NOT_SHOWN.map((name) => (
              <code
                key={name}
                className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500"
                dir="ltr"
              >
                {name}
              </code>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}
