import { Button, type ButtonProps } from "@mia/ui/components/button";
import PlusIcon from "@mia/ui/icons/PlusIcon";
import SearchIcon from "@mia/ui/icons/SearchIcon";
import { SectionShell } from "./SectionShell";

type Variant = NonNullable<ButtonProps["variant"]>;

// Color families × styles, straight from the buttonVariants CVA map.
const families: { label: string; variants: Variant[] }[] = [
  { label: "الأساسي — primary", variants: ["primary-solid", "primary-outline", "primary-ghost"] },
  { label: "الثانوي — secondary", variants: ["secondary-solid", "secondary-outline", "secondary-ghost"] },
  { label: "داكن — dark", variants: ["dark-solid", "dark-outline", "dark-ghost"] },
  { label: "فاتح — light", variants: ["light-solid", "light-outline", "light-ghost"] },
  { label: "نجاح — success", variants: ["success-solid", "success-outline", "success-ghost"] },
  { label: "خطأ — error", variants: ["error-solid", "error-outline", "error-ghost"] },
  { label: "تحذير — warning", variants: ["warning-solid", "warning-outline", "warning-ghost"] },
  { label: "معلومة — info", variants: ["info-solid", "info-outline", "info-ghost"] },
  { label: "زمردي — emerald", variants: ["emerald-solid", "emerald-outline", "emerald-ghost"] },
  { label: "خاص — special", variants: ["white-solid", "soft", "soft-rounded", "sidebar-icon"] },
];

export function ButtonsSection() {
  return (
    <SectionShell
      id="buttons"
      title="الأزرار — Buttons"
      subtitle="Every variant × style from buttonVariants, plus sizes, states & icon buttons"
    >
      <div className="space-y-6">
        {families.map((family) => (
          <div key={family.label}>
            <code className="mb-2 block text-[11px] text-neutral-400" dir="ltr">
              {family.label}
            </code>
            <div className="flex flex-wrap items-center gap-3">
              {family.variants.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant.includes("icon") ? <PlusIcon className="size-4 fill-neutral-700" /> : variant}
                </Button>
              ))}
            </div>
          </div>
        ))}

        {/* Sizes */}
        <div>
          <code className="mb-2 block text-[11px] text-neutral-400" dir="ltr">
            sizes: sm / default / lg
          </code>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">صغير</Button>
            <Button size="default">افتراضي</Button>
            <Button size="lg">كبير</Button>
          </div>
        </div>

        {/* Icon buttons */}
        <div>
          <code className="mb-2 block text-[11px] text-neutral-400" dir="ltr">
            icon sizes: small-icon / icon / large-icon
          </code>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="small-icon" variant="light-solid">
              <SearchIcon className="size-4" />
            </Button>
            <Button size="icon" variant="primary-solid">
              <PlusIcon className="size-4 fill-neutral-50" />
            </Button>
            <Button size="large-icon" variant="dark-solid">
              <PlusIcon className="size-5 fill-neutral-50" />
            </Button>
          </div>
        </div>

        {/* States */}
        <div>
          <code className="mb-2 block text-[11px] text-neutral-400" dir="ltr">
            states: disabled / pending
          </code>
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled>معطّل</Button>
            <Button disabled variant="primary-solid">
              جارٍ التحميل...
            </Button>
            <Button asChild variant="primary-outline">
              <a href="#buttons">رابط كزر (asChild)</a>
            </Button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
