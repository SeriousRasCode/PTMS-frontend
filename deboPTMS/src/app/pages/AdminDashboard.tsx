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