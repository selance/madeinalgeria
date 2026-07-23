import { createBrowserRouter, Outlet } from "react-router";
import { AdminGuard } from "@/components/AdminGuard";
import { ErrorPage } from "@/components/ErrorPage";
import { AdminLayout } from "@/components/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import UsersPage from "@/pages/UsersPage";
import ProjectsPage from "@/pages/ProjectsPage";
import BillingPage from "@/pages/BillingPage";
import NewsletterPage from "@/pages/NewsletterPage";
import CampaignsPage from "@/pages/CampaignsPage";
import ReferencePage from "@/pages/ReferencePage";

function Shell() {
  return (
    <AdminGuard>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AdminGuard>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage />, errorElement: <ErrorPage /> },
  {
    element: <Shell />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/users", element: <UsersPage /> },
      { path: "/projects", element: <ProjectsPage /> },
      { path: "/billing", element: <BillingPage /> },
      { path: "/newsletter", element: <NewsletterPage /> },
      { path: "/campaigns", element: <CampaignsPage /> },
      { path: "/reference", element: <ReferencePage /> },
    ],
  },
]);
