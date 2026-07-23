"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

interface AnchoredDropdownProps {
  /** Element the panel anchors under (usually the input wrapper). */
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  /** Fired on outside click / Escape-equivalent close requests. */
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * A panel that renders under `anchorRef` via a body portal — so it floats above
 * everything regardless of parent stacking contexts (fixes dropdowns hiding
 * behind transformed/animated siblings). Matches the design system's popover
 * surface (rounded, white, drop-shadow-default) and keeps focus on the anchor's
 * input (unlike a focus-trapping popover).
 */
export function AnchoredDropdown({ anchorRef, open, onClose, className, children }: AnchoredDropdownProps) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const popupRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  const reposition = React.useCallback(() => {
    const el = anchorRef.current;
    if (el) setRect(el.getBoundingClientRect());
  }, [anchorRef]);

  React.useLayoutEffect(() => {
    if (!open) return;
    reposition();
    // Keep aligned while the page scrolls or resizes under the open panel.
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose, anchorRef]);

  if (!mounted || !open || !rect) return null;

  return createPortal(
    <div
      ref={popupRef}
      style={{ position: "fixed", top: rect.bottom + 6, left: rect.left, width: rect.width, zIndex: 70 }}
      className={cn(
        "animate-in fade-in-0 zoom-in-95 rounded-card border border-neutral-200 bg-white p-1.5 drop-shadow-default",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}
