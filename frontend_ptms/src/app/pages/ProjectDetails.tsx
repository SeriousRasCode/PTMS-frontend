import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { projectAPI, taskAPI, adminAPI, teamAPI, unwrapList } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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
  RefreshCw,
  Search,
  CheckSquare,
  Play,
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
  
  const queryClient = useQueryClient();

  // Filters live in the URL so they survive refresh and can be shared/bookmarked.
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const sort = searchParams.get("sort") || "default";

  const [searchInput, setSearchInput] = useState(search);

  // Values at their default are dropped from the URL to keep it clean.
  const DEFAULTS: Record<string, string> = { status: "all", sort: "default" };
  const updateParams = (updates: Record<string, string>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value && value !== DEFAULTS[key]) next.set(key, value);
          else next.delete(key);
        });
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    if (searchInput === search) return;
    const id = setTimeout(() => updateParams({ q: searchInput }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

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
  
  // Project: backend has no GET /projects/:id, so fetch the list and find by id.
  const { data: project = null } = useQuery({
    queryKey: ["project", projectId, user?.role],
    enabled: !!projectId && !!user,
    queryFn: async (): Promise<Project | null> => {
      const response =
        user?.role === "Admin"
          ? await projectAPI.getAllProjects()
          : await projectAPI.getMyProjects();
      const projectsList = unwrapList<any>(response);
      return projectsList.find((p: any) => p.id === Number(projectId)) || null;
    },
  });

  const {
    data: tasks = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["tasks", "project", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<Task[]> => {
      const response = await taskAPI.getTasksByProject(Number(projectId));
      return unwrapList<Task>(response);
    },
  });

  // Users available for assignment (Admins: everyone; Managers: their team members).
  const { data: usersForAssignment = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["assignable-users", user?.role, user?.id],
    enabled: !!user && (user.role === "Admin" || user.role === "Manager"),
    queryFn: async (): Promise<User[]> => {
      if (user?.role === "Admin") {
        return unwrapList<User>(await adminAPI.getAllUsers());
      }

      // Manager: gather members from all their teams, deduplicated.
      const teams = unwrapList<any>(await teamAPI.getMyTeams());
      if (teams.length === 0) return [];

      const membersResults = await Promise.all(
        teams.map((team: any) =>
          teamAPI.getTeamMembers(team.id).catch((err: any) => {
            if (!err.message?.includes("Forbidden") &&
                !err.message?.includes("permission") &&
                !err.message?.includes("not allowed")) {
              console.error(`Failed to fetch members for team ${team.id}:`, err);
            }
            return [];
          }),
        ),
      );

      const seenUserIds = new Set<number>();
      const allMembers: User[] = [];
      membersResults.forEach((result) => {
        unwrapList<User>(result).forEach((member) => {
          if (!seenUserIds.has(member.id)) {
            seenUserIds.add(member.id);
            allMembers.push(member);
          }
        });
      });
      return allMembers;
    },
  });

  const invalidateTasks = () =>
    queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] });

  const createTaskMutation = useMutation({
    mutationFn: () =>
      taskAPI.createTask(Number(projectId), {
        ...newTask,
        start_date: newTask.start_date || "",
        due_date: newTask.due_date || "",
        phase_id: newTask.phase_id || null,
      }),
    onSuccess: () => {
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
      invalidateTasks();
    },
    onError: (error: any) => {
      console.error("Failed to create task:", error);
      toast.error(error.message || "Failed to create task. Check console and backend logs for details.");
    },
  });

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    createTaskMutation.mutate();
  };

  const assignTaskMutation = useMutation({
    mutationFn: ({ taskId, userId }: { taskId: number; userId: number }) =>
      taskAPI.assignTask(taskId, userId),
    onSuccess: () => {
      toast.success("Task assigned successfully!");
      setAssignTaskDialogOpen(false);
      setSelectedUserId(null);
      setSelectedTask(null);
    },
    onError: (error: any) => {
      console.error("Failed to assign task:", error);
      toast.error(error.message || "Failed to assign task");
    },
  });

  const handleAssignTask = () => {
    if (!selectedTask || !selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    assignTaskMutation.mutate({ taskId: selectedTask.id, userId: selectedUserId });
  };

  const updateProgressMutation = useMutation({
    mutationFn: (taskId: number) => taskAPI.updateProgress(taskId, progressUpdate),
    onSuccess: () => {
      toast.success("Progress updated successfully!");
      setUpdateProgressDialogOpen(false);
      setProgressUpdate({ progress_percentage: 0, update_note: "" });
      setSelectedTask(null);
      invalidateTasks();
    },
    onError: (error: any) => {
      console.error("Failed to update progress:", error);
      toast.error(error.message || "Failed to update progress");
    },
  });

  const handleUpdateProgress = () => {
    if (!selectedTask) return;

    if (progressUpdate.progress_percentage < 0 || progressUpdate.progress_percentage > 100) {
      toast.error("Progress must be between 0 and 100");
      return;
    }
    updateProgressMutation.mutate(selectedTask.id);
  };

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => taskAPI.deleteTask(taskId),
    onSuccess: () => {
      toast.success("Task deleted successfully!");
      invalidateTasks();
    },
    onError: (error: any) => {
      console.error("Failed to delete task:", error);
      toast.error(error.message || "Failed to delete task");
    },
  });

  const handleDeleteTask = (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    deleteTaskMutation.mutate(taskId);
  };
  
  const viewTaskHistory = async (task: Task) => {
    try {
      setSelectedTask(task);
      const history = await taskAPI.getTaskHistory(task.id);
      setTaskHistory(unwrapList<TaskUpdate>(history));
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
      setTaskAssignments(unwrapList<TaskAssignment>(assignments));
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Couldn't load tasks</h3>
          <p className={`text-center mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {(error as Error)?.message || "Something went wrong while fetching this project's tasks."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard/projects")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
            <Button onClick={() => refetch()} className="bg-gradient-to-r from-[#0f5841] to-[#194f87]">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Search filter feeds the stat cards; status + sort additionally shape the list.
  const searchLower = search.toLowerCase();
  const searchFiltered = tasks.filter((t: Task) => {
    if (!searchLower) return true;
    return (
      t.title?.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower)
    );
  });

  const statusMatched =
    statusFilter === "all"
      ? searchFiltered
      : searchFiltered.filter((t: Task) =>
          statusFilter === "in_progress"
            ? t.status === "started" || t.status === "in_progress"
            : t.status === statusFilter,
        );

  const visibleTasks = [...statusMatched].sort((a: Task, b: Task) => {
    switch (sort) {
      case "due-asc":
        return (a.due_date || "").localeCompare(b.due_date || "");
      case "due-desc":
        return (b.due_date || "").localeCompare(a.due_date || "");
      case "progress-desc":
        return (b.progress_percentage || 0) - (a.progress_percentage || 0);
      case "progress-asc":
        return (a.progress_percentage || 0) - (b.progress_percentage || 0);
      case "title-asc":
        return (a.title || "").localeCompare(b.title || "");
      default:
        return 0;
    }
  });

  const hasActiveFilters = !!(search || statusFilter !== "all" || sort !== "default");
  const clearFilters = () => {
    setSearchInput("");
    updateParams({ q: "", status: "all", sort: "default" });
  };

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
            <h1 className={`text-3xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {project?.name || "Project Tasks"}
              {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
            </h1>
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
            <DialogContent className={`max-w-2xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
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
                  disabled={createTaskMutation.isPending}
                  className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87]"
                >
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search + Filters */}
      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardContent className="flex flex-wrap items-end gap-4 py-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="task-search" className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="task-search"
                placeholder="Search by title or description"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`pl-8 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
          </div>
          <div className="min-w-[160px]">
            <Label className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Status</Label>
            <Select value={statusFilter} onValueChange={(value) => updateParams({ status: value })}>
              <SelectTrigger className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white'}>
                <SelectItem value="all" className={theme === 'dark' ? 'text-white' : ''}>All statuses</SelectItem>
                <SelectItem value="not_started" className={theme === 'dark' ? 'text-white' : ''}>Not Started</SelectItem>
                <SelectItem value="in_progress" className={theme === 'dark' ? 'text-white' : ''}>In Progress</SelectItem>
                <SelectItem value="completed" className={theme === 'dark' ? 'text-white' : ''}>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[170px]">
            <Label className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Sort by</Label>
            <Select value={sort} onValueChange={(value) => updateParams({ sort: value })}>
              <SelectTrigger className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}>
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white'}>
                <SelectItem value="default" className={theme === 'dark' ? 'text-white' : ''}>Default</SelectItem>
                <SelectItem value="due-asc" className={theme === 'dark' ? 'text-white' : ''}>Due date (earliest)</SelectItem>
                <SelectItem value="due-desc" className={theme === 'dark' ? 'text-white' : ''}>Due date (latest)</SelectItem>
                <SelectItem value="progress-desc" className={theme === 'dark' ? 'text-white' : ''}>Progress (high → low)</SelectItem>
                <SelectItem value="progress-asc" className={theme === 'dark' ? 'text-white' : ''}>Progress (low → high)</SelectItem>
                <SelectItem value="title-asc" className={theme === 'dark' ? 'text-white' : ''}>Title (A → Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className={theme === 'dark' ? 'border-slate-600 text-gray-200 hover:bg-slate-700' : ''}
            >
              Clear
            </Button>
          )}
          {hasActiveFilters && (
            <span className={`text-sm ml-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Showing {visibleTasks.length} of {tasks.length} tasks
            </span>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-l-4 border-l-[#0f5841] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Tasks</CardTitle>
            <CheckSquare className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{searchFiltered.length}</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${theme === 'dark' ? 'border-l-blue-400 bg-slate-800 border-slate-700' : 'border-l-blue-500 bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>In Progress</CardTitle>
            <Play className={`h-5 w-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {searchFiltered.filter((t: Task) => t.status === "started" || t.status === "in_progress").length}
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-green-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Completed</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {searchFiltered.filter((t: Task) => t.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${theme === 'dark' ? 'border-l-gray-500 bg-slate-800 border-slate-700' : 'border-l-gray-400 bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Not Started</CardTitle>
            <Clock className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {searchFiltered.filter((t: Task) => t.status === "not_started").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      {visibleTasks.length === 0 ? (
        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className={`h-16 w-16 mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            {tasks.length > 0 ? (
              <>
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>No tasks match your filters</h3>
                <p className={`text-center mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Try adjusting the search, status or sort options
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className={theme === 'dark' ? 'border-slate-600 text-gray-200 hover:bg-slate-700' : ''}
                >
                  Clear filters
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleTasks.map((task: Task) => (
            <Card key={task.id} className={`hover:shadow-lg transition-shadow ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
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
                <div className={`flex flex-wrap gap-2 pt-2 border-t ${theme === 'dark' ? 'border-slate-600' : ''}`}>
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
        <DialogContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
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
                  {usersForAssignment.map((u: User) => (
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
              disabled={!selectedUserId || loadingMembers || assignTaskMutation.isPending}
            >
              {assignTaskMutation.isPending ? "Assigning..." : "Assign Task"}
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
        <DialogContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
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
              {/* Quick Progress Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProgressUpdate({
                    ...progressUpdate,
                    progress_percentage: 25
                  })}
                  className={theme === 'dark' 
                    ? 'border-slate-600 text-gray-200 hover:bg-slate-700 hover:text-white' 
                    : 'hover:bg-gray-100'
                  }
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProgressUpdate({
                    ...progressUpdate,
                    progress_percentage: 50
                  })}
                  className={theme === 'dark' 
                    ? 'border-slate-600 text-gray-200 hover:bg-slate-700 hover:text-white' 
                    : 'hover:bg-gray-100'
                  }
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProgressUpdate({
                    ...progressUpdate,
                    progress_percentage: 75
                  })}
                  className={theme === 'dark' 
                    ? 'border-slate-600 text-gray-200 hover:bg-slate-700 hover:text-white' 
                    : 'hover:bg-gray-100'
                  }
                >
                  75%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProgressUpdate({
                    ...progressUpdate,
                    progress_percentage: 100
                  })}
                  className={theme === 'dark' 
                    ? 'border-slate-600 text-gray-200 hover:bg-slate-700 hover:text-white' 
                    : 'hover:bg-gray-100'
                  }
                >
                  100%
                </Button>
              </div>
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
              disabled={updateProgressMutation.isPending}
              className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87]"
            >
              {updateProgressMutation.isPending ? "Updating..." : "Update Progress"}
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
        <DialogContent className={`max-w-3xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
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
              taskHistory.map((update: TaskUpdate, index: number) => (
                <Card key={index} className={`border-l-4 border-l-blue-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white'}`}>
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
        <DialogContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
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
              taskAssignments.map((assignment: TaskAssignment) => (
                <Card key={assignment.id} className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white'}>
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
        <DialogContent className={`max-w-3xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
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