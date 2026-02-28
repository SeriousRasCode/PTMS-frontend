import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { CheckSquare, AlertCircle, Calendar, CheckCircle2, Play, TrendingUp, History } from "lucide-react";
import { taskAPI, projectAPI } from "../utils/api";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [updateProgressDialogOpen, setUpdateProgressDialogOpen] = useState(false);
  const [taskHistoryDialogOpen, setTaskHistoryDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskUpdate[]>([]);
  
  const [progressUpdate, setProgressUpdate] = useState({
    progress_percentage: 0,
    update_note: "",
  });

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      
      console.log("=== FETCHING MY TASKS (via Projects like ProjectDetails) ===");
      
      // Get all projects first
      const projectsResponse = await projectAPI.getMyProjects();
      console.log("Projects response:", projectsResponse);
      
      // Extract projects array (same logic as ProjectDetails)
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
      
      // Fetch tasks for each project (EXACT same logic as ProjectDetails)
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
      
      console.log("=== TASKS LOADED ===");
      console.log("Total tasks:", allTasks.length);
      if (allTasks.length > 0) {
        console.log("Sample task:", allTasks[0]);
      }
      
      setTasks(allTasks);
      
    } catch (error: any) {
      // Suppress permission errors for Members (they might not have access to some endpoints)
      if (error.message?.includes("Forbidden") || error.message?.includes("permission")) {
        console.log("Permission denied - user may not have access to tasks");
        toast.error("You don't have permission to view tasks");
      } else {
        console.error("=== FETCH TASKS ERROR ===");
        console.error("Error:", error);
        toast.error(error.message || "Failed to load tasks");
      }
      setTasks([]);
    } finally {
      setLoading(false);
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

  const filterTasks = (filterType: string) => {
    switch (filterType) {
      case "in-progress":
        return tasks.filter(t => t.status === "in_progress" || t.status === "started");
      case "completed":
        return tasks.filter(t => t.status === "completed");
      case "not-started":
        return tasks.filter(t => t.status === "not_started");
      default:
        return tasks;
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
      fetchMyTasks();
    } catch (error: any) {
      console.error("Failed to update progress:", error);
      toast.error(error.message || "Failed to update progress");
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

  const renderTaskCard = (task: Task) => (
    <Card key={task.id} className={`hover:shadow-lg transition-shadow ${
      isOverdue(task.due_date) && task.status !== "completed"
        ? "border-l-4 border-l-red-500"
        : ""
    }`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
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
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold text-gray-900">{task.progress_percentage}%</span>
            </div>
            <Progress value={task.progress_percentage} className="h-2" />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
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
              className="flex-1"
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
                className="flex-1"
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading tasks...</div>
      </div>
    );
  }

  const allTasks = tasks;
  const inProgressTasks = filterTasks("in-progress");
  const completedTasks = filterTasks("completed");
  const notStartedTasks = filterTasks("not-started");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">View and manage your assigned tasks</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#0f5841]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
            <CheckSquare className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{allTasks.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            <Play className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{inProgressTasks.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{completedTasks.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {allTasks.filter(t => isOverdue(t.due_date) && t.status !== "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tasks ({allTasks.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({inProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
          <TabsTrigger value="not-started">Not Started ({notStartedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {allTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckSquare className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks assigned</h3>
                <p className="text-gray-600 text-center">
                  You don't have any tasks assigned yet
                </p>
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
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Play className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks in progress</h3>
                <p className="text-gray-600 text-center">
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
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle2 className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed tasks</h3>
                <p className="text-gray-600 text-center">
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
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckSquare className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending tasks</h3>
                <p className="text-gray-600 text-center">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Progress</DialogTitle>
            <DialogDescription>
              Update the progress of this task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="task-title">Task</Label>
              <Input
                id="task-title"
                value={selectedTask?.title || ""}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="progress">Progress Percentage (0-100)</Label>
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
              />
            </div>
            <div>
              <Label htmlFor="note">Update Note</Label>
              <Textarea
                id="note"
                placeholder="Add a note about this update"
                value={progressUpdate.update_note}
                onChange={(e) => setProgressUpdate({ 
                  ...progressUpdate, 
                  update_note: e.target.value 
                })}
                rows={3}
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Task History</DialogTitle>
            <DialogDescription>
              View all updates for: {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {taskHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No history available</p>
            ) : (
              taskHistory.map((update, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{update.full_name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(update.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(update.status)}>
                        {getStatusLabel(update.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-600">Progress:</span>
                      <span className="font-medium text-gray-900">{update.progress_percentage}%</span>
                      <Progress value={update.progress_percentage} className="h-2 flex-1" />
                    </div>
                    {update.update_note && (
                      <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
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