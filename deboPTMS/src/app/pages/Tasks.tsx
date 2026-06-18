import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { CheckSquare, AlertCircle, Calendar, CheckCircle2, Play, TrendingUp, History, RefreshCw, Search } from "lucide-react";
import { taskAPI, projectAPI, unwrapList } from "../utils/api";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface Task {
  id: number;
  title: string;
  description: string;
  project_name?: string;
  project_id?: number;
  status: string;
  progress_percentage: number;
  due_date: string;
  start_date?: string;
}

interface TaskUpdate {
  progress_percentage: number;
  status: string;
  update_note: string;
  updated_at: string;
  full_name: string;
}

export const Tasks = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  // Dialog states
  const [updateProgressDialogOpen, setUpdateProgressDialogOpen] = useState(false);
  const [taskHistoryDialogOpen, setTaskHistoryDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskUpdate[]>([]);

  const [progressUpdate, setProgressUpdate] = useState({
    progress_percentage: 0,
    update_note: "",
  });

  // Filters live in the URL so they survive refresh and can be shared/bookmarked.
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const projectFilter = searchParams.get("project") || "all";
  const dueFrom = searchParams.get("from") || "";
  const dueTo = searchParams.get("to") || "";
  const sort = searchParams.get("sort") || "default";
  const activeTab = searchParams.get("tab") || "all";

  // Local mirror of the search box so typing is instant; debounced into the URL.
  const [searchInput, setSearchInput] = useState(search);

  // Values equal to a param's default are dropped from the URL to keep it clean.
  const DEFAULTS: Record<string, string> = { project: "all", sort: "default", tab: "all" };
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

  const {
    data: tasks = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["tasks", "my", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Task[]> => {
      // Get all projects first, then fan out to their tasks
      const projectsResponse = await projectAPI.getMyProjects();
      const projectsList = unwrapList<any>(projectsResponse);

      if (projectsList.length === 0) {
        return [];
      }

      // Fetch tasks for each project (same handling as ProjectDetails)
      const allTasksPromises = projectsList.map(async (project: any) => {
        try {
          const response = await taskAPI.getTasksByProject(project.id);
          // Add project info to each task
          return unwrapList<any>(response).map((task: any) => ({
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
      return allTasksArrays.flat();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
      case "started":
        return theme === 'dark' ? "bg-blue-400" : "bg-blue-500";
      case "not_started":
        return theme === 'dark' ? "bg-gray-600" : "bg-gray-400";
      default:
        return theme === 'dark' ? "bg-gray-600" : "bg-gray-400";
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

  // Distinct projects present in the task list, for the project dropdown.
  const projectOptions: [string, string][] = Array.from(
    new Map(
      (tasks as Task[])
        .filter((t) => t.project_id != null)
        .map((t): [string, string] => [String(t.project_id), t.project_name || `Project ${t.project_id}`]),
    ).entries(),
  );

  // Base filter (search + project + due-date range) applied before the status tabs.
  const searchLower = search.toLowerCase();
  const baseTasks = tasks.filter((t: Task) => {
    if (projectFilter !== "all" && String(t.project_id) !== projectFilter) return false;
    const due = t.due_date?.slice(0, 10);
    if (dueFrom && (!due || due < dueFrom)) return false;
    if (dueTo && (!due || due > dueTo)) return false;
    if (
      searchLower &&
      !t.title?.toLowerCase().includes(searchLower) &&
      !t.description?.toLowerCase().includes(searchLower) &&
      !t.project_name?.toLowerCase().includes(searchLower)
    ) {
      return false;
    }
    return true;
  });

  // Sort the filtered list (applied before splitting into status tabs).
  const sortedTasks = [...baseTasks].sort((a: Task, b: Task) => {
    switch (sort) {
      case "due-asc":
        return (a.due_date || "").localeCompare(b.due_date || "");
      case "due-desc":
        return (b.due_date || "").localeCompare(a.due_date || "");
      case "progress-asc":
        return (a.progress_percentage || 0) - (b.progress_percentage || 0);
      case "progress-desc":
        return (b.progress_percentage || 0) - (a.progress_percentage || 0);
      case "title-asc":
        return (a.title || "").localeCompare(b.title || "");
      default:
        return 0;
    }
  });

  const hasActiveFilters = !!(search || dueFrom || dueTo || projectFilter !== "all" || sort !== "default");

  const clearFilters = () => {
    setSearchInput("");
    updateParams({ q: "", project: "all", from: "", to: "", sort: "default" });
  };

  const filterTasks = (filterType: string) => {
    switch (filterType) {
      case "in-progress":
        return sortedTasks.filter((t: Task) => t.status === "in_progress" || t.status === "started");
      case "completed":
        return sortedTasks.filter((t: Task) => t.status === "completed");
      case "not-started":
        return sortedTasks.filter((t: Task) => t.status === "not_started");
      default:
        return sortedTasks;
    }
  };
  
  const updateProgressMutation = useMutation({
    mutationFn: (taskId: number) => taskAPI.updateProgress(taskId, progressUpdate),
    onSuccess: () => {
      toast.success("Progress updated successfully!");
      setUpdateProgressDialogOpen(false);
      setProgressUpdate({ progress_percentage: 0, update_note: "" });
      setSelectedTask(null);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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

  const renderTaskCard = (task: Task) => (
    <Card key={task.id} className={`hover:shadow-lg transition-shadow ${
      isOverdue(task.due_date) && task.status !== "completed"
        ? "border-l-4 border-l-red-500"
        : ""
    } ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{task.title}</h3>
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
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3`}>{task.description}</p>
              <div className={`flex items-center gap-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Progress</span>
              <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{task.progress_percentage}%</span>
            </div>
            <Progress value={task.progress_percentage} className="h-2" />
          </div>
          
          {/* Action Buttons */}
          <div className={`flex flex-wrap gap-2 pt-2 border-t ${theme === 'dark' ? 'border-slate-600' : ''}`}>
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
              className={`flex-1 ${theme === 'dark' ? 'border-slate-600 text-gray-200 hover:bg-slate-700' : ''}`}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Update Progress
            </Button>
            
            {/* Only show History button for Admins and Managers */}
            {(user?.role === "Admin" || user?.role === "Manager") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => viewTaskHistory(task)}
                className={`flex-1 ${theme === 'dark' ? 'border-slate-600 text-gray-200 hover:bg-slate-700' : ''}`}
              >
                <History className="mr-2 h-4 w-4" />
                View History
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
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
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Couldn't load tasks</h3>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-center mb-4`}>
            {(error as Error)?.message || "Something went wrong while fetching tasks."}
          </p>
          <Button
            onClick={() => refetch()}
            className="bg-gradient-to-r from-[#0f5841] to-[#194f87]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const allTasks = baseTasks;
  const inProgressTasks = filterTasks("in-progress");
  const completedTasks = filterTasks("completed");
  const notStartedTasks = filterTasks("not-started");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Tasks
            {isFetching && <RefreshCw className={`h-4 w-4 animate-spin ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />}
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>View and manage your assigned tasks</p>
        </div>
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
                placeholder="Search by title, description or project"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`pl-8 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
          </div>
          <div className="min-w-[180px]">
            <Label className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Project</Label>
            <Select value={projectFilter} onValueChange={(value) => updateParams({ project: value })}>
              <SelectTrigger className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}>
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}>
                <SelectItem value="all" className={theme === 'dark' ? 'text-white' : ''}>All projects</SelectItem>
                {projectOptions.map(([id, name]) => (
                  <SelectItem key={id} value={id} className={theme === 'dark' ? 'text-white' : ''}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="due-from" className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Due from</Label>
            <Input
              id="due-from"
              type="date"
              value={dueFrom}
              max={dueTo || undefined}
              onChange={(e) => updateParams({ from: e.target.value })}
              className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}
            />
          </div>
          <div>
            <Label htmlFor="due-to" className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>To</Label>
            <Input
              id="due-to"
              type="date"
              value={dueTo}
              min={dueFrom || undefined}
              onChange={(e) => updateParams({ to: e.target.value })}
              className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}
            />
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
              Showing {baseTasks.length} of {tasks.length} tasks
            </span>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-l-4 border-l-[#0f5841] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Tasks</CardTitle>
            <CheckSquare className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{allTasks.length}</div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${theme === 'dark' ? 'border-l-blue-400 bg-slate-800 border-slate-700' : 'border-l-blue-500 bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>In Progress</CardTitle>
            <Play className={`h-5 w-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{inProgressTasks.length}</div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-green-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Completed</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{completedTasks.length}</div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-red-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Overdue</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {allTasks.filter((t: Task) => isOverdue(t.due_date) && t.status !== "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className={theme === 'dark' ? 'bg-slate-800' : ''}>
          <TabsTrigger value="all" className={theme === 'dark' ? 'data-[state=active]:bg-slate-700' : ''}>All Tasks ({allTasks.length})</TabsTrigger>
          <TabsTrigger value="in-progress" className={theme === 'dark' ? 'data-[state=active]:bg-slate-700' : ''}>In Progress ({inProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="completed" className={theme === 'dark' ? 'data-[state=active]:bg-slate-700' : ''}>Completed ({completedTasks.length})</TabsTrigger>
          <TabsTrigger value="not-started" className={theme === 'dark' ? 'data-[state=active]:bg-slate-700' : ''}>Not Started ({notStartedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {allTasks.length === 0 ? (
            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckSquare className={`h-16 w-16 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mb-4`} />
                {hasActiveFilters ? (
                  <>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No tasks match your filters</h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-center mb-4`}>
                      Try adjusting the search, project or due-date filters
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
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No tasks assigned</h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-center`}>
                      You don't have any tasks assigned yet
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {allTasks.map(renderTaskCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          {inProgressTasks.length === 0 ? (
            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Play className={`h-16 w-16 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mb-4`} />
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No tasks in progress</h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-center`}>
                  Start working on a task to see it here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {inProgressTasks.map(renderTaskCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTasks.length === 0 ? (
            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle2 className={`h-16 w-16 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mb-4`} />
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No completed tasks</h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-center`}>
                  Completed tasks will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {completedTasks.map(renderTaskCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="not-started" className="space-y-4">
          {notStartedTasks.length === 0 ? (
            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckSquare className={`h-16 w-16 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mb-4`} />
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No pending tasks</h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-center`}>
                  All your tasks have been started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {notStartedTasks.map(renderTaskCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
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
                className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}
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
              <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} py-8`}>No history available</p>
            ) : (
              taskHistory.map((update, index) => (
                <Card key={index} className={`border-l-4 ${theme === 'dark' ? 'border-l-blue-400 bg-slate-700 border-slate-600' : 'border-l-blue-500 bg-white'}`}>
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
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-200 bg-slate-600' : 'text-gray-700 bg-gray-50'} mt-2 p-2 rounded`}>
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
    </div>
  );
};