import { createBrowserRouter } from "react-router";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ManagerDashboard } from "./pages/ManagerDashboard";
import { MemberDashboard } from "./pages/MemberDashboard";
import { Projects } from "./pages/Projects";
import { Tasks } from "./pages/Tasks";
import { Teams } from "./pages/Teams";
import { Reports } from "./pages/Reports";
import { Profile } from "./pages/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
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
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
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
    ],
  },
]);