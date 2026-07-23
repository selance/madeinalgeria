import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mia/ui/components/table";
import { Button } from "@mia/ui/components/button";
import { PaginationControls, type PaginationData } from "@mia/ui/components/pagination";

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  /** Keyset "load more" (used where the endpoint has no total count). */
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  /** Numbered pagination — takes precedence over load-more when provided. */
  pagination?: PaginationData;
  onPageChange?: (page: number) => void;
  /** Placeholder column count for the loading skeleton (defaults to columns.length). */
  skeletonColumns?: number;
  /** Makes each row clickable (whole-row affordance). */
  onRowClick?: (row: T) => void;
}

/**
 * Layout-mirroring table skeleton (dashboard idiom): a header row
 * of placeholder blocks plus ~8 body rows of varied-width `animate-pulse` cells,
 * so the real table snaps in without the page jumping. Exported so page-level
 * skeletons can reuse the exact table anatomy.
 */
export function DataTableSkeleton({ columns = 5, rows = 8 }: { columns?: number; rows?: number }) {
  const cols = Math.max(1, columns);
  // First column is the "entity" cell (avatar + two lines); the rest are narrower.
  const cellWidth = (col: number) => (col === 0 ? "w-40" : col === cols - 1 ? "w-24" : col % 2 === 0 ? "w-20" : "w-28");
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="w-full overflow-x-auto rounded bg-white">
        <Table dir="rtl">
          <TableHeader dir="rtl" className="sticky top-0 z-10">
            <TableRow>
              {Array.from({ length: cols }).map((_, col) => (
                <TableHead dir="rtl" key={col} className="bg-white text-center">
                  <div className={`mx-auto h-4 rounded bg-neutral-200 ${col === 0 ? "w-16" : "w-12"}`} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, row) => (
              <TableRow key={row} className="animate-pulse">
                {Array.from({ length: cols }).map((_, col) => (
                  <TableCell key={col}>
                    {col === 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="size-8 shrink-0 rounded bg-neutral-200" />
                        <div className="flex flex-col gap-1.5">
                          <div className="h-3.5 w-28 rounded bg-neutral-200" />
                          <div className="h-2.5 w-16 rounded bg-neutral-200" />
                        </div>
                      </div>
                    ) : (
                      <div className={`mx-auto h-6 rounded bg-neutral-200 ${cellWidth(col)}`} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** The one shared table: core row model, RTL, numbered pagination or keyset load-more. */
export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "لا توجد بيانات",
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  pagination,
  onPageChange,
  skeletonColumns,
  onRowClick,
}: DataTableProps<T>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  if (isLoading) {
    return <DataTableSkeleton columns={skeletonColumns ?? columns.length} />;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="w-full overflow-x-auto rounded bg-white">
        <Table dir="rtl">
          <TableHeader dir="rtl" className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead dir="rtl" className="bg-white text-center" key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-neutral-400">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={onRowClick ? "cursor-pointer" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && onPageChange ? (
        <PaginationControls pagination={pagination} onPageChange={onPageChange} />
      ) : (
        hasMore &&
        onLoadMore && (
          <Button
            variant="light-solid"
            className="mx-auto min-w-[200px]"
            disabled={isLoadingMore}
            onClick={onLoadMore}
          >
            {isLoadingMore ? "جارٍ التحميل..." : "عرض المزيد"}
          </Button>
        )
      )}
    </div>
  );
}
