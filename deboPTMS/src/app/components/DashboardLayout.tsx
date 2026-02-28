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
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0f5841] via-[#194f87] to-[#0f5841]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

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

  const isActive = (path: string) => {
    // Handle the dynamic dashboard path
    if (path === getDashboardPath() && 
        (location.pathname === "/dashboard/admin" || 
         location.pathname === "/dashboard/manager" || 
         location.pathname === "/dashboard/member")) {
      return true;
    }
    return location.pathname === path;
  };

  return (
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

      <div className="flex pt-16">
        {/* Sidebar */}
        <div
          className={`fixed left-0 top-16 bottom-0 bg-white shadow-lg transition-all duration-300 z-40 overflow-hidden ${
            sidebarOpen ? "w-64" : "w-0"
          }`}
        >
          <nav className={`p-4 space-y-2 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"} transition-opacity duration-300`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                    active
                      ? "bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};