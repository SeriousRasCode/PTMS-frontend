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

interface User {
  id: number;
  full_name: string;
  email: string;
  roles: string;
  is_active: boolean;
}

export const AdminDashboard = () => {
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
      
      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data);
      }
      
    } catch (error: any) {
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
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f5841] to-[#194f87] rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-white/90">Manage users, roles, and system overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#0f5841]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total_users}</div>
            <p className="text-xs text-gray-500 mt-1">{activeUsers} active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#194f87]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
            <FolderKanban className="h-5 w-5 text-[#194f87]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total_projects}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.active_projects} active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#0f5841]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Projects</CardTitle>
            <CheckSquare className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.completed_projects}</div>
            <p className="text-xs text-gray-500 mt-1">+5% from last week</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#194f87]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">On Hold Projects</CardTitle>
            <TrendingUp className="h-5 w-5 text-[#194f87]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.on_hold_projects}</div>
            <p className="text-xs text-gray-500 mt-1">Paused projects</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">User Management</CardTitle>
            <Button className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">User</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Role</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0f5841] to-[#194f87] flex items-center justify-center text-white font-semibold">
                          {user.full_name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{user.email}</td>
                    <td className="p-3">
                      <Select
                        value={user.roles}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={user.is_active ? "default" : "secondary"}
                        className={user.is_active ? "bg-green-500" : ""}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(user.id, !user.is_active)}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-gray-500">
              Page {currentPage} of {Math.ceil(filteredUsers.length / itemsPerPage)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage * itemsPerPage >= filteredUsers.length}
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