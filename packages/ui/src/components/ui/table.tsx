import * as React from "react";
import { cn } from "../../lib/utils";

const Table = ({ className, ...props }: React.ComponentProps<"table">) => (
  <div className="relative w-full overflow-auto">
    <table className={cn("w-full caption-bottom text-sm bg-neutral-50 rounded-card", className)} {...props} />
  </div>
);
Table.displayName = "Table";

const TableHeader = ({ className, ...props }: React.ComponentProps<"thead">) => (
  <thead className={cn("[&_tr]:border-b", className)} {...props} />
);
TableHeader.displayName = "TableHeader";

const TableBody = ({ className, ...props }: React.ComponentProps<"tbody">) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);
TableBody.displayName = "TableBody";

const TableFooter = ({ className, ...props }: React.ComponentProps<"tfoot">) => (
  <tfoot className={cn("bg-neutral-50 border-t border-neutral-200 font-medium [&>tr]:last:border-b-0", className)} {...props} />
);
TableFooter.displayName = "TableFooter";

const TableRow = ({ className, ...props }: React.ComponentProps<"tr">) => (
  <tr
    className={cn("hover:bg-neutral-100 data-[state=selected]:bg-neutral-100 text-neutral-500 border-b !border-neutral-200 transition-colors", className)}
    {...props}
  />
);
TableRow.displayName = "TableRow";

const TableHead = ({ className, ...props }: React.ComponentProps<"th">) => (
  <th
    className={cn(
      "text-neutral-500 text-sm h-10 px-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
);
TableHead.displayName = "TableHead";

const TableCell = ({ className, ...props }: React.ComponentProps<"td">) => (
  <td
    className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)}
    {...props}
  />
);
TableCell.displayName = "TableCell";

const TableCaption = ({ className, ...props }: React.ComponentProps<"caption">) => (
  <caption className={cn("text-neutral-500 mt-4 text-sm", className)} {...props} />
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
