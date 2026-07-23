import type { ReactNode } from "react";
import { Button } from "@mia/ui/components/button";
import { Input } from "@mia/ui/components/input";
import { cn } from "@mia/ui";
import SearchIcon from "@mia/ui/icons/SearchIcon";

interface SearchBarProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Filter controls rendered beside the input — a FilterPopover or inline Selects. */
  filters?: ReactNode;
  /** Right-aligned slot for counts / page actions (e.g. an "add" button). */
  actions?: ReactNode;
  inputClassName?: string;
}

/**
 * The gradient "pill" search bar shared across admin list pages — mirrors the
 * user app's dashboard search bar (apps/app/.../CompaniesPage.tsx). The search
 * icon button is decorative: filtering is live/debounced, not submit-driven.
 */
export function SearchBar({
  value,
  onValueChange,
  placeholder,
  filters,
  actions,
  inputClassName,
}: SearchBarProps) {
  return (
    <section
      id="search-bar"
      className="rounded-card drop-shadow-default w-full bg-gradient-to-t from-neutral-50 via-neutral-50 to-white p-[1px] sm:h-[60px]"
    >
      <div className="flex h-full w-full flex-col items-center justify-between gap-3 rounded-[19px] bg-neutral-50 px-3 py-3 sm:flex-row sm:py-0">
        <section className="relative z-10 flex w-full items-center gap-3 sm:w-fit">
          <Input
            value={value}
            onValueChange={onValueChange}
            placeholder={placeholder}
            className={cn("w-full sm:w-[300px]", inputClassName)}
          />
          {filters}
          <Button size="large-icon" aria-label="بحث">
            <SearchIcon className="fill-primary-50 size-[22px]" />
          </Button>
        </section>
        {actions && <div className="flex w-full items-center gap-2 sm:w-fit">{actions}</div>}
      </div>
    </section>
  );
}
