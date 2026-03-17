import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  Users, 
  FolderKanban, 
  CheckSquare, 
  TrendingUp,
  UserPlus,
  Shield,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { adminAPI, dashboardAPI } from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import { Label } from "../components/ui/label";

interface User {
  id: number;
  full_name: string;
  email: string;
  roles: string;
  is_active: boolean;
}

export const AdminDashboard = () => {
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total_users: 0,
    total_projects: 0,
    active_projects: 0,
    completed_projects: 0,
    on_hold_projects: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin summary stats
      const summaryResponse = await dashboardAPI.getAdminSummary();
      
      if (summaryResponse.success && summaryResponse.data) {
        setStats(summaryResponse.data);
      }

      // Fetch all users
      const usersResponse = await adminAPI.getAllUsers();
      
      if (usersResponse && usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data);
      } else if (Array.isArray(usersResponse)) {
        setUsers(usersResponse);
      }
      
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await adminAPI.assignRole(userId, newRole);
      toast.success("Role updated successfully");
      fetchDashboardData();
      setUsers(users.map(u => u.id === userId ? { ...u, roles: newRole } : u));
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleStatusChange = async (userId: number, newStatus: boolean) => {
    try {
      await adminAPI.updateUserStatus(userId, newStatus);
      toast.success(`User ${newStatus ? "activated" : "deactivated"} successfully`);
      fetchDashboardData();
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: newStatus } : u));
    } catch (error: any) {
      toast.error(error.message || "Failed to update user status");
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = users.filter(u => u.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f5841] to-[#194f87] rounded-xl p-4 md:p-6 text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-sm md:text-base text-white/90">Manage users, roles, and system overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`border-l-4 border-l-[#0f5841] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Users</CardTitle>
            <Users className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.total_users}</div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{activeUsers} active</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-[#194f87] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Projects</CardTitle>
            <FolderKanban className="h-5 w-5 text-[#194f87]" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.total_projects}</div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{stats.active_projects} active</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-[#0f5841] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Completed Projects</CardTitle>
            <CheckSquare className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.completed_projects}</div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>+5% from last week</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-[#194f87] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>On Hold Projects</CardTitle>
            <TrendingUp className="h-5 w-5 text-[#194f87]" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.on_hold_projects}</div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Paused projects</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>User Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => (
              <Card key={user.id} className={`hover:shadow-lg transition-shadow ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0f5841] to-[#194f87] flex items-center justify-center text-white font-semibold text-lg">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.full_name}</h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</p>
                      </div>
                    </div>
                    <Badge
                      variant={user.is_active ? "default" : "secondary"}
                      className={user.is_active ? "bg-green-500" : ""}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Role</Label>
                      <select
                        value={user.roles}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`mt-1 w-full h-10 px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5841] ${
                          theme === 'dark'
                            ? 'bg-slate-600 border-slate-500 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Member">Member</option>
                      </select>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(user.id, !user.is_active)}
                      className={`w-full ${theme === 'dark' ? 'border-slate-500 text-gray-200 hover:bg-slate-600' : ''}`}
                    >
                      {user.is_active ? "Deactivate User" : "Activate User"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={theme === 'dark' ? 'border-slate-600 text-gray-200 hover:bg-slate-700' : ''}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Page {currentPage} of {Math.ceil(filteredUsers.length / itemsPerPage)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage * itemsPerPage >= filteredUsers.length}
              className={theme === 'dark' ? 'border-slate-600 text-gray-200 hover:bg-slate-700' : ''}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};