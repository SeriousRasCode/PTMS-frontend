import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ManagerDashboard } from "./pages/ManagerDashboard";
import { MemberDashboard } from "./pages/MemberDashboard";
import { Projects } from "./pages/Projects";
import { ProjectDetails } from "./pages/ProjectDetails";
import { Tasks } from "./pages/Tasks";
import { Teams } from "./pages/Teams";
import { Reports } from "./pages/Reports";
import { Profile } from "./pages/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";
import { AuthProvider } from "./context/AuthContext";

// Root component that provides AuthContext to all routes
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

// Wrapper for dashboard routes
function DashboardWrapper() {
  return (
    <DashboardLayout />
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Navigate to="/login" replace />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "/reset-password/:token",
        element: <ResetPassword />,
      },
      {
        path: "/reset-password",
        element: <ResetPassword />,
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <DashboardWrapper />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "admin",
            element: (
              <ProtectedRoute requiredRole="Admin">
                <AdminDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: "manager",
            element: (
              <ProtectedRoute requiredRole="Manager">
                <ManagerDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: "member",
            element: (
              <ProtectedRoute requiredRole="Member">
                <MemberDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: "projects",
            element: <Projects />,
          },
          {
            path: "projects/:projectId",
            element: <ProjectDetails />,
          },
          {
            path: "tasks",
            element: <Tasks />,
          },
          {
            path: "teams",
            element: <Teams />,
          },
          {
            path: "reports",
            element: <Reports />,
          },
          {
            path: "profile",
            element: <Profile />,
          },
          {
            path: "*",
            element: <Navigate to={"/dashboard/member"} replace />,
          },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/login" replace />,
      },
    ],
  },
]);