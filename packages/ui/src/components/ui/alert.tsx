import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const alertVariants = cva(
  "relative w-full rounded-card border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-white border-neutral-200 text-neutral-700",
        destructive: "bg-error-50 border-error-200 text-error-700 [&>svg]:text-error-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = ({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) => (
  <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
);
Alert.displayName = "Alert";

const AlertTitle = ({ className, ...props }: React.ComponentProps<"h5">) => (
  <h5 className={cn("mb-1 leading-none font-medium tracking-tight", className)} {...props} />
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
