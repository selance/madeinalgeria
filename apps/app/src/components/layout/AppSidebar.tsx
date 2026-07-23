"use client";
import type React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@mia/ui/components/sidebar";
import Logo from "@mia/ui/icons/Logo";
import { SidebarNavItem } from "./SidebarNavItem";
import { Button } from "@mia/ui/components/button";
import SidebarIcon from "@mia/ui/icons/SidebarIcon";
import ChartBarIcon from "@mia/ui/icons/ChartBarIcon";
import ProfileIcon from "@mia/ui/icons/ProfileIcon";
import SubscriptionIcon from "@mia/ui/icons/SubscriptionIcon";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { cn, useIsMobile } from "@mia/ui";

type NavIconProps = React.SVGProps<SVGSVGElement> & { variant: "default" | "active" };

/** ChartBarIcon is fill-based (no variant prop) — adapt it to the nav API. */
const HomeIcon = ({ variant, className, ...props }: NavIconProps) => (
  <ChartBarIcon
    {...props}
    className={cn(className, variant === "active" ? "fill-primary-500" : "fill-neutral-500")}
  />
);

/** SubscriptionIcon is fill-based (no variant prop) — adapt it to the nav API. */
const PlanIcon = ({ variant, className, ...props }: NavIconProps) => (
  <SubscriptionIcon
    {...props}
    className={cn(className, variant === "active" ? "fill-primary-500" : "fill-neutral-500")}
  />
);

const items = [
  { title: "الرئيسية", url: "/dashboard", icon: HomeIcon, exact: true },
  { title: "الحساب", url: "/dashboard/account", icon: ProfileIcon, exact: true },
  { title: "الاشتراك", url: "/dashboard/subscription", icon: PlanIcon, exact: true },
];

export function AppSidebar() {
  const { toggleSidebar, open } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <Sidebar variant="floating" dir="rtl" side="right">
      <SidebarHeader className="flex h-[80px] flex-row items-center justify-between p-[20px]">
        <Logo className="text-primary-500 h-9 w-auto" />
        {(isMobile || open) && (
          <Button onClick={toggleSidebar} variant={"soft"} size={"icon"}>
            <SidebarIcon className="size-[26px]" />
          </Button>
        )}
      </SidebarHeader>
      <div className="mx-[20px] border-b" />
      <SidebarContent dir="rtl">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarNavItem
                  key={item.title}
                  title={item.title}
                  url={item.url}
                  icon={item.icon}
                  exact={item.exact}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-[20px]">
        <div className="border-b" />
        <SidebarMenu className="pb-2">
          <SidebarMenuItem>
            <LogoutButton variant="sidebar" redirectTo="/" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
