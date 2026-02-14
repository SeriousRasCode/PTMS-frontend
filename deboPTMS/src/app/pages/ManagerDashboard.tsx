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


interface Project {
  id: number;
  name: string;
  status: string;
  progress: number;
  tasks: number;
  completedTasks: number;
  team_size: number;
  deadline: string;
}

export const ManagerDashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    teamMembers: 0,
    completionRate: 0,
  });

  useEffect(() => {
    // Mock data
    const mockProjects: Project[] = [
      {
        id: 1,
        name: "Website Redesign",
        status: "in_progress",
        progress: 65,
        tasks: 12,
        completedTasks: 8,
        team_size: 5,
        deadline: "2026-03-15"
      },
      {
        id: 2,
        name: "Mobile App Development",
        status: "in_progress",
        progress: 40,
        tasks: 20,
        completedTasks: 8,
        team_size: 7,
        deadline: "2026-04-20"
      },
      {
        id: 3,
        name: "API Integration",
        status: "planning",
        progress: 15,
        tasks: 8,
        completedTasks: 1,
        team_size: 3,
        deadline: "2026-03-30"
      },
      {
        id: 4,
        name: "Database Migration",
        status: "completed",
        progress: 100,
        tasks: 6,
        completedTasks: 6,
        team_size: 4,
        deadline: "2026-02-10"
      },
    ];

    setProjects(mockProjects);
    setStats({
      totalProjects: mockProjects.length,
      activeTasks: mockProjects.reduce((sum, p) => sum + (p.tasks - p.completedTasks), 0),
      teamMembers: 12,
      completionRate: 72,
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "planning":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ").toUpperCase();
  };

  return(
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
            <div className="text-3xl font-bold text-gray-900">{stats.totalProjects}</div>
            <p className="text-xs text-gray-500 mt-1">3 in progress</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#0f5841]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Tasks</CardTitle>
            <CheckSquare className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeTasks}</div>
            <p className="text-xs text-gray-500 mt-1">23 completed this week</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#194f87]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Team Members</CardTitle>
            <Users className="h-5 w-5 text-[#194f87]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.teamMembers}</div>
            <p className="text-xs text-gray-500 mt-1">Across all projects</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#0f5841]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.completionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">+8% from last month</p>
          </CardContent>
        </Card>
      </div>
  );

};