import * as React from "react";
import { LuChevronLeft, LuFlipHorizontal } from "react-icons/lu";
import { cn } from "../../lib/utils";
import { Slot } from "radix-ui";

const Breadcrumb = ({
  ...props
}: React.ComponentProps<"nav"> & {
  separator?: React.ReactNode;
}) => <nav aria-label="breadcrumb" {...props} />;
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = ({ className, ...props }: React.ComponentProps<"ol">) => (
  <ol
    className={cn(
      "text-neutral-500 flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
      className,
    )}
    {...props}
  />
);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = ({ className, ...props }: React.ComponentProps<"li">) => (
  <li className={cn("inline-flex items-center gap-1.5", className)} {...props} />
);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = ({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
}) => {
  const Comp = asChild ? Slot.Root : "a";

  return <Comp className={cn("hover:text-neutral-800 transition-colors", className)} {...props} />;
};
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("text-neutral-800 font-normal", className)}
    {...props}
  />
);
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<"li">) => (
  <li role="presentation" aria-hidden="true" className={cn("[&>svg]:h-3.5 [&>svg]:w-3.5", className)} {...props}>
    {children ?? <LuChevronLeft />}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <LuFlipHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
