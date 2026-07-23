import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@mia/ui/components/table";
import { Badge } from "@mia/ui/components/badge";
import type { BadgeProps } from "@mia/ui/components/badge";
import { SectionShell } from "./SectionShell";

type Row = {
  name: string;
  city: string;
  amount: number;
  status: { label: string; variant: NonNullable<BadgeProps["variant"]> };
};

const ROWS: Row[] = [
  { name: "شركة النور", city: "الجزائر", amount: 12500, status: { label: "نشط", variant: "success" } },
  { name: "مؤسسة الأمل", city: "وهران", amount: 8300, status: { label: "قيد المراجعة", variant: "warning" } },
  { name: "مجموعة الرواد", city: "قسنطينة", amount: 21750, status: { label: "موقوف", variant: "error" } },
  { name: "شركة الفجر", city: "عنابة", amount: 4600, status: { label: "نشط", variant: "success" } },
];

export function TableSection() {
  return (
    <SectionShell
      id="table"
      title="الجداول — Table"
      subtitle="Design-system Table with badges & Western digits"
    >
      <div className="rounded-card overflow-hidden border !border-neutral-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الشركة</TableHead>
              <TableHead className="text-right">المدينة</TableHead>
              <TableHead className="text-right">المبلغ (دج)</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium text-neutral-700">{row.name}</TableCell>
                <TableCell>{row.city}</TableCell>
                <TableCell>{row.amount.toLocaleString("en-US")}</TableCell>
                <TableCell>
                  <Badge variant={row.status.variant}>{row.status.label}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionShell>
  );
}
