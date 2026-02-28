import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { 
  CheckSquare, 
  Clock, 
  Calendar,
  AlertCircle,
  Play,
  CheckCircle2,
  FolderKanban,
  Users
} from "lucide-react";
import { Slider } from "../components/ui/slider";
import { toast } from "sonner";
import { taskAPI, projectAPI } from "../utils/api";
import { useNavigate } from "react-router";

interface Task {
  id: number;
  title: string;
  description: string;
  project_name?: string;
  status: string;
  progress_percentage: number;
  due_date: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  team_name: string;
  manager_name?: string;
}

export const MemberDashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTask, setUpdatingTask] = useState<number | null>(null);

  useEffect(() => {
    console.log("=== MEMBER DASHBOARD MOUNTED ===");
    fetchMyTasks();
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    try {
      console.log("=== FETCHING MY PROJECTS (Dashboard) ===");
      const response = await projectAPI.getMyProjects();
      console.log("My projects response (Dashboard):", response);
      
      if (response && response.success && response.data) {
        console.log("✅ Setting projects:", response.data);
        setProjects(response.data);
      } else {
        console.warn("No projects data in response");
        setProjects([]);
      }
      
    } catch (error: any) {
      // Suppress permission errors - handle gracefully
      if (error.message?.includes("Forbidden") || error.message?.includes("permission")) {
        console.log("Permission denied for projects - user may not have access");
        setProjects([]);
      } else {
        console.error("Failed to fetch my projects:", error);
        toast.error(error.message || "Failed to load projects");
        setProjects([]);
      }
    }
  };

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      
      console.log("=== FETCHING MY TASKS (Dashboard - via Projects like ProjectDetails) ===");
      
      // Get all projects first
      const projectsResponse = await projectAPI.getMyProjects();
      console.log("Projects response:", projectsResponse);
      
      // Extract projects array (EXACT same logic as ProjectDetails line 145-153)
      let projectsList = [];
      if (projectsResponse && projectsResponse.success && projectsResponse.data) {
        projectsList = projectsResponse.data;
      } else if (projectsResponse && Array.isArray(projectsResponse.data)) {
        projectsList = projectsResponse.data;
      } else if (Array.isArray(projectsResponse)) {
        projectsList = projectsResponse;
      }
      
      console.log(`Found ${projectsList.length} projects`);
      
      if (projectsList.length === 0) {
        console.warn("No projects found");
        setTasks([]);
        return;
      }
      
      // Fetch tasks for each project (EXACT same logic as ProjectDetails line 172-192)
      const allTasksPromises = projectsList.map(async (project: any) => {
        try {
          const response = await taskAPI.getTasksByProject(project.id);
          console.log(`Tasks response for project ${project.id}:`, response);
          
          // EXACT same handling as ProjectDetails line 179-185
          let projectTasks = [];
          if (Array.isArray(response)) {
            projectTasks = response;
          } else if (response.data && Array.isArray(response.data)) {
            projectTasks = response.data;
          } else {
            projectTasks = [];
          }
          
          // Add project info to each task
          return projectTasks.map((task: any) => ({
            ...task,
            project_name: project.name,
            project_id: project.id
          }));
        } catch (error) {
          console.error(`Failed to fetch tasks for project ${project.id}:`, error);
          return [];
        }
      });
      
      const allTasksArrays = await Promise.all(allTasksPromises);
      const allTasks = allTasksArrays.flat();
      
      console.log("=== TASKS LOADED (Dashboard) ===");
      console.log("Total tasks:", allTasks.length);
      if (allTasks.length > 0) {
        console.log("Sample task:", allTasks[0]);
      }
      
      setTasks(allTasks);
      
    } catch (error: any) {
      // Suppress permission errors - handle gracefully
      if (error.message?.includes("Forbidden") || error.message?.includes("permission")) {
        console.log("Permission denied for tasks - user may not have access");
        setTasks([]);
      } else {
        console.error("Failed to fetch my tasks:", error);
        toast.error(error.message || "Failed to load tasks");
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (taskId: number, newProgress: number) => {
    try {
      setUpdatingTask(taskId);
      
      await taskAPI.updateProgress(taskId, {
        progress_percentage: newProgress,
        update_note: `Progress updated to ${newProgress}%`
      });
      
      toast.success("Task progress updated successfully");
      
      // Update local state
      setTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, progress_percentage: newProgress, status: newProgress === 100 ? "completed" : "in_progress" } 
          : t
      ));
      
    } catch (error: any) {
      console.error("Failed to update task progress:", error);
      toast.error(error.message || "Failed to update progress");
    } finally {
      setUpdatingTask(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
      case "started":
        return "bg-blue-500";
      case "not_started":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
      case "started":
        return "In Progress";
      case "not_started":
        return "Not Started";
      default:
        return status;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const myTasks = tasks.length;
  const inProgress = tasks.filter(t => t.status === "in_progress" || t.status === "started").length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const overdue = tasks.filter(t => isOverdue(t.due_date) && t.status !== "completed").length;

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
        <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
        <p className="text-white/90">Track your tasks and update progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#0f5841]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Projects</CardTitle>
            <FolderKanban className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{projects.length}</div>
            <p className="text-xs text-gray-500 mt-1">Team projects</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Tasks</CardTitle>
            <CheckSquare className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{myTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Total assigned tasks</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            <Play className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{inProgress}</div>
            <p className="text-xs text-gray-500 mt-1">Currently working on</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{completed}</div>
            <p className="text-xs text-gray-500 mt-1">Tasks completed</p>
          </CardContent>
        </Card>
      </div>

      {/* My Projects Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">My Projects</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/projects")}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No projects available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((project) => (
                <div
                  key={project.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white"
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {project.team_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(project.start_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tasks assigned yet</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                    isOverdue(task.due_date) && task.status !== "completed"
                      ? "border-l-4 border-l-red-500 bg-red-50/30"
                      : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{task.title}</h3>
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        {isOverdue(task.due_date) && task.status !== "completed" && (
                          <Badge variant="destructive" className="bg-red-500">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {task.project_name && (
                          <span className="flex items-center gap-1">
                            <CheckSquare size={16} />
                            {task.project_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Update */}
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">{task.progress_percentage}%</span>
                    </div>
                    <Progress value={task.progress_percentage} className="h-2" />
                    
                    {task.status !== "completed" && (
                      <div className="flex items-center gap-4 pt-2">
                        <Slider
                          value={[task.progress_percentage]}
                          onValueChange={([value]) => {
                            setTasks(tasks.map(t => 
                              t.id === task.id ? { ...t, progress_percentage: value } : t
                            ));
                          }}
                          max={100}
                          step={5}
                          className="flex-1"
                          disabled={updatingTask === task.id}
                        />
                        <Button
                          onClick={() => handleProgressUpdate(task.id, task.progress_percentage)}
                          size="sm"
                          className="bg-gradient-to-r from-[#0f5841] to-[#194f87]"
                          disabled={updatingTask === task.id}
                        >
                          {updatingTask === task.id ? "Updating..." : "Update"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};