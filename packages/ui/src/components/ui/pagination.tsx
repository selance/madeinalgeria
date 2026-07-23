"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../../components/ui/button";
import Chevron2LeftIcon from "../../icons/Chevron2LeftIcon";
import ChevronLeftIcon from "../../icons/ChevronLeftIcon";
import ChevronRightIcon from "../../icons/ChevronRightIcon";
import Chevron2RightIcon from "../../icons/Chevron2RightIcon";
import { cn } from "../../lib/utils";

export interface PaginationData {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
}

interface PaginationControlsProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  pages.push(1);

  if (start > 2) {
    pages.push(null);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < total - 1) {
    pages.push(null);
  }

  pages.push(total);

  return pages;
}

/** Clickable ellipsis that turns into a go-to-page input */
const EllipsisInput = ({
  totalPages,
  onPageChange,
}: {
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const submit = useCallback(() => {
    const pageNum = parseInt(value, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    }
    setIsEditing(false);
    setValue("");
  }, [value, totalPages, onPageChange]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={totalPages}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setIsEditing(false);
            setValue("");
          }
        }}
        onBlur={submit}
        placeholder="..."
        className="size-8 rounded border border-neutral-200 bg-white text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="flex size-8 cursor-pointer items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
      title="انتقل إلى صفحة محددة"
    >
      <span className="text-sm tracking-widest">...</span>
    </button>
  );
};

const PaginationControls = ({ pagination, onPageChange, className }: PaginationControlsProps) => {
  const { page, total_pages, total_count, limit } = pagination;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total_count);

  if (total_pages <= 1) return null;

  const pages = getPageNumbers(page, total_pages);

  return (
    // Mobile: stacked, controls spread across the full parent width. sm+: single row.
    <div className={cn("mt-4 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between", className)}>
      {/* Info section */}
      <section className="flex items-center justify-center gap-2 sm:justify-start">
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          صفحة {page} من {total_pages}
        </div>
        <div className="text-sm text-neutral-500">
          ({startItem}-{endItem} من {total_count})
        </div>
      </section>

      {/* Controls section */}
      <section className="flex w-full items-center justify-between gap-2 sm:w-auto">
        {/* First & Previous */}
        <div className="flex items-center gap-2">
          <Button variant="light-solid" size="small-icon" onClick={() => onPageChange(1)} disabled={page === 1}>
            <span className="sr-only">الانتقال إلى الصفحة الأولى</span>
            <Chevron2RightIcon />
          </Button>
          <Button variant="light-solid" size="small-icon" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
            <span className="sr-only">الصفحة السابقة</span>
            <ChevronRightIcon />
          </Button>
        </div>

        {/* Page number buttons */}
        <div className="flex items-center gap-0.5">
          {pages.map((p, i) =>
            p === null ? (
              <EllipsisInput key={`ellipsis-${i}`} totalPages={total_pages} onPageChange={onPageChange} />
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => p !== page && onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex size-8 cursor-pointer items-center justify-center rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
                  p === page
                    ? "bg-primary-500 text-neutral-50"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100",
                )}
              >
                {p}
              </button>
            ),
          )}
        </div>

        {/* Next & Last */}
        <div className="flex items-center gap-2">
          <Button variant="light-solid" size="small-icon" onClick={() => onPageChange(page + 1)} disabled={page === total_pages}>
            <span className="sr-only">الصفحة التالية</span>
            <ChevronLeftIcon />
          </Button>
          <Button variant="light-solid" size="small-icon" onClick={() => onPageChange(total_pages)} disabled={page === total_pages}>
            <span className="sr-only">الانتقال إلى الصفحة الأخيرة</span>
            <Chevron2LeftIcon />
          </Button>
        </div>
      </section>
    </div>
  );
};
PaginationControls.displayName = "PaginationControls";

export { PaginationControls };
