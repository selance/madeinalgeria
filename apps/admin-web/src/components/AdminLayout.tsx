import { Link, useLocation } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@mia/ui/components/sidebar";
import { Button } from "@mia/ui/components/button";
import { cn, useIsMobile } from "@mia/ui";
import Logo from "@mia/ui/icons/Logo";
import SidebarIcon from "@mia/ui/icons/SidebarIcon";
import LogoutIcon from "@mia/ui/icons/LogoutIcon";
import TwoPeopleIcon from "@mia/ui/icons/TwoPeopleIcon";
import SubscriptionIcon from "@mia/ui/icons/SubscriptionIcon";
import EmailIcon from "@mia/ui/icons/EmailIcon";
import ThreadIcon from "@mia/ui/icons/ThreadIcon";
import ChartBarIcon from "@mia/ui/icons/ChartBarIcon";
import DatabaseIcon from "@mia/ui/icons/DatabaseIcon";
import GithubIcon from "@mia/ui/icons/GithubIcon";
import { clearSessionToken } from "@mia/api-client";
import { authClient } from "@/lib/api";

/** Branded icons (fill-based) match the user app; active nav tints via fill. */
const iconClass = (active: boolean) => cn("size-[16px]", active ? "fill-primary-500" : "fill-neutral-500");

interface NavItemDef {
  title: string;
  url: string;
  exact?: boolean;
  renderIcon: (active: boolean) => React.ReactNode;
}

const NAV: NavItemDef[] = [
  { title: "الرئيسية", url: "/", exact: true, renderIcon: (a) => <ChartBarIcon className={iconClass(a)} /> },
  { title: "المستخدمون", url: "/users", renderIcon: (a) => <TwoPeopleIcon className={iconClass(a)} /> },
  { title: "المشاريع", url: "/projects", renderIcon: (a) => <GithubIcon className={iconClass(a)} /> },
  { title: "الفوترة", url: "/billing", renderIcon: (a) => <SubscriptionIcon className={iconClass(a)} /> },
  { title: "النشرة البريدية", url: "/newsletter", renderIcon: (a) => <EmailIcon className={iconClass(a)} /> },
  { title: "الحملات", url: "/campaigns", renderIcon: (a) => <ThreadIcon className={iconClass(a)} /> },
  { title: "البيانات المرجعية", url: "/reference", renderIcon: (a) => <DatabaseIcon className={iconClass(a)} /> },
];

function NavItem({ title, url, exact, renderIcon }: NavItemDef) {
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
            {renderIcon(isActive)}
            <span className="text-base font-medium">{title}</span>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AdminSidebar() {
  const { toggleSidebar, open } = useSidebar();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } finally {
      clearSessionToken();
      window.location.assign("/login");
    }
  };

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
              {NAV.map((item) => (
                <NavItem key={item.url} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-[20px]">
        <div className="border-b" />
        <SidebarMenu className="pb-2">
          <SidebarMenuItem>
            <SidebarMenuButton variant={"simple"} onClick={handleLogout}>
              <LogoutIcon className="size-4 fill-neutral-500" />
              <span>تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function Header() {
  const { toggleSidebar, open } = useSidebar();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const title = NAV.find((n) => (n.exact ? pathname === n.url : pathname.startsWith(n.url)))?.title ?? "لوحة الإدارة";

  return (
    <header className="rounded-card mx-2 mt-2 flex h-[80px] items-center justify-between p-3 md:px-[20px]">
      <section className="flex items-center justify-center gap-2">
        {(isMobile || !open) && (
          <Button onClick={toggleSidebar} variant={"soft"} size={"icon"}>
            <SidebarIcon className="size-[26px]" />
          </Button>
        )}
        <h3 className="text-[26px] text-neutral-600">{title}</h3>
      </section>
    </header>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider dir="rtl">
      <AdminSidebar />
      <main className="min-h-screen flex-1 gap-2 overflow-x-auto">
        <Header />
        <div className="p-4">{children}</div>
      </main>
    </SidebarProvider>
  );
}
