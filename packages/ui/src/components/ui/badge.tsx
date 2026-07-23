import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
const badgeVariants = cva(
  "inline-flex items-center select-none whitespace-nowrap rounded px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 w-fit",
  {
    variants: {
      variant: {
        default: "bg-neutral-100 text-neutral-600",
        soft: "bg-neutral-50 text-neutral-500",
        primary: "bg-primary-500 text-neutral-50",
        success: "bg-success-50 text-success-700 border border-success-200",
        warning: "bg-warning-50 text-warning-700 border border-warning-200",
        error: "bg-error-50 text-error-700 border border-error-200",
        info: "bg-info-50 text-info-700 border border-info-200",
        emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        light: "bg-white border border-neutral-200 text-neutral-600",
        dark: "bg-neutral-900 text-neutral-100",
        outline: "border border-neutral-300 text-neutral-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.ComponentProps<"div">, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
