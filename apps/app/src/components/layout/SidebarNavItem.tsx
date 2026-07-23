"use client";

import { Link } from "react-router";
import { useLocation } from "react-router";
import { SidebarMenuItem, SidebarMenuButton } from "@mia/ui/components/sidebar";
import { cn } from "@mia/ui";
import React from "react";

interface SidebarNavItemProps {
  title: string;
  url: string;
  icon: (props: React.SVGProps<SVGSVGElement> & { variant: "default" | "active" }) => React.ReactNode;
  exact?: boolean;
}

export function SidebarNavItem({ title, url, icon: Icon, exact = false }: SidebarNavItemProps) {
  const { pathname } = useLocation();

  const isActive = exact ? pathname === url : pathname.startsWith(url);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link
          to={url}
          className="h-[38px] w-full rounded p-[1px] transition-all duration-75"
        >
          <div
            className={cn(
              "flex h-full w-full items-center gap-2 rounded border !border-transparent p-2 transition-all duration-75",
              isActive
                ? "bg-primary-500 text-white [&_svg]:fill-white [&_svg_*]:fill-white"
                : "text-neutral-500 hover:bg-neutral-100/50 hover:text-neutral-700",
            )}
          >
            <Icon className="size-[16px]" variant={isActive ? "active" : "default"} />
            <span className="text-base font-medium">{title}</span>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
