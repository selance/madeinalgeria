import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { ErrorPage } from "@/components/ErrorPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestRoute } from "@/components/auth/GuestRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DesignSystemPage from "@/pages/design-system/DesignSystemPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import AccountSettingsPage from "@/pages/account/AccountSettingsPage";
import SubscriptionsPage from "@/pages/account/SubscriptionsPage";

function ProtectedShell() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <DesignSystemPage />, errorElement: <ErrorPage /> },
  {
    path: "/login",
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/register",
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/reset-password",
    element: (
      <GuestRoute>
        <ResetPasswordPage />
      </GuestRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    element: <ProtectedShell />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/dashboard/account", element: <AccountSettingsPage /> },
      { path: "/dashboard/subscription", element: <SubscriptionsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
