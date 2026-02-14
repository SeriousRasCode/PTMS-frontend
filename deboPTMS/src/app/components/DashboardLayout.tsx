import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  BarChart3, 
  User, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardPath = () => {
    if (user?.role === "Admin") return "/dashboard/admin";
    if (user?.role === "Manager") return "/dashboard/manager";
    return "/dashboard/member";
  };

  const navItems = [
    { path: getDashboardPath(), label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/projects", label: "Projects", icon: FolderKanban },
    { path: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
    { path: "/dashboard/teams", label: "Teams", icon: Users },
    { path: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    { path: "/dashboard/profile", label: "Profile", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  