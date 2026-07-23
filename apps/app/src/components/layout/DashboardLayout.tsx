import { AppSidebar } from "./AppSidebar";
import { SidebarProvider} from "@mia/ui/components/sidebar";
import DashboardHeader from "./DashboardHeader";
import VerificationBanner from "./VerificationBanner";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider dir="rtl">
      <AppSidebar />
      <main className='flex-1 overflow-x-auto gap-2 min-h-screen'>
       <VerificationBanner />
        <DashboardHeader />
        <div className="p-4">{children}</div>
      </main>
    </SidebarProvider>
  );
}

export default DashboardLayout;