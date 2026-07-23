import { useEffect, useRef, useState } from "react";
import { Button } from "@mia/ui/components/button";
import { FieldRoot, Label } from "@mia/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@mia/ui/components/select";
import { Popover, PopoverContent, PopoverTrigger } from "@mia/ui/components/popover";
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@mia/ui/components/combobox";
import { Badge } from "@mia/ui/components/badge";
import { cn, buttonVariants } from "@mia/ui";
import OptionsIcon from "@mia/ui/icons/OptionsIcon";
import CloseIcon from "@mia/ui/icons/CloseIcon";

export interface FilterOption {
  value: string;
  label: string;
}

export type FilterValues = Record<string, string | string[]>;

export type FilterField =
  | {
      type: "select";
      key: string;
      label: string;
      /** Label for the "no filter" option (defaults to "الكل"). */
      allLabel?: string;
      options: FilterOption[];
    }
  | {
      type: "multiselect";
      key: string;
      label: string;
      allLabel?: string;
      searchPlaceholder?: string;
      options: FilterOption[];
    };

interface FilterPopoverProps {
  fields: FilterField[];
  /** Committed filter values, keyed by field.key. */
  values: FilterValues;
  onApply: (values: FilterValues) => void;
  disabled?: boolean;
}

const emptyFor = (field: FilterField): string | string[] => (field.type === "multiselect" ? [] : "");

const isActiveValue = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v.length > 0 : Boolean(v);

/**
 * Config-driven filter popover — the admin counterpart to the user app's
 * SearchOptionsPopover. Edits stage into local state and only commit on
 * "تطبيق"; "إعادة تعيين" clears everything.
 */
export function FilterPopover({ fields, values, onApply, disabled }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [local, setLocal] = useState<FilterValues>(values);

  // Re-sync when committed values change externally (e.g. URL navigation).
  useEffect(() => {
    setLocal(values);
  }, [values]);

  const hasActiveFilters = fields.some((f) => isActiveValue(values[f.key]));

  const setField = (key: string, value: string | string[]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  const apply = () => {
    onApply(local);
    setOpen(false);
  };

  const reset = () => {
    const cleared: FilterValues = {};
    for (const f of fields) cleared[f.key] = emptyFor(f);
    setLocal(cleared);
    onApply(cleared);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "soft", size: "large-icon" }),
          hasActiveFilters && "bg-primary-100 text-primary-600",
        )}
        aria-label="خيارات البحث"
      >
        <OptionsIcon className="size-[22px]" />
      </PopoverTrigger>
      <PopoverContent ref={ref} dir="rtl" className="min-h-fit w-64 p-4">
        <FieldRoot>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">خيارات البحث</h4>
              {hasActiveFilters && (
                <Button variant="light-solid" size="sm" onClick={reset} className="text-xs">
                  إعادة تعيين
                </Button>
              )}
            </div>

            {fields.map((field) => {
              if (field.type === "select") {
                const current = (local[field.key] as string | undefined) ?? "";
                const selected = field.options.find((o) => o.value === current);
                return (
                  <div key={field.key} className="flex flex-col gap-2">
                    <Label className="text-sm">{field.label}</Label>
                    <Select
                      value={current}
                      onValueChange={(value: string | null) => setField(field.key, value ?? "")}
                      disabled={disabled}
                    >
                      <SelectTrigger dir="rtl">
                        <SelectValue className="min-w-0 truncate">
                          {selected ? selected.label : (field.allLabel ?? "الكل")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent container={ref}>
                        <SelectItem value="">{field.allLabel ?? "الكل"}</SelectItem>
                        {field.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              const current = (local[field.key] as string[] | undefined) ?? [];
              const labelFor = (value: string) =>
                field.options.find((o) => o.value === value)?.label ?? value;
              return (
                <div key={field.key} className="z-[100] flex flex-col gap-2">
                  <Label className="text-sm">{field.label}</Label>
                  <Combobox
                    multiple
                    value={current}
                    onValueChange={(value: string[]) => setField(field.key, value)}
                    disabled={disabled}
                  >
                    <ComboboxTrigger className="w-full">
                      <ComboboxValue>
                        {current.length === 0
                          ? (field.allLabel ?? "الكل")
                          : `${current.length} مختارة`}
                      </ComboboxValue>
                    </ComboboxTrigger>
                    <ComboboxContent
                      container={ref}
                      inputPlaceholder={field.searchPlaceholder ?? "ابحث..."}
                    >
                      {field.options.map((option) => (
                        <ComboboxItem key={option.value} value={option.value}>
                          {option.label}
                        </ComboboxItem>
                      ))}
                    </ComboboxContent>
                  </Combobox>

                  {current.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {current.slice(0, 3).map((value) => (
                        <Badge key={value} className="gap-1 bg-neutral-100 px-[4px] hover:bg-neutral-100/80">
                          <span>{labelFor(value)}</span>
                          <button
                            type="button"
                            onClick={() => setField(field.key, current.filter((v) => v !== value))}
                            className="rounded-full p-0.5 hover:bg-neutral-200"
                          >
                            <CloseIcon className="size-3" />
                          </button>
                        </Badge>
                      ))}
                      {current.length > 3 && (
                        <>
                          <Badge className="bg-neutral-200 px-2 hover:bg-neutral-200/80">
                            و {current.length - 3} أخرى
                          </Badge>
                          <Badge
                            className="!border-error-100 cursor-pointer gap-1 bg-error-50 px-[4px] hover:bg-error-100"
                            onClick={() => setField(field.key, [])}
                          >
                            <CloseIcon className="size-3" />
                          </Badge>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex gap-2 pt-2">
              <Button onClick={apply} className="flex-1">
                تطبيق المرشحات
              </Button>
            </div>
          </div>
        </FieldRoot>
      </PopoverContent>
    </Popover>
  );
}
