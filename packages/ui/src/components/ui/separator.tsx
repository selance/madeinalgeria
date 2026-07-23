"use client";

import * as React from "react";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

import { cn } from "../../lib/utils";

type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive>;

const Separator = ({ className, orientation = "horizontal", ...props }: SeparatorProps) => (
  <SeparatorPrimitive
    orientation={orientation}
    className={cn("bg-neutral-200 shrink-0", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)}
    {...props}
  />
);
Separator.displayName = "Separator";

export { Separator };
