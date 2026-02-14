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
  Search
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalTasks: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockUsers: User[] = [
      { id: 1, full_name: "John Admin", email: "admin@example.com", role: "Admin", is_active: true },
      { id: 2, full_name: "Sarah Manager", email: "manager@example.com", role: "Manager", is_active: true },
      { id: 3, full_name: "Mike Developer", email: "member@example.com", role: "Member", is_active: true },
      { id: 4, full_name: "Lisa Designer", email: "lisa@example.com", role: "Member", is_active: true },
      { id: 5, full_name: "Tom Analyst", email: "tom@example.com", role: "Member", is_active: false },
    ];

    setUsers(mockUsers);
    setStats({
      totalUsers: mockUsers.length,
      totalProjects: 12,
      totalTasks: 48,
      activeUsers: mockUsers.filter(u => u.is_active).length,
    });
  }, []);


  const handleRoleChange = async (userId: number, newRole: string) => {
    // Mock API call
    toast.success(`Role updated to ${newRole}`);
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleStatusToggle = async (userId: number) => {
    // Mock API call
    const user = users.find(u => u.id === userId);
    toast.success(`User ${user?.is_active ? 'deactivated' : 'activated'}`);
    setUsers(users.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u));
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return(

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
            <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.activeUsers} active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#194f87]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
            <FolderKanban className="h-5 w-5 text-[#194f87]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalProjects}</div>
            <p className="text-xs text-gray-500 mt-1">8 active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#0f5841]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
            <CheckSquare className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalTasks}</div>
            <p className="text-xs text-gray-500 mt-1">32 completed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#194f87]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Productivity</CardTitle>
            <TrendingUp className="h-5 w-5 text-[#194f87]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">87%</div>
            <p className="text-xs text-gray-500 mt-1">+5% from last week</p>
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
                {filteredUsers.map((user) => (
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
                        value={user.role}
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
                        onClick={() => handleStatusToggle(user.id)}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>

  );

};