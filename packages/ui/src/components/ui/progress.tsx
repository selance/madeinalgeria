"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "../../lib/utils";

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root>;
const Progress = ({ className, value, ...props }: ProgressProps) => (
  <ProgressPrimitive.Root value={value} className={cn("relative w-full", className)} {...props}>
    <ProgressPrimitive.Track className="bg-neutral-200 relative h-2 w-full overflow-hidden rounded-full">
      <ProgressPrimitive.Indicator
        className="bg-primary-500 data-[complete]:bg-primary-500 data-[progressing]:bg-primary-500 h-full transition-all"
        style={{
          width: `${value || 0}%`,
          transition: "width 0.3s ease-in-out",
        }}
      />
    </ProgressPrimitive.Track>
  </ProgressPrimitive.Root>
);
Progress.displayName = "Progress";

type ProgressLabelProps = React.ComponentProps<typeof ProgressPrimitive.Label>;

const ProgressLabel = ({ className, ...props }: ProgressLabelProps) => (
  <ProgressPrimitive.Label className={cn("text-sm font-medium", className)} {...props} />
);
ProgressLabel.displayName = "ProgressLabel";

type ProgressValueProps = React.ComponentProps<typeof ProgressPrimitive.Value>;

const ProgressValue = ({ className, ...props }: ProgressValueProps) => (
  <ProgressPrimitive.Value className={cn("text-neutral-500 text-sm", className)} {...props} />
);
ProgressValue.displayName = "ProgressValue";

export { Progress, ProgressLabel, ProgressValue };
