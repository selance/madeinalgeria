"use client";

import * as React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "../../lib/utils";

type ScrollAreaProps = React.ComponentProps<typeof ScrollAreaPrimitive.Root>;

const ScrollArea = ({ className, children, ...props }: ScrollAreaProps) => (
  <ScrollAreaPrimitive.Root className={cn("relative overflow-hidden", className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      <ScrollAreaPrimitive.Content>{children}</ScrollAreaPrimitive.Content>
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollBar orientation="horizontal" />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
);
ScrollArea.displayName = "ScrollArea";

type ScrollBarProps = React.ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>;

const ScrollBar = ({ className, orientation = "vertical", ...props }: ScrollBarProps) => (
  <ScrollAreaPrimitive.Scrollbar
    orientation={orientation}
    className={cn(
      "flex touch-none transition-colors select-none",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className,
    )}
    {...props}
  >
    {/* neutral-300, not the undefined `border` token (which rendered invisible) */}
    <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-neutral-300 data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" />
  </ScrollAreaPrimitive.Scrollbar>
);
ScrollBar.displayName = "ScrollBar";

/**
 * Raw root for custom compositions. The composed `ScrollArea` above always
 * mounts a horizontal scrollbar, which lets content size to fit-content —
 * wrong for vertical-only surfaces (chat threads) where wide children must
 * clip and scroll inside their own containers instead.
 */
type ScrollAreaRootProps = React.ComponentProps<typeof ScrollAreaPrimitive.Root>;

const ScrollAreaRoot = ({ className, ...props }: ScrollAreaRootProps) => (
  <ScrollAreaPrimitive.Root className={cn("relative overflow-hidden", className)} {...props} />
);
ScrollAreaRoot.displayName = "ScrollAreaRoot";

type ScrollAreaViewportProps = React.ComponentProps<typeof ScrollAreaPrimitive.Viewport>;

const ScrollAreaViewport = ({ className, ...props }: ScrollAreaViewportProps) => (
  <ScrollAreaPrimitive.Viewport className={cn("h-full w-full rounded-[inherit]", className)} {...props} />
);
ScrollAreaViewport.displayName = "ScrollAreaViewport";

type ScrollAreaContentProps = React.ComponentProps<typeof ScrollAreaPrimitive.Content>;

const ScrollAreaContent = ({ className, ...props }: ScrollAreaContentProps) => (
  <ScrollAreaPrimitive.Content className={cn(className)} {...props} />
);
ScrollAreaContent.displayName = "ScrollAreaContent";

export { ScrollArea, ScrollAreaRoot, ScrollBar, ScrollAreaViewport, ScrollAreaContent };
