import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { FolderKanban, Plus, Users, Calendar, Edit2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { projectAPI, teamAPI, taskAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  team_name: string;
  manager_name: string;
  manager_id?: number;
}

interface Team {
  id: number;
  name: string;
}

export const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    team_id: "",
  });

  useEffect(() => {
    console.log("=== PROJECTS PAGE MOUNTED ===");
    console.log("Current user:", user);
    console.log("User role:", user?.role);
    console.log("User ID:", user?.id);
    
    // Check the actual token in localStorage
    const token = localStorage.getItem("authToken");
    console.log("Auth token exists:", !!token);
    if (token) {
      try {
        // Decode JWT to see payload
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        console.log("🔑 TOKEN PAYLOAD:", payload);
        console.log("Token userId:", payload.userId);
        console.log("Token roles:", payload.roles);
      } catch (e) {
        console.error("Failed to decode token:", e);
      }
    }
    
    fetchProjects();
    fetchTeams();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      console.log("=== FETCHING PROJECTS ===");
      console.log("User role:", user?.role);
      
      let response;
      
      // Admin users can fetch all projects
      if (user?.role === "Admin") {
        console.log("Fetching all projects for Admin...");
        response = await projectAPI.getAllProjects();
        console.log("All projects response:", response);
      } else {
        // Managers and Members both use /projects/my-projects
        // Backend should handle the logic:
        // - Managers: projects where manager_id = user_id
        // - Members: projects where project.team_id IN (user's teams)
        console.log("Fetching my projects...");
        response = await projectAPI.getMyProjects();
        console.log("My projects response:", response);
      }
      
      console.log("=== PARSING RESPONSE ===");
      console.log("Response type:", typeof response);
      console.log("Response keys:", response ? Object.keys(response) : "null");
      console.log("response.success:", response?.success);
      console.log("response.data:", response?.data);
      console.log("response.data type:", typeof response?.data);
      console.log("Is response.data array?", Array.isArray(response?.data));
      
      let projectsList = [];
      
      if (response && response.success && response.data) {
        console.log("✅ Found projects in response.data (success)");
        projectsList = response.data;
      } else if (response && Array.isArray(response.data)) {
        console.log("Found projects in response.data (array)");
        projectsList = response.data;
      } else if (Array.isArray(response)) {
        console.log("Response is direct array");
        projectsList = response;
      } else {
        console.warn("Unexpected projects response format:", response);
        projectsList = [];
      }
      
      console.log("=== PROJECTS LOADED ===");
      console.log("Total projects:", projectsList.length);
      console.log("First project sample:", projectsList[0]);
      
      // Check if manager_name is missing and try to enrich data
      if (projectsList.length > 0) {
        const hasManagerName = projectsList.some((p: any) => p.manager_name);
        const hasManagerId = projectsList.some((p: any) => p.manager_id);
        
        console.log("Has manager_name field?", hasManagerName);
        console.log("Has manager_id field?", hasManagerId);
        
        // If manager_name is missing but manager_id exists, try to fetch all users to map names
        if (!hasManagerName && hasManagerId && user?.role === "Manager") {
          console.log("Manager name missing, attempting to enrich with user data...");
          
          try {
            // For managers viewing their own projects, use their name
            projectsList = projectsList.map((project: any) => ({
              ...project,
              manager_name: project.manager_id === user?.id ? user?.full_name : "Unknown Manager",
            }));
            console.log("Enriched projects with manager names");
          } catch (err) {
            console.error("Failed to enrich manager names:", err);
          }
        } else if (!hasManagerName && hasManagerId && user?.role === "Member") {
          console.log("Manager name missing for member, will show as 'Manager'");
          // For members, we can't fetch other users, so use a placeholder
          projectsList = projectsList.map((project: any) => ({
            ...project,
            manager_name: project.manager_name || "Project Manager",
          }));
        }
      }
      
      if (projectsList.length === 0 && user?.role === "Member") {
        console.warn("⚠️ NO PROJECTS FOUND FOR MEMBER");
        console.warn("This could mean:");
        console.warn("1. The member is not part of any team");
        console.warn("2. The member's teams don't have any projects");
        console.warn("3. The backend needs to query team_members table");
        console.warn("Backend should use:");
        console.warn("SELECT p.* FROM projects p");
        console.warn("INNER JOIN team_members tm ON p.team_id = tm.team_id");
        console.warn("WHERE tm.user_id = ?");
      }
      
      setProjects(projectsList);
      
    } catch (error: any) {
      console.error("=== FETCH PROJECTS ERROR ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      toast.error(error.message || "Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      console.log("Fetching teams for project creation...");
      console.log("Current user role:", user?.role);
      
      let response;
      
      // Admin users can fetch all teams
      if (user?.role === "Admin") {
        try {
          console.log("User is Admin, fetching all teams...");
          response = await teamAPI.getAllTeams();
          console.log("All teams response:", response);
        } catch (error) {
          console.error("getAllTeams failed:", error);
          // Fallback to my teams if all teams fails
          console.log("Falling back to getMyTeams...");
          response = await teamAPI.getMyTeams();
          console.log("My teams response:", response);
        }
      } else {
        // Non-admin users get their teams
        console.log("User is not Admin, fetching my teams...");
        response = await teamAPI.getMyTeams();
        console.log("My teams response:", response);
      }
      
      if (response && response.success && response.data) {
        console.log("Setting teams:", response.data);
        setTeams(response.data);
      } else if (response && response.data) {
        // Handle case where success field might be missing
        console.log("Setting teams (no success field):", response.data);
        setTeams(response.data);
      } else {
        console.warn("Teams response missing data:", response);
        setTeams([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch teams:", error);
      toast.error("Failed to load teams. " + error.message);
      setTeams([]);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.description || !newProject.team_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!newProject.start_date || !newProject.end_date) {
      toast.error("Please select start and end dates");
      return;
    }

    try {
      setCreating(true);
      
      await projectAPI.createProject({
        name: newProject.name,
        description: newProject.description,
        team_id: parseInt(newProject.team_id),
        start_date: newProject.start_date,
        end_date: newProject.end_date,
      });
      
      toast.success("Project created successfully!");
      
      setNewProject({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        team_id: "",
      });
      setDialogOpen(false);
      
      // Refresh projects list
      fetchProjects();
      
    } catch (error: any) {
      console.error("Failed to create project:", error);
      toast.error(error.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (projectId: number, projectData: Project, newStatus: string) => {
    try {
      setUpdatingStatus(projectId);
      
      console.log("=== UPDATING PROJECT STATUS ===");
      console.log("Project ID:", projectId);
      console.log("New status value from select:", newStatus);
      console.log("Current project data:", projectData);
      console.log("Current project status FROM BACKEND:", projectData.status);
      
      // Format dates to YYYY-MM-DD format (MySQL DATE format)
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Build a mapping from frontend to all possible backend formats
      // We'll try multiple formats in order until one works
      const possibleFormats: { [key: string]: string[] } = {
        'Planned': ['Planned', 'planned', 'Planning', 'planning', 'PLANNED', 'PLANNING'],
        'Active': ['Active', 'active', 'In Progress', 'in progress', 'In_Progress', 'in_progress', 'ACTIVE', 'IN_PROGRESS'],
        'Completed': ['Completed', 'completed', 'COMPLETED'],
        'On Hold': ['On Hold', 'on hold', 'On_Hold', 'on_hold', 'ON_HOLD', 'ONHOLD', 'onhold']
      };
      
      // Try to send the exact same format as what the backend returned for the current status
      // This is the safest approach - mimic the backend's format
      let statusToSend = newStatus;
      
      // Get all current statuses from all projects to understand backend format
      const backendStatuses = projects.map(p => p.status).filter(Boolean);
      console.log("All backend statuses in current projects:", backendStatuses);
      
      // Detect pattern from backend statuses
      if (backendStatuses.length > 0) {
        const sample = backendStatuses[0];
        const hasUnderscores = backendStatuses.some(s => s && s.includes('_'));
        const hasSpaces = backendStatuses.some(s => s && s.includes(' '));
        const isLowercase = backendStatuses.every(s => s && s === s.toLowerCase());
        const isUppercase = backendStatuses.every(s => s && s === s.toUpperCase());
        const isTitleCase = backendStatuses.some(s => s && s[0] === s[0].toUpperCase());
        
        console.log("Backend format analysis:");
        console.log("- Has underscores:", hasUnderscores);
        console.log("- Has spaces:", hasSpaces);
        console.log("- Is lowercase:", isLowercase);
        console.log("- Is uppercase:", isUppercase);
        console.log("- Is TitleCase:", isTitleCase);
        
        // Apply the detected format
        if (hasUnderscores && isLowercase) {
          // Format: in_progress, on_hold, planning, completed
          const map: { [key: string]: string } = {
            'Planned': 'planning',
            'Active': 'in_progress',
            'Completed': 'completed',
            'On Hold': 'on_hold'
          };
          statusToSend = map[newStatus] || newStatus;
        } else if (hasSpaces && isLowercase) {
          // Format: in progress, on hold, planning, completed
          const map: { [key: string]: string } = {
            'Planned': 'planning',
            'Active': 'in progress',
            'Completed': 'completed',
            'On Hold': 'on hold'
          };
          statusToSend = map[newStatus] || newStatus;
        } else if (hasSpaces && isTitleCase) {
          // Format: In Progress, On Hold, Planning, Completed
          const map: { [key: string]: string } = {
            'Planned': 'Planning',
            'Active': 'In Progress',
            'Completed': 'Completed',
            'On Hold': 'On Hold'
          };
          statusToSend = map[newStatus] || newStatus;
        } else if (hasUnderscores && isTitleCase) {
          // Format: In_Progress, On_Hold, Planning, Completed
          const map: { [key: string]: string } = {
            'Planned': 'Planning',
            'Active': 'In_Progress',
            'Completed': 'Completed',
            'On Hold': 'On_Hold'
          };
          statusToSend = map[newStatus] || newStatus;
        } else if (isLowercase) {
          // Format: active, planning, completed, onhold
          const map: { [key: string]: string } = {
            'Planned': 'planning',
            'Active': 'active',
            'Completed': 'completed',
            'On Hold': 'onhold'
          };
          statusToSend = map[newStatus] || newStatus.toLowerCase();
        } else if (isTitleCase) {
          // Format: Active, Planning, Completed, OnHold
          const map: { [key: string]: string } = {
            'Planned': 'Planning',
            'Active': 'Active',
            'Completed': 'Completed',
            'On Hold': 'OnHold'
          };
          statusToSend = map[newStatus] || newStatus;
        }
      }
      
      console.log("Status to send to backend:", statusToSend);
      
      const updatePayload = {
        name: projectData.name,
        description: projectData.description,
        status: statusToSend,
        start_date: formatDate(projectData.start_date),
        end_date: formatDate(projectData.end_date),
      };
      
      console.log("Update payload:", updatePayload);
      
      await projectAPI.updateProject(projectId, updatePayload);
      
      toast.success("Project status updated successfully!");
      
      // Refresh projects list
      fetchProjects();
      
    } catch (error: any) {
      console.error("Failed to update project status:", error);
      console.error("ERROR DETAILS:", {
        message: error.message,
        response: error.response,
        data: error.data
      });
      toast.error(error.message || "Failed to update project status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase().replace('_', ' ');
    switch (normalizedStatus) {
      case "completed":
        return "bg-green-500";
      case "in progress":
      case "active":
        return "bg-blue-500";
      case "on hold":
        return "bg-yellow-500";
      case "planned":
      case "planning":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    const normalizedStatus = status?.toLowerCase().replace('_', ' ');
    switch (normalizedStatus) {
      case "completed":
        return "Completed";
      case "in progress":
      case "active":
        return "Active";
      case "on hold":
        return "On Hold";
      case "planned":
      case "planning":
        return "Planning";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading projects...</div>
      </div>
    );
  }

  const canCreateProject = user?.role === "Manager" || user?.role === "Admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage and track all your projects</p>
        </div>
        {canCreateProject && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Fill in the project details to get started
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter project name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the project"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="team">Team *</Label>
                  <Select
                    value={newProject.team_id}
                    onValueChange={(value) => setNewProject({ ...newProject, team_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date *</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={newProject.start_date}
                      onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date *</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={newProject.end_date}
                      onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateProject}
                  className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87]"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#0f5841]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{projects.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {projects.filter(p => {
                const status = p.status?.toLowerCase().replace('_', ' ');
                return status === "active" || status === "in progress";
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {projects.filter(p => p.status?.toLowerCase() === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">On Hold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {projects.filter(p => {
                const status = p.status?.toLowerCase().replace('_', ' ');
                return status === "on hold";
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 text-center mb-4">
              {canCreateProject 
                ? "Create your first project to get started" 
                : "No projects available"}
            </p>
            {canCreateProject && (
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-gradient-to-r from-[#0f5841] to-[#194f87]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3 mb-2">
                      <span>{project.name}</span>
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">{project.description}</p>
                  </div>
                  {canCreateProject && (
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users size={16} />
                    {project.team_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Manager:</span> {project.manager_name}
                </div>
                {(user?.role === "Admin" || (user?.role === "Manager" && project.manager_id === user?.id)) && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Change Status</Label>
                    <Select
                      value={(() => {
                        // Map backend status to frontend SelectItem values
                        const statusMap: { [key: string]: string } = {
                          'planning': 'Planned',
                          'planned': 'Planned',
                          'in_progress': 'Active',
                          'active': 'Active',
                          'completed': 'Completed',
                          'on_hold': 'On Hold',
                          'on hold': 'On Hold'
                        };
                        const normalizedStatus = project.status?.toLowerCase().replace(' ', '_');
                        return statusMap[normalizedStatus] || project.status;
                      })()}
                      onValueChange={(value) => handleStatusChange(project.id, project, value)}
                      disabled={updatingStatus === project.id}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planned">Planning</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <Button
                    onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};