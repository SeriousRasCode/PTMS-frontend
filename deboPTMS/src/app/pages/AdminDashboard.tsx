import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import {
  Users,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { adminAPI, dashboardAPI, unwrapList } from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import { Label } from "../components/ui/label";

interface User {
  id: number;
  full_name: string;
  email: string;
  roles: string;
  is_active: boolean;
}

const EMPTY_STATS = {
  total_users: 0,
  total_projects: 0,
  active_projects: 0,
  completed_projects: 0,
  on_hold_projects: 0,
};

export const AdminDashboard = () => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: stats = EMPTY_STATS } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: async () => {
      const response = await dashboardAPI.getAdminSummary();
      return response?.data || EMPTY_STATS;
    },
  });

  const {
    data: users = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<User[]> => unwrapList<User>(await adminAPI.getAllUsers()),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: number; newRole: string }) =>
      adminAPI.assignRole(userId, newRole),
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update role"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, newStatus }: { userId: number; newStatus: boolean }) =>
      adminAPI.updateUserStatus(userId, newStatus),
    onSuccess: (_data, { newStatus }) => {
      toast.success(`User ${newStatus ? "activated" : "deactivated"} successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update user status"),
  });

  const handleRoleChange = (userId: number, newRole: string) =>
    roleMutation.mutate({ userId, newRole });
  const handleStatusChange = (userId: number, newStatus: boolean) =>
    statusMutation.mutate({ userId, newStatus });

  const filteredUsers = users.filter((user: User) =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = users.filter((u: User) => u.is_active).length;

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Couldn't load dashboard</h3>
          <p className={`text-center mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {(error as Error)?.message || "Something went wrong while fetching dashboard data."}
          </p>
          <Button onClick={() => refetch()} className="bg-gradient-to-r from-[#0f5841] to-[#194f87]">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
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