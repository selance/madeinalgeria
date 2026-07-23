import { SectionShell } from "./SectionShell";

/**
 * Literal class strings (never build `bg-${x}-${n}` dynamically) so Tailwind's
 * scanner emits every swatch. Each entry is [tailwind class, step label].
 */
type Swatch = [className: string, step: string];

const primary: Swatch[] = [
  ["bg-primary-50", "50"], ["bg-primary-100", "100"], ["bg-primary-200", "200"], ["bg-primary-300", "300"],
  ["bg-primary-400", "400"], ["bg-primary-500", "500"], ["bg-primary-600", "600"], ["bg-primary-700", "700"],
  ["bg-primary-800", "800"], ["bg-primary-900", "900"], ["bg-primary-950", "950"],
];
const neutral: Swatch[] = [
  ["bg-neutral-50", "50"], ["bg-neutral-100", "100"], ["bg-neutral-200", "200"], ["bg-neutral-300", "300"],
  ["bg-neutral-400", "400"], ["bg-neutral-500", "500"], ["bg-neutral-600", "600"], ["bg-neutral-700", "700"],
  ["bg-neutral-800", "800"], ["bg-neutral-900", "900"], ["bg-neutral-950", "950"],
];
const secondary: Swatch[] = [
  ["bg-secondary-50", "50"], ["bg-secondary-100", "100"], ["bg-secondary-200", "200"], ["bg-secondary-300", "300"],
  ["bg-secondary-400", "400"], ["bg-secondary-500", "500"], ["bg-secondary-600", "600"], ["bg-secondary-700", "700"],
  ["bg-secondary-800", "800"], ["bg-secondary-900", "900"], ["bg-secondary-950", "950"],
];
const success: Swatch[] = [
  ["bg-success-50", "50"], ["bg-success-100", "100"], ["bg-success-200", "200"], ["bg-success-300", "300"],
  ["bg-success-400", "400"], ["bg-success-500", "500"], ["bg-success-600", "600"], ["bg-success-700", "700"],
  ["bg-success-800", "800"], ["bg-success-900", "900"], ["bg-success-950", "950"],
];
const error: Swatch[] = [
  ["bg-error-50", "50"], ["bg-error-100", "100"], ["bg-error-200", "200"], ["bg-error-300", "300"],
  ["bg-error-400", "400"], ["bg-error-500", "500"], ["bg-error-600", "600"], ["bg-error-700", "700"],
  ["bg-error-800", "800"], ["bg-error-900", "900"], ["bg-error-950", "950"],
];
const warning: Swatch[] = [
  ["bg-warning-50", "50"], ["bg-warning-100", "100"], ["bg-warning-200", "200"], ["bg-warning-300", "300"],
  ["bg-warning-400", "400"], ["bg-warning-500", "500"], ["bg-warning-600", "600"], ["bg-warning-700", "700"],
  ["bg-warning-800", "800"], ["bg-warning-900", "900"], ["bg-warning-950", "950"],
];
const info: Swatch[] = [
  ["bg-info-50", "50"], ["bg-info-100", "100"], ["bg-info-200", "200"], ["bg-info-300", "300"],
  ["bg-info-400", "400"], ["bg-info-500", "500"], ["bg-info-600", "600"], ["bg-info-700", "700"],
  ["bg-info-800", "800"], ["bg-info-900", "900"], ["bg-info-950", "950"],
];

const scales: { name: string; token: string; items: Swatch[] }[] = [
  { name: "الأساسي", token: "primary", items: primary },
  { name: "الحيادي", token: "neutral", items: neutral },
  { name: "الثانوي", token: "secondary", items: secondary },
  { name: "النجاح", token: "success", items: success },
  { name: "الخطأ", token: "error", items: error },
  { name: "التحذير", token: "warning", items: warning },
  { name: "المعلومة", token: "info", items: info },
];

function Scale({ name, token, items }: { name: string; token: string; items: Swatch[] }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-neutral-700">{name}</span>
        <code className="text-[11px] text-neutral-400" dir="ltr">
          {token}-*
        </code>
      </div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
        {items.map(([cls, step]) => (
          <div key={cls} className="flex flex-col items-center gap-1">
            <div className={`${cls} h-9 w-full rounded border !border-neutral-100`} />
            <code className="text-[10px] text-neutral-400" dir="ltr">
              {step}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TokensSection() {
  return (
    <SectionShell
      id="tokens"
      title="الألوان والرموز — Tokens"
      subtitle="Color scales, radii, shadows & font — packages/ui/src/styles/config.css"
    >
      <div className="space-y-6">
        {scales.map((s) => (
          <Scale key={s.token} {...s} />
        ))}

        {/* Radius samples */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-neutral-700">أنصاف الأقطار — Radius</h3>
          <div className="flex flex-wrap gap-6">
            {[
              ["rounded-sm", "rounded-sm"],
              ["rounded", "rounded (--radius 6px)"],
              ["rounded-md", "rounded-md"],
              ["rounded-lg", "rounded-lg"],
              ["rounded-card", "rounded-card (12px)"],
              ["rounded-full", "rounded-full"],
            ].map(([cls, label]) => (
              <div key={cls} className="flex flex-col items-center gap-2">
                <div className={`${cls} bg-primary-100 border-primary-300 size-16 border`} />
                <code className="text-[11px] text-neutral-400" dir="ltr">
                  {label}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Shadow samples */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-neutral-700">الظلال — Shadows</h3>
          <div className="flex flex-wrap gap-6">
            {[
              ["drop-shadow-default", "drop-shadow-default"],
              ["drop-shadow-default-sm", "drop-shadow-default-sm"],
              ["shadow-sm", "shadow-sm"],
              ["shadow-lg", "shadow-lg"],
            ].map(([cls, label]) => (
              <div key={cls} className="flex flex-col items-center gap-2">
                <div className={`${cls} rounded-card size-16 bg-neutral-50`} />
                <code className="text-[11px] text-neutral-400" dir="ltr">
                  {label}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Font weights */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-neutral-700">الخط — Graphik Arabic</h3>
          <div className="space-y-1">
            <p className="text-lg font-light text-neutral-700">صُنع في الجزائر — الخط الخفيف (font-light 300)</p>
            <p className="text-lg font-normal text-neutral-700">صُنع في الجزائر — الخط العادي (font-normal 400)</p>
            <p className="text-lg font-bold text-neutral-700">صُنع في الجزائر — الخط العريض (font-bold 700)</p>
            <p className="text-lg font-extrabold text-neutral-700">صُنع في الجزائر — الخط الأعرض (font-extrabold 800)</p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
