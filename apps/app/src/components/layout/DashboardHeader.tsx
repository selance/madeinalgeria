"use client";
import { useSidebar } from "@mia/ui/components/sidebar";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@mia/ui/components/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@mia/ui/components/avatar";
import ArrowDownIcon from "@mia/ui/icons/ArrowDownIcon";
import { Button } from "@mia/ui/components/button";
import SidebarIcon from "@mia/ui/icons/SidebarIcon";
import { Link, useLocation } from "react-router";
import { useSession } from "@/lib/auth-client";
import { useIsMobile } from "@mia/ui";
import { LogoutButton } from "@/components/auth/LogoutButton";

const DashboardHeader = () => {
  const { toggleSidebar, open } = useSidebar();
  const { data } = useSession();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();

  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard/account")) return "الحساب";
    if (pathname.startsWith("/dashboard/subscription")) return "الاشتراك";
    return "الرئيسية";
  };

  const name = data?.user.name || data?.user.email || "";
  const fallbackLetter = name.trim().charAt(0).toUpperCase() || "؟";

  return (
    <header className="rounded-card mx-2 mt-2 flex h-[80px] items-center justify-between p-3 md:px-[20px]">
      <section className="flex items-center justify-center gap-2">
        {(isMobile || !open) && (
          <Button onClick={toggleSidebar} variant={"soft"} size={"icon"}>
            <SidebarIcon className="size-[26px]" />
          </Button>
        )}
        <h3 className="text-[26px] text-neutral-600">{getPageTitle()}</h3>
      </section>
      <Popover>
        <PopoverTrigger className={"flex items-center justify-center gap-1 p-1"}>
          <Avatar className="size-9 rounded-[6px]">
            <AvatarImage src={data?.user.image ?? undefined} alt={name} className="rounded-[6px]" />
            <AvatarFallback className="bg-primary-50 text-primary-500 rounded-[6px] text-sm font-semibold">
              {fallbackLetter}
            </AvatarFallback>
          </Avatar>
          <ArrowDownIcon className="size-3" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          dir="rtl"
          className="flex flex-col gap-0 overflow-hidden !rounded bg-neutral-50 p-0"
        >
          <PopoverClose className="w-full opacity-100">
            <Link
              className="flex w-full items-center gap-2 p-2 text-sm transition-colors hover:bg-neutral-100/20"
              to="/dashboard/account"
            >
              <Avatar className="size-8 rounded-[8px]">
                <AvatarImage src={data?.user.image ?? undefined} alt={name} className="rounded-[8px]" />
                <AvatarFallback className="bg-primary-50 text-primary-500 rounded-[8px] text-sm font-semibold">
                  {fallbackLetter}
                </AvatarFallback>
              </Avatar>
              <span>الملف الشخصي</span>
            </Link>
          </PopoverClose>
          <div className="mx-2 border-b" />
          <div className="p-1">
            <LogoutButton variant="button" redirectTo="/" />
          </div>
        </PopoverContent>
      </Popover>
    </header>
  );
};

export default DashboardHeader;
