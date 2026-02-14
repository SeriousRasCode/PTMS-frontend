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

      {/* Projects Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Project Overview</CardTitle>
            <Button className="bg-gradient-to-r from-[#194f87] to-[#0f5841] text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{project.name}</h3>
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <CheckSquare size={16} />
                        {project.completedTasks}/{project.tasks} tasks
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={16} />
                        {project.team_size} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        Due: {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
