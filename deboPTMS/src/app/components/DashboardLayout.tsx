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

  return(

    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#0f5841] to-[#194f87] shadow-lg z-50">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-white text-xl font-semibold">PTMS - Project Task Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-white text-sm">
              <div className="font-medium">{user?.full_name}</div>
              <div className="text-xs text-white/80">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex pt-16"></div>
  );

};