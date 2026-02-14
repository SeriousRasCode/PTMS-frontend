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