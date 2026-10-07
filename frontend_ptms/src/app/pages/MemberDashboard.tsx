import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import {
  CheckSquare,
  Calendar,
  AlertCircle,
  Play,
  CheckCircle2,
  FolderKanban,
  Users,
  RefreshCw
} from "lucide-react";
import { Slider } from "../components/ui/slider";
import { toast } from "sonner";
import { taskAPI, projectAPI, unwrapList } from "../utils/api";
import { useNavigate } from "react-router";
import { useTheme } from "../context/ThemeContext";

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
  const { theme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Local overrides for the in-card progress slider (before the value is saved).
  const [draftProgress, setDraftProgress] = useState<Record<number, number>>({});

  const { data: projects = [] } = useQuery({
    queryKey: ["my-projects"],
    queryFn: async (): Promise<Project[]> => unwrapList<Project>(await projectAPI.getMyProjects()),
  });

  const {
    data: tasks = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["my-dashboard-tasks"],
    queryFn: async (): Promise<Task[]> => {
      const projectsList = unwrapList<any>(await projectAPI.getMyProjects());
      if (projectsList.length === 0) return [];

      const allTasksArrays = await Promise.all(
        projectsList.map(async (project: any) => {
          try {
            return unwrapList<any>(await taskAPI.getTasksByProject(project.id)).map((task: any) => ({
              ...task,
              project_name: project.name,
              project_id: project.id,
            }));
          } catch {
            return [];
          }
        }),
      );
      return allTasksArrays.flat();
    },
  });

  const progressMutation = useMutation({
    mutationFn: ({ taskId, newProgress }: { taskId: number; newProgress: number }) =>
      taskAPI.updateProgress(taskId, {
        progress_percentage: newProgress,
        update_note: `Progress updated to ${newProgress}%`,
      }),
    onSuccess: (_data, { taskId }) => {
      toast.success("Task progress updated successfully");
      setDraftProgress((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-tasks"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update progress"),
  });

  const updatingTask = progressMutation.isPending ? progressMutation.variables?.taskId : null;

  // Effective progress for display: local draft if present, else the saved value.
  const progressOf = (task: Task) => draftProgress[task.id] ?? task.progress_percentage;
  const setDraft = (taskId: number, value: number) =>
    setDraftProgress((prev) => ({ ...prev, [taskId]: value }));
  const handleProgressUpdate = (taskId: number, newProgress: number) =>
    progressMutation.mutate({ taskId, newProgress });

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
  const inProgress = tasks.filter((t: Task) => t.status === "in_progress" || t.status === "started").length;
  const completed = tasks.filter((t: Task) => t.status === "completed").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Couldn't load dashboard</h3>
          <p className={`text-center mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {(error as Error)?.message || "Something went wrong while fetching your tasks."}
          </p>
          <Button onClick={() => refetch()} className="bg-gradient-to-r from-[#0f5841] to-[#194f87]">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f5841] to-[#194f87] rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          My Dashboard
          {isFetching && <RefreshCw className="h-5 w-5 animate-spin text-white/80" />}
        </h1>
        <p className="text-white/90">Track your tasks and update progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`border-l-4 border-l-[#0f5841] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>My Projects</CardTitle>
            <FolderKanban className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{projects.length}</div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Team projects</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-purple-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>My Tasks</CardTitle>
            <CheckSquare className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{myTasks}</div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Total assigned tasks</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-blue-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>In Progress</CardTitle>
            <Play className={`h-5 w-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{inProgress}</div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Currently working on</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-green-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Completed</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{completed}</div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Tasks completed</p>
          </CardContent>
        </Card>
      </div>

      {/* My Projects Section */}
      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>My Projects</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/projects")}
              className={theme === 'dark' ? 'border-slate-600 text-gray-200 hover:bg-slate-700' : ''}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No projects available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((project: Project) => (
                <div
                  key={project.id}
                  className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white'}`}
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{project.name}</h3>
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3 line-clamp-2`}>{project.description}</p>
                  <div className={`flex items-center gap-3 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
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
      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tasks assigned yet</p>
              </div>
            ) : (
              tasks.map((task: Task) => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                    isOverdue(task.due_date) && task.status !== "completed"
                      ? `border-l-4 border-l-red-500 ${theme === 'dark' ? 'bg-red-900/20 border-slate-600' : 'bg-red-50/30'}`
                      : theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
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
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{task.description}</p>
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

                  {/* Progress Update */}
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Progress</span>
                      <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{progressOf(task)}%</span>
                    </div>
                    <Progress value={progressOf(task)} className="h-2" />

                    {task.status !== "completed" && (
                      <>
                        <div className="flex items-center gap-4 pt-2">
                          <Slider
                            value={[progressOf(task)]}
                            onValueChange={([value]) => setDraft(task.id, value)}
                            max={100}
                            step={5}
                            className="flex-1"
                            disabled={updatingTask === task.id}
                          />
                          <Button
                            onClick={() => handleProgressUpdate(task.id, progressOf(task))}
                            size="sm"
                            className="bg-gradient-to-r from-[#0f5841] to-[#194f87]"
                            disabled={updatingTask === task.id}
                          >
                            {updatingTask === task.id ? "Updating..." : "Update"}
                          </Button>
                        </div>
                        {/* Quick Progress Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleProgressUpdate(task.id, 25)}
                            disabled={updatingTask === task.id}
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
                            onClick={() => handleProgressUpdate(task.id, 50)}
                            disabled={updatingTask === task.id}
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
                            onClick={() => handleProgressUpdate(task.id, 75)}
                            disabled={updatingTask === task.id}
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
                            onClick={() => handleProgressUpdate(task.id, 100)}
                            disabled={updatingTask === task.id}
                            className={theme === 'dark' 
                              ? 'border-slate-600 text-gray-200 hover:bg-slate-700 hover:text-white' 
                              : 'hover:bg-gray-100'
                            }
                          >
                            100%
                          </Button>
                        </div>
                      </>
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