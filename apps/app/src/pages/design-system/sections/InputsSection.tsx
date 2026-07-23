import { useState } from "react";
import { FieldRoot, Label } from "@mia/ui/components/label";
import { Input } from "@mia/ui/components/input";
import { Textarea } from "@mia/ui/components/textarea";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@mia/ui/components/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mia/ui/components/select";
import { MultiSelect } from "@mia/ui/components/multi-select";
import { Checkbox } from "@mia/ui/components/checkbox";
import { RadioGroup, RadioGroupItem } from "@mia/ui/components/radio-group";
import { Switch } from "@mia/ui/components/switch";
import { Slider } from "@mia/ui/components/slider";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@mia/ui/components/input-otp";
import { Calendar } from "@mia/ui/components/calendar";
import SearchIcon from "@mia/ui/icons/SearchIcon";
import EmailIcon from "@mia/ui/icons/EmailIcon";
import { SectionShell } from "./SectionShell";

const CITY_OPTIONS = [
  { label: "الجزائر", value: "algiers" },
  { label: "وهران", value: "oran" },
  { label: "قسنطينة", value: "constantine" },
  { label: "عنابة", value: "annaba" },
];

export function InputsSection() {
  const [city, setCity] = useState("");
  const [otp, setOtp] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <SectionShell
      id="inputs"
      title="حقول الإدخال — Inputs"
      subtitle="Input, Textarea, InputGroup, Select, MultiSelect, Checkbox, Radio, Switch, Slider, OTP, Calendar"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Text input */}
        <FieldRoot className="flex flex-col gap-2">
          <Label htmlFor="ds-name">الاسم</Label>
          <Input id="ds-name" placeholder="أدخل اسمك" className="h-11" />
        </FieldRoot>

        {/* Input group with icon addon */}
        <FieldRoot className="flex flex-col gap-2">
          <Label htmlFor="ds-search">بحث (InputGroup)</Label>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput id="ds-search" placeholder="ابحث عن شركة..." />
          </InputGroup>
        </FieldRoot>

        {/* Email input group */}
        <FieldRoot className="flex flex-col gap-2">
          <Label htmlFor="ds-email">البريد الإلكتروني</Label>
          <InputGroup>
            <InputGroupAddon>
              <EmailIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput id="ds-email" type="email" placeholder="name@madeinalgeria.dev" />
          </InputGroup>
        </FieldRoot>

        {/* Select */}
        <FieldRoot className="flex flex-col gap-2">
          <Label>المدينة (Select)</Label>
          <Select value={city} onValueChange={(v: string | null) => setCity(v ?? "")}>
            <SelectTrigger>
              <SelectValue>{CITY_OPTIONS.find((o) => o.value === city)?.label ?? "اختر المدينة"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRoot>

        {/* Multi select */}
        <FieldRoot className="flex flex-col gap-2">
          <Label>مدن متعددة (MultiSelect)</Label>
          <MultiSelect options={CITY_OPTIONS} onValueChange={() => {}} placeholder="اختر المدن" />
        </FieldRoot>

        {/* Textarea */}
        <FieldRoot className="flex flex-col gap-2">
          <Label htmlFor="ds-note">ملاحظة (Textarea)</Label>
          <Textarea id="ds-note" placeholder="اكتب ملاحظتك هنا..." />
        </FieldRoot>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Checkbox */}
        <div className="flex flex-col gap-3">
          <code className="text-[11px] text-neutral-400" dir="ltr">
            Checkbox
          </code>
          <FieldRoot className="flex items-center gap-2 space-y-0">
            <Checkbox id="ds-cb" defaultChecked />
            <Label htmlFor="ds-cb" className="cursor-pointer">
              أوافق على الشروط
            </Label>
          </FieldRoot>
        </div>

        {/* Switch */}
        <div className="flex flex-col gap-3">
          <code className="text-[11px] text-neutral-400" dir="ltr">
            Switch
          </code>
          <FieldRoot className="flex items-center gap-2 space-y-0">
            <Switch id="ds-switch" defaultChecked />
            <Label htmlFor="ds-switch" className="cursor-pointer">
              تفعيل الإشعارات
            </Label>
          </FieldRoot>
        </div>

        {/* Radio group */}
        <div className="flex flex-col gap-3">
          <code className="text-[11px] text-neutral-400" dir="ltr">
            RadioGroup
          </code>
          <FieldRoot className="space-y-0">
            <RadioGroup defaultValue="monthly" className="gap-3">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="monthly" id="ds-r-monthly" />
                <Label htmlFor="ds-r-monthly" className="cursor-pointer">
                  شهري
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yearly" id="ds-r-yearly" />
                <Label htmlFor="ds-r-yearly" className="cursor-pointer">
                  سنوي
                </Label>
              </div>
            </RadioGroup>
          </FieldRoot>
        </div>

        {/* Slider */}
        <div className="flex flex-col gap-3">
          <code className="text-[11px] text-neutral-400" dir="ltr">
            Slider
          </code>
          <Slider defaultValue={50} className="max-w-xs" />
        </div>

        {/* OTP */}
        <div className="flex flex-col gap-3">
          <code className="text-[11px] text-neutral-400" dir="ltr">
            InputOTP
          </code>
          <InputOTP maxLength={5} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Calendar */}
        <div className="flex flex-col gap-3 md:col-span-2">
          <code className="text-[11px] text-neutral-400" dir="ltr">
            Calendar (single)
          </code>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-card w-fit border !border-neutral-200 bg-white"
          />
        </div>
      </div>
    </SectionShell>
  );
}
