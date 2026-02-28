import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Clock,
  Plus,
  Calendar,
  TrendingUp
} from "lucide-react";
import { dashboardAPI } from "../utils/api";
import { toast } from "sonner";

interface ManagerStats {
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
}

export const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ManagerStats>({
    total_projects: 0,
    active_projects: 0,
    total_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await dashboardAPI.getManagerDashboard();
      console.log("Manager dashboard response:", response);
      
      if (response.success && response.data) {
        setStats(response.data);
      }
      
    } catch (error: any) {
      console.error("Failed to fetch manager dashboard:", error);
      toast.error(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const activeTasks = stats.total_tasks - stats.completed_tasks;
  const completionRate = stats.total_tasks > 0 
    ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
    : 0;

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
      <div className="bg-gradient-to-r from-[#194f87] to-[#0f5841] rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Manager Dashboard</h1>
        <p className="text-white/90">Oversee projects, manage tasks, and track team performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#194f87]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Projects</CardTitle>
            <FolderKanban className="h-5 w-5 text-[#194f87]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total_projects}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.active_projects} in progress</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#0f5841]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Tasks</CardTitle>
            <CheckSquare className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{activeTasks}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.completed_tasks} completed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#194f87]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue Tasks</CardTitle>
            <Clock className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.overdue_tasks}</div>
            <p className="text-xs text-gray-500 mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#0f5841]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{completionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Task completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-[#0f5841]/5 to-white">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#0f5841] to-[#194f87] rounded-full">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Create Task</h3>
              <p className="text-sm text-gray-600">Assign new tasks to team members</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-[#194f87]/5 to-white">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#194f87] to-[#0f5841] rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Manage Team</h3>
              <p className="text-sm text-gray-600">Add or remove team members</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-[#0f5841]/5 to-white">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#0f5841] to-[#194f87] rounded-full">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-600">Check team performance metrics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
