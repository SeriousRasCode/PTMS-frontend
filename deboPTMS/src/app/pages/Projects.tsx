import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { FolderKanban, Plus, Users, Calendar, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  team_name: string;    // From SQL Alias
  manager_name: string; // From SQL Alias
  progress?: number;    // Optional until you add it to SQL
  team_size?: number;   // Optional until you add it to SQL
}

export const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    team_id: "1",
    manager_id: "1" 
  });

  // --- GET ALL PROJECTS ---
  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Make sure this URL matches your backend route exactly
      const response = await fetch("/api/all-projects", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
      });
      
      const result = await response.json();

      if (result.success) {
        setProjects(result.data);
      } else {
        toast.error(result.message || "Failed to fetch projects");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --- CREATE PROJECT ---
  const handleCreateProject = async () => {
  // Validation
  if (!newProject.name || !newProject.description || !newProject.start_date || !newProject.end_date) {
    toast.error("Please fill in all required fields");
    return;
  }

  try {
    const response = await fetch("/api/create-projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}` // Ensure this key matches your login storage
      },
      body: JSON.stringify(newProject),
    });

    const result = await response.json();

    // FIX: Check for response.ok (status 200-299) because your backend 
    // sends 201 but doesn't include a "success: true" boolean.
    if (response.ok) {
      toast.success(result.message || "Project created successfully!");
      setIsDialogOpen(false); 
      fetchProjects(); // Refresh the list
      
      setNewProject({ 
        name: "", 
        description: "", 
        start_date: "", 
        end_date: "", 
        team_id: "1",
        manager_id: "1"
      });
    } else {
      toast.error(result.message || "Failed to create project");
    }
  } catch (err) {
    console.error("Create Project Error:", err);
    toast.error("Failed to create project");
  }
};

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "active":    return "bg-blue-500";
      case "planning":  return "bg-yellow-500";
      case "on_hold":   return "bg-orange-500";
      default:          return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage and track all your projects</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Enter project details to create a new project.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter project description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newProject.end_date}
                    onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_id">Team</Label>
                <Select value={newProject.team_id} onValueChange={(value) => setNewProject({ ...newProject, team_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Development Team</SelectItem>
                    <SelectItem value="2">Design Team</SelectItem>
                    <SelectItem value="3">Marketing Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateProject}
                className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white"
              >
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-[#0f5841] to-[#194f87] rounded-lg">
                    <FolderKanban className="h-5 w-5 text-white" />
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.toUpperCase()}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm">
                  <Edit2 size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{project.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-gray-900">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users size={16} />
                    Team Size
                  </span>
                  <span className="font-medium text-gray-900">{project.team_size} members</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    Timeline
                  </span>
                  <span className="font-medium text-gray-900">
                    {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};