import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { projectAPI, taskAPI, adminAPI, teamAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { ProjectPhases } from "../components/ProjectPhases";
import { AttachmentManager } from "../components/AttachmentManager";
import { TaskSubtasks } from "../components/TaskSubtasks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Plus,
  Trash2,
  TrendingUp,
  UserPlus,
  History,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListTree,
} from "lucide-react";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  progress_percentage: number;
  start_date: string;
  due_date: string;
  created_at: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  team_id: number;
  status: string;
  start_date: string;
  end_date: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
}

interface TaskUpdate {
  progress_percentage: number;
  status: string;
  update_note: string;
  updated_at: string;
  full_name: string;
}

interface TaskAssignment {
  id: number;
  full_name: string;
  email: string;
}

export const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Dialogs state
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [assignTaskDialogOpen, setAssignTaskDialogOpen] = useState(false);
  const [updateProgressDialogOpen, setUpdateProgressDialogOpen] = useState(false);
  const [taskHistoryDialogOpen, setTaskHistoryDialogOpen] = useState(false);
  const [assignmentsDialogOpen, setAssignmentsDialogOpen] = useState(false);
  const [subtasksDialogOpen, setSubtasksDialogOpen] = useState(false);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskUpdate[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);
  
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    start_date: "",
    due_date: "",
    status: "not_started",
    progress_percentage: 0,
    phase_id: null,
  });
  
  const [progressUpdate, setProgressUpdate] = useState({
    progress_percentage: 0,
    update_note: "",
  });
  
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchTasks();
    }
  }, [projectId]);

  useEffect(() => {
    // Fetch users based on role
    if (user?.role === "Admin") {
      // Admins can fetch all users from admin endpoint
      fetchUsers();
    } else if (user?.role === "Manager") {
      // Managers fetch users from their teams
      fetchManagerTeamMembers();
    }
  }, [user?.role]);

  const fetchProjectDetails = async () => {
    try {
      console.log("Fetching project details for project:", projectId);
      
      // Since backend doesn't have GET /projects/:id, fetch all projects and filter
      let response;
      if (user?.role === "Admin") {
        response = await projectAPI.getAllProjects();
      } else {
        response = await projectAPI.getMyProjects();
      }
      
      console.log("Projects response:", response);
      
      // Extract projects array from response
      let projectsList = [];
      if (response && response.success && response.data) {
        projectsList = response.data;
      } else if (response && Array.isArray(response.data)) {
        projectsList = response.data;
      } else if (Array.isArray(response)) {
        projectsList = response;
      }
      
      // Find the project by ID
      const foundProject = projectsList.find((p: any) => p.id === Number(projectId));
      
      if (foundProject) {
        setProject(foundProject);
        console.log("Found project:", foundProject);
      } else {
        console.warn("Project not found with ID:", projectId);
        toast.error("Project not found");
        navigate("/dashboard/projects");
      }
    } catch (error: any) {
      console.error("Failed to fetch project details:", error);
      // Silently handle permission errors
      if (!error.message?.includes("Forbidden") && 
          !error.message?.includes("permission") &&
          !error.message?.includes("not allowed")) {
        toast.error(error.message || "Failed to load project details");
      }
    }
  };
  
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getTasksByProject(Number(projectId));
      console.log("Tasks response:", response);
      
      // Backend returns array directly
      if (Array.isArray(response)) {
        setTasks(response);
      } else if (response.data && Array.isArray(response.data)) {
        setTasks(response.data);
      } else {
        setTasks([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch tasks:", error);
      toast.error(error.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers();
      if (response.data && Array.isArray(response.data)) {
        setAllUsers(response.data);
      } else if (Array.isArray(response)) {
        setAllUsers(response);
      }
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
    }
  };
  
  const fetchManagerTeamMembers = async () => {
    try {
      console.log("=== FETCHING MANAGER TEAM MEMBERS ===");
      setLoadingMembers(true);
      
      // Step 1: Get manager's teams
      console.log("Step 1: Fetching manager's teams via /teams/my-teams");
      const teamsResponse = await teamAPI.getMyTeams();
      console.log("My teams response:", teamsResponse);
      
      let teams = [];
      if (teamsResponse && teamsResponse.data && Array.isArray(teamsResponse.data)) {
        teams = teamsResponse.data;
      } else if (Array.isArray(teamsResponse)) {
        teams = teamsResponse;
      } else if (teamsResponse && teamsResponse.teams && Array.isArray(teamsResponse.teams)) {
        teams = teamsResponse.teams;
      }
      
      console.log("Found teams:", teams);
      
      if (teams.length === 0) {
        console.warn("Manager has no teams");
        setAllUsers([]);
        return;
      }
      
      // Step 2: Get members from all teams
      console.log("Step 2: Fetching members from all teams");
      const allMembersPromises = teams.map((team: any) => 
        teamAPI.getTeamMembers(team.id).catch(err => {
          // Silently handle permission errors
          if (!err.message?.includes('Forbidden') && 
              !err.message?.includes('permission') && 
              !err.message?.includes('not allowed')) {
            console.error(`Failed to fetch members for team ${team.id}:`, err);
          }
          return [];
        })
      );
      
      const membersResults = await Promise.all(allMembersPromises);
      console.log("Members results:", membersResults);
      
      // Step 3: Combine and deduplicate members
      const allMembers: User[] = [];
      const seenUserIds = new Set<number>();
      
      membersResults.forEach((result) => {
        let members = [];
        if (result && result.data && Array.isArray(result.data)) {
          members = result.data;
        } else if (Array.isArray(result)) {
          members = result;
        } else if (result && result.members && Array.isArray(result.members)) {
          members = result.members;
        }
        
        members.forEach((member: User) => {
          if (!seenUserIds.has(member.id)) {
            seenUserIds.add(member.id);
            allMembers.push(member);
          }
        });
      });
      
      console.log("=== FINAL TEAM MEMBERS ===");
      console.log("Total unique members:", allMembers.length);
      console.log("Members:", allMembers);
      
      setAllUsers(allMembers);
      
    } catch (error: any) {
      console.error("=== MANAGER TEAM MEMBERS ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Full error:", error);
      
      setAllUsers([]);
    } finally {
      setLoadingMembers(false);
    }
  };
  
  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Convert empty date strings to null for MySQL compatibility
      const taskData = {
        ...newTask,
        start_date: newTask.start_date || null,
        due_date: newTask.due_date || null,
        phase_id: newTask.phase_id || null,
      };

      console.log("Creating task with data:", taskData);
      console.log("Project ID:", projectId);
      console.log("Task data stringified:", JSON.stringify(taskData, null, 2));

      const response = await taskAPI.createTask(Number(projectId), taskData);
      console.log("Task creation response:", response);
      toast.success("Task created successfully!");

      setNewTask({
        title: "",
        description: "",
        start_date: "",
        due_date: "",
        status: "not_started",
        progress_percentage: 0,
        phase_id: null,
      });
      setCreateTaskDialogOpen(false);
      fetchTasks();
    } catch (error: any) {
      console.error("Failed to create task:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        error: error
      });
      toast.error(error.message || "Failed to create task. Check console and backend logs for details.");
    }
  };
  
  const handleAssignTask = async () => {
    if (!selectedTask || !selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    
    try {
      await taskAPI.assignTask(selectedTask.id, selectedUserId);
      toast.success("Task assigned successfully!");
      
      setAssignTaskDialogOpen(false);
      setSelectedUserId(null);
      setSelectedTask(null);
    } catch (error: any) {
      console.error("Failed to assign task:", error);
      toast.error(error.message || "Failed to assign task");
    }
  };
  
  const handleUpdateProgress = async () => {
    if (!selectedTask) return;
    
    if (progressUpdate.progress_percentage < 0 || progressUpdate.progress_percentage > 100) {
      toast.error("Progress must be between 0 and 100");
      return;
    }
    
    try {
      await taskAPI.updateProgress(selectedTask.id, progressUpdate);
      toast.success("Progress updated successfully!");
      
      setUpdateProgressDialogOpen(false);
      setProgressUpdate({ progress_percentage: 0, update_note: "" });
      setSelectedTask(null);
      fetchTasks();
    } catch (error: any) {
      console.error("Failed to update progress:", error);
      toast.error(error.message || "Failed to update progress");
    }
  };
  
  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      await taskAPI.deleteTask(taskId);
      toast.success("Task deleted successfully!");
      fetchTasks();
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      toast.error(error.message || "Failed to delete task");
    }
  };
  
  const viewTaskHistory = async (task: Task) => {
    try {
      setSelectedTask(task);
      const history = await taskAPI.getTaskHistory(task.id);
      console.log("Task history:", history);
      
      if (Array.isArray(history)) {
        setTaskHistory(history);
      } else if (history.data && Array.isArray(history.data)) {
        setTaskHistory(history.data);
      } else {
        setTaskHistory([]);
      }
      
      setTaskHistoryDialogOpen(true);
    } catch (error: any) {
      // Handle permission errors gracefully for Members
      if (error.message?.includes("Forbidden") || error.message?.includes("permission")) {
        // Silently fail - button shouldn't be visible for Members anyway
        toast.error("You don't have permission to view task history");
      } else {
        console.error("Failed to fetch task history:", error);
        toast.error(error.message || "Failed to load task history");
      }
    }
  };
  
  const viewTaskAssignments = async (task: Task) => {
    try {
      setSelectedTask(task);
      const assignments = await taskAPI.getAssignments(task.id);
      console.log("Task assignments:", assignments);
      
      if (Array.isArray(assignments)) {
        setTaskAssignments(assignments);
      } else if (assignments.data && Array.isArray(assignments.data)) {
        setTaskAssignments(assignments.data);
      } else {
        setTaskAssignments([]);
      }
      
      setAssignmentsDialogOpen(true);
    } catch (error: any) {
      console.error("Failed to fetch task assignments:", error);
      toast.error(error.message || "Failed to load task assignments");
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "started":
        return "bg-blue-500";
      case "not_started":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "started":
        return "In Progress";
      case "not_started":
        return "Not Started";
      default:
        return status;
    }
  };
  
  const canManageTasks = user?.role === "Manager" || user?.role === "Admin";
  const canUpdateProgress = user?.role === "Member" || user?.role === "Manager" || user?.role === "Admin";
  const canAssignTasks = user?.role === "Manager" || user?.role === "Admin"; // Both Admins and Managers can assign tasks
  
  // Get the user list based on role
  // Both Admins and Managers can see all users now
  const usersForAssignment = (user?.role === "Admin" || user?.role === "Manager") ? allUsers : projectMembers;
  
  // Debug logging
  console.log("Current user role:", user?.role);
  console.log("Users for assignment:", usersForAssignment);
  console.log("All users (admin/manager):", allUsers);
  console.log("Project members (fallback):", projectMembers);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading tasks...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Project Tasks</h1>
            <p className={`mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Manage tasks for this project</p>
          </div>
        </div>
        {canManageTasks && (
          <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className={`max-w-2xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
              <DialogHeader>
                <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>Create New Task</DialogTitle>
                <DialogDescription className={theme === 'dark' ? 'text-gray-300' : ''}>
                  Add a new task to this project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title" className={theme === 'dark' ? 'text-gray-200' : ''}>Task Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-400' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="description" className={theme === 'dark' ? 'text-gray-200' : ''}>Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the task"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                    className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-400' : ''}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date" className={theme === 'dark' ? 'text-gray-200' : ''}>Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={newTask.start_date}
                      onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                      className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="due-date" className={theme === 'dark' ? 'text-gray-200' : ''}>Due Date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateTask}
                  className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87]"
                >
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-l-4 border-l-[#0f5841] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{tasks.length}</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-blue-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {tasks.filter(t => t.status === "started").length}
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-green-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {tasks.filter(t => t.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-gray-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Not Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {tasks.filter(t => t.status === "not_started").length}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className={`h-16 w-16 mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>No tasks yet</h3>
            <p className={`text-center mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {canManageTasks
                ? "Create your first task to get started"
                : "No tasks have been created for this project"}
            </p>
            {canManageTasks && (
              <Button
                onClick={() => setCreateTaskDialogOpen(true)}
                className="bg-gradient-to-r from-[#0f5841] to-[#194f87]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className={`hover:shadow-lg transition-shadow ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className={`text-xl ${theme === 'dark' ? 'text-white' : ''}`}>{task.title}</CardTitle>
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                    </div>
                    <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{task.description}</p>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Progress</span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{task.progress_percentage}%</span>
                      </div>
                      <Progress value={task.progress_percentage} className="h-2" />
                    </div>

                    {/* Task Dates */}
                    <div className={`flex items-center gap-4 mt-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {task.start_date && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          Start: {new Date(task.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <AlertCircle size={14} />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {canUpdateProgress && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTask(task);
                        setProgressUpdate({
                          progress_percentage: task.progress_percentage,
                          update_note: "",
                        });
                        setUpdateProgressDialogOpen(true);
                      }}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Update Progress
                    </Button>
                  )}
                  
                  {canAssignTasks && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTask(task);
                        setAssignTaskDialogOpen(true);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign User
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewTaskAssignments(task)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    View Assignments
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTask(task);
                      setSubtasksDialogOpen(true);
                    }}
                  >
                    <ListTree className="mr-2 h-4 w-4" />
                    Subtasks
                  </Button>
                  
                  {/* Only show History button for Admins and Managers */}
                  {(user?.role === "Admin" || user?.role === "Manager") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewTaskHistory(task)}
                    >
                      <History className="mr-2 h-4 w-4" />
                      History
                    </Button>
                  )}
                  
                  {canManageTasks && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Project Phases Section */}
      {projectId && (
        <div className="mt-8">
          <ProjectPhases projectId={Number(projectId)} />
        </div>
      )}
      
      {/* Attachments Section */}
      {projectId && (
        <div className="mt-8">
          <AttachmentManager entityId={Number(projectId)} entityType="project" />
        </div>
      )}
      
      {/* Assign Task Dialog */}
      <Dialog open={assignTaskDialogOpen} onOpenChange={(open) => {
        setAssignTaskDialogOpen(open);
        if (!open) {
          setSelectedTask(null);
          setSelectedUserId(null);
        }
      }}>
        <DialogContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>Assign Task to User</DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-gray-300' : ''}>
              Select a user to assign this task to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="task-name" className={theme === 'dark' ? 'text-gray-200' : ''}>Task</Label>
              <Input
                id="task-name"
                value={selectedTask?.title || ""}
                readOnly
                className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50'}
              />
            </div>
            <div>
              <Label htmlFor="user-select" className={theme === 'dark' ? 'text-gray-200' : ''}>Select User</Label>
              {loadingMembers ? (
                <div className={`text-sm py-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading users...</div>
              ) : usersForAssignment.length === 0 ? (
                <div className={`text-sm py-2 rounded-md px-3 ${theme === 'dark' ? 'text-amber-400 bg-amber-950' : 'text-amber-600 bg-amber-50'}`}>
                  <p className="font-medium">No users available</p>
                  <p className="text-xs mt-1">
                    {user?.role === "Admin"
                      ? "No users found in the system."
                      : "No team members found. The project manager needs to add team members to this project's team."}
                  </p>
                  {project?.team_id && (
                    <p className="text-xs mt-1">Team ID: {project.team_id}</p>
                  )}
                </div>
              ) : (
                <select
                  id="user-select"
                  value={selectedUserId || ""}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    theme === 'dark'
                      ? 'bg-slate-700 border-slate-600 text-white focus:ring-blue-400'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select a user</option>
                  {usersForAssignment.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <Button
              onClick={handleAssignTask}
              className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87]"
              disabled={!selectedUserId || loadingMembers}
            >
              Assign Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Update Progress Dialog */}
      <Dialog open={updateProgressDialogOpen} onOpenChange={(open) => {
        setUpdateProgressDialogOpen(open);
        if (!open) {
          setSelectedTask(null);
          setProgressUpdate({ progress_percentage: 0, update_note: "" });
        }
      }}>
        <DialogContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>Update Task Progress</DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-gray-300' : ''}>
              Update the progress of this task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="task-title" className={theme === 'dark' ? 'text-gray-200' : ''}>Task</Label>
              <Input
                id="task-title"
                value={selectedTask?.title || ""}
                readOnly
                className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50'}
              />
            </div>
            <div>
              <Label htmlFor="progress" className={theme === 'dark' ? 'text-gray-200' : ''}>Progress Percentage (0-100)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={progressUpdate.progress_percentage}
                onChange={(e) => setProgressUpdate({
                  ...progressUpdate,
                  progress_percentage: Number(e.target.value)
                })}
                className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}
              />
            </div>
            <div>
              <Label htmlFor="note" className={theme === 'dark' ? 'text-gray-200' : ''}>Update Note</Label>
              <Textarea
                id="note"
                placeholder="Add a note about this update"
                value={progressUpdate.update_note}
                onChange={(e) => setProgressUpdate({
                  ...progressUpdate,
                  update_note: e.target.value
                })}
                rows={3}
                className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-400' : ''}
              />
            </div>
            <Button
              onClick={handleUpdateProgress}
              className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87]"
            >
              Update Progress
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Task History Dialog */}
      <Dialog open={taskHistoryDialogOpen} onOpenChange={(open) => {
        setTaskHistoryDialogOpen(open);
        if (!open) {
          setSelectedTask(null);
          setTaskHistory([]);
        }
      }}>
        <DialogContent className={`max-w-3xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>Task History</DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-gray-300' : ''}>
              View all updates for: {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {taskHistory.length === 0 ? (
              <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No history available</p>
            ) : (
              taskHistory.map((update, index) => (
                <Card key={index} className={`border-l-4 border-l-blue-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{update.full_name}</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(update.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(update.status)}>
                        {getStatusLabel(update.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Progress:</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{update.progress_percentage}%</span>
                      <Progress value={update.progress_percentage} className="h-2 flex-1" />
                    </div>
                    {update.update_note && (
                      <p className={`text-sm mt-2 p-2 rounded ${theme === 'dark' ? 'text-gray-300 bg-slate-600' : 'text-gray-700 bg-gray-50'}`}>
                        {update.update_note}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Task Assignments Dialog */}
      <Dialog open={assignmentsDialogOpen} onOpenChange={(open) => {
        setAssignmentsDialogOpen(open);
        if (!open) {
          setSelectedTask(null);
          setTaskAssignments([]);
        }
      }}>
        <DialogContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>Task Assignments</DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-gray-300' : ''}>
              Users assigned to: {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {taskAssignments.length === 0 ? (
              <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No users assigned</p>
            ) : (
              taskAssignments.map((assignment) => (
                <Card key={assignment.id} className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0f5841] to-[#194f87] flex items-center justify-center text-white font-medium">
                        {assignment.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{assignment.full_name}</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{assignment.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Task Subtasks Dialog */}
      <Dialog open={subtasksDialogOpen} onOpenChange={(open) => {
        setSubtasksDialogOpen(open);
        if (!open) {
          setSelectedTask(null);
        }
      }}>
        <DialogContent className={`max-w-3xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>Task Subtasks</DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-gray-300' : ''}>
              View and manage subtasks for: {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {selectedTask ? (
              <TaskSubtasks taskId={selectedTask.id} />
            ) : (
              <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No task selected</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};