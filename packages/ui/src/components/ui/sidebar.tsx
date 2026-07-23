"use client";
import * as React from "react";
import { Slot } from "radix-ui";
import { VariantProps, cva } from "class-variance-authority";
import { LuPanelLeft } from "react-icons/lu";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Skeleton } from "../../components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { cn } from "../../lib/utils";
import { useIsMobile } from "../../hooks/useIsMobile";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "320px";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

// Helper to read cookie value
function getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

const SidebarProvider = ({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ref,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  // Read initial state from cookie
  const [mounted, setMounted] = React.useState(false);
  const cookieValue = mounted ? getCookieValue(SIDEBAR_COOKIE_NAME) : null;
  const initialOpen = cookieValue !== null ? cookieValue === "true" : defaultOpen;

  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [_open, _setOpen] = React.useState(initialOpen);
  const open = openProp ?? _open;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;

      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      const newMobileState = !openMobile;
      setOpenMobile(newMobileState);
    } else {
      const newDesktopState = !open;
      setOpen(newDesktopState);
    }
  }, [isMobile, open, openMobile, setOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContext>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider  value={contextValue}>
      <TooltipProvider delay={200}>
        <div
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-[[data-variant=inset]]:bg-neutral-50 rounded-card flex min-h-svh w-full",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
};
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = ({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        className={cn("bg-neutral-50 text-neutral-500 flex h-full w-(--sidebar-width) flex-col", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet
        open={openMobile}
        onOpenChange={(newState) => {
          setOpenMobile(newState);
        }}
        {...props}
      >
        <SheetContent
          data-sidebar="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) border-neutral-200 bg-neutral-50 p-0 text-neutral-500 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      ref={ref}
      className="group peer hidden text-neutral-500 md:block z-[100]"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
    >
      <div
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]",
        )}
      />
      <div
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l border-neutral-200",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          className="rounded-card group-data-[variant=floating]:rounded-card group-data-[variant=floating]:drop-shadow-default flex h-full w-full flex-col bg-neutral-50 group-data-[variant=floating]:border group-data-[variant=floating]:border-neutral-200"
        >
          {children}
        </div>
      </div>
    </div>
  );
};
Sidebar.displayName = "Sidebar";

const SidebarTrigger = ({ className, onClick, ref, ...props }: React.ComponentProps<typeof Button>) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="dark-ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <LuPanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
};
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = ({ className, ref, ...props }: React.ComponentProps<"button">) => {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={() => {
        toggleSidebar();
      }}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-neutral-200 absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:hover:bg-neutral-50 group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
};
SidebarRail.displayName = "SidebarRail";

const SidebarInset = ({ className, ref, ...props }: React.ComponentProps<"main">) => {
  return (
    <main
      ref={ref}
      className={cn(
        "bg-white relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-card md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:border-neutral-200 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2",
        className,
      )}
      {...props}
    />
  );
};
SidebarInset.displayName = "SidebarInset";

const SidebarInput = ({ className, ref, ...props }: React.ComponentProps<typeof Input>) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "bg-white focus-visible:ring-neutral-400 h-8 w-full shadow-none focus-visible:ring-2",
        className,
      )}
      {...props}
    />
  );
};
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = ({ className, ref, ...props }: React.ComponentProps<"div">) => {
  return <div ref={ref} data-sidebar="header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />;
};
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = ({ className, ref, ...props }: React.ComponentProps<"div">) => {
  return <div ref={ref} data-sidebar="footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />;
};
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = ({ className, ref, ...props }: React.ComponentProps<typeof Separator>) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("bg-neutral-200 mx-2 w-auto", className)}
      {...props}
    />
  );
};
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarContent = ({ className, ref, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
};
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = ({ className, ref, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
};
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = ({
  className,
  asChild = false,
  ref,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "text-neutral-400 ring-neutral-400 flex h-8 shrink-0 items-center rounded px-2 text-xs font-medium transition-[margin,opacity] duration-200 ease-linear outline-none focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      {...props}
    />
  );
};
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupAction = ({
  className,
  asChild = false,
  ref,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "text-neutral-500 ring-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded p-0 transition-transform outline-none focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
};
SidebarGroupAction.displayName = "SidebarGroupAction";

const SidebarGroupContent = ({ className, ref, ...props }: React.ComponentProps<"div">) => (
  <div ref={ref} data-sidebar="group-content" className={cn("w-full text-sm", className)} {...props} />
);
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = ({ className, ref, ...props }: React.ComponentProps<"ul">) => (
  <ul ref={ref} data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />
);
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = ({ className, ref, ...props }: React.ComponentProps<"li">) => (
  <li ref={ref} data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props} />
);
SidebarMenuItem.displayName = "SidebarMenuItem";

export const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded p-2 text-left text-sm outline-none ring-neutral-400 transition-[width,height,padding] hover:bg-neutral-100 hover:text-neutral-700 focus-visible:ring-2 active:bg-neutral-100 active:text-neutral-800 disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-primary-50 data-[active=true]:font-medium data-[active=true]:text-primary-700 data-[state=open]:hover:bg-neutral-100 data-[state=open]:hover:text-neutral-700 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "h-[38px]  w-full rounded p-[1px] transition-all duration-75  text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700",
        simple: "flex h-full w-full items-center gap-2 rounded border !border-transparent p-2 transition-all duration-75 h-[38px]  w-full rounded p-[1px] transition-all duration-75  text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const SidebarMenuButton = ({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ref,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) => {
  const Comp = asChild ? Slot.Root : "button";
  const { isMobile, state } = useSidebar();

  const button = (
    <Comp
      ref={ref}
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" hidden={state !== "collapsed" || isMobile} {...tooltip} />
    </Tooltip>
  );
};
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = ({
  className,
  asChild = false,
  showOnHover = false,
  ref,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) => {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "text-neutral-500 ring-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 peer-hover/menu-button:text-neutral-700 absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded p-0 transition-transform outline-none focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-primary-700 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className,
      )}
      {...props}
    />
  );
};
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuBadge = ({ className, ref, ...props }: React.ComponentProps<"div">) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "text-neutral-500 pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded px-1 text-xs font-medium tabular-nums select-none",
      "peer-hover/menu-button:text-neutral-700 peer-data-[active=true]/menu-button:text-primary-700",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className,
    )}
    {...props}
  />
);
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarMenuSkeleton = ({
  className,
  showIcon = false,
  ref,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) => {
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded px-2", className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded" data-sidebar="menu-skeleton-icon" />}
      <Skeleton
        className="h-4 max-w-[--skeleton-width] flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
};
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

const SidebarMenuSub = ({ className, ref, ...props }: React.ComponentProps<"ul">) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "border-neutral-200 mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className,
    )}
    {...props}
  />
);
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubItem = ({ ref, ...props }: React.ComponentProps<"li">) => <li ref={ref} {...props} />;
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

const SidebarMenuSubButton = ({
  asChild = false,
  size = "md",
  isActive,
  className,
  ref,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}) => {
  const Comp = asChild ? Slot.Root : "a";

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "text-neutral-500 ring-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 active:bg-neutral-100 active:text-neutral-800 [&>svg]:text-neutral-500 flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded px-2 outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-primary-50 data-[active=true]:text-primary-700",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
};
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
