import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { NewsletterStatus, NewsletterSubscriberSummary } from "@mia/contracts";
import { formatDateAr } from "@mia/core";
import { Badge } from "@mia/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mia/ui/components/select";
import { DataTable } from "@/components/DataTable";
import { SearchBar } from "@/components/SearchBar";
import { useDebounce } from "@/hooks/useDebounce";
import { useNewsletterSubscribers } from "@/lib/hooks";

const PAGE_SIZE = 20;

type StatusFilter = "" | NewsletterStatus;

const STATUS_LABELS: Record<StatusFilter, string> = {
  "": "كل الحالات",
  pending: "بانتظار التأكيد",
  subscribed: "مشترك",
  unsubscribed: "ملغى",
};

/** Toolbar placeholder mirroring the SearchBar pill (search + status filter + count). */
function NewsletterToolbarSkeleton() {
  return (
    <div className="rounded-card drop-shadow-default w-full animate-pulse bg-gradient-to-t from-neutral-50 via-neutral-50 to-white p-[1px] sm:h-[60px]">
      <div className="flex h-full w-full flex-col items-center justify-between gap-3 rounded-[19px] bg-neutral-50 px-3 py-3 sm:flex-row sm:py-0">
        <div className="flex w-full items-center gap-3 sm:w-fit">
          <div className="h-10 w-full rounded bg-neutral-200 sm:w-[300px]" />
          <div className="h-10 w-[160px] rounded bg-neutral-200" />
        </div>
        <div className="h-4 w-24 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: NewsletterStatus }) {
  if (status === "subscribed") return <Badge variant="success">مشترك</Badge>;
  if (status === "unsubscribed") return <Badge variant="soft">ملغى</Badge>;
  return <Badge variant="warning">بانتظار التأكيد</Badge>;
}

const NewsletterPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const { items, pagination, isLoading } = useNewsletterSubscribers(
    status,
    debouncedSearch,
    page,
    PAGE_SIZE,
  );

  const columns: ColumnDef<NewsletterSubscriberSummary, unknown>[] = [
    {
      header: "البريد الإلكتروني",
      accessorKey: "email",
      cell: ({ row }) => (
        <div dir="ltr" className="text-start font-medium text-neutral-700">
          {row.original.email}
        </div>
      ),
    },
    {
      header: "الحالة",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: "المصدر",
      cell: ({ row }) => <span className="text-sm text-neutral-500">{row.original.source}</span>,
    },
    {
      header: "تاريخ الاشتراك",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500">
          {formatDateAr(row.original.createdAt)}
        </span>
      ),
    },
    {
      header: "تاريخ التأكيد",
      cell: ({ row }) => (
        <span className="text-sm text-neutral-500">
          {row.original.confirmedAt
            ? formatDateAr(row.original.confirmedAt)
            : "—"}
        </span>
      ),
    },
  ];

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      {isLoading && items.length === 0 ? (
        <NewsletterToolbarSkeleton />
      ) : (
        <SearchBar
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="بحث بالبريد الإلكتروني..."
          filters={
            <Select
              value={status}
              onValueChange={(value: string | null) => {
                setStatus((value ?? "") as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue>{STATUS_LABELS[status]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">كل الحالات</SelectItem>
                <SelectItem value="subscribed">مشترك</SelectItem>
                <SelectItem value="pending">بانتظار التأكيد</SelectItem>
                <SelectItem value="unsubscribed">ملغى</SelectItem>
              </SelectContent>
            </Select>
          }
          actions={
            <span className="text-sm text-neutral-500">
              {pagination.total_count.toLocaleString("ar-DZ")} مشترك
            </span>
          }
        />
      )}

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="لا يوجد مشتركون"
      />
    </section>
  );
};

export default NewsletterPage;
