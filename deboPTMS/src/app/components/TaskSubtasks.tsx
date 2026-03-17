import { useState, useEffect } from "react";
import { toast } from "sonner";
import { subtaskAPI, subtaskAssignmentAPI, adminAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus, Edit2, Trash2, UserPlus, Calendar, TrendingUp } from "lucide-react";

interface Subtask {
  id: number;
  task_id: number;
  title: string;
  description: string;
  start_date: string;
  due_date: string;
  status: string;
  progress_percentage: number;
  created_at: string;
}

interface SubtaskAssignment {
  id: number;
  full_name: string;
  email: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
}

interface TaskSubtasksProps {
  taskId: number;
}

export const TaskSubtasks = ({ taskId }: TaskSubtasksProps) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createSubtaskDialogOpen, setCreateSubtaskDialogOpen] = useState(false);
  const [editSubtaskDialogOpen, setEditSubtaskDialogOpen] = useState(false);
  const [assignSubtaskDialogOpen, setAssignSubtaskDialogOpen] = useState(false);
  const [updateProgressDialogOpen, setUpdateProgressDialogOpen] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);
  const [subtaskAssignments, setSubtaskAssignments] = useState<SubtaskAssignment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [progressData, setProgressData] = useState({
    progress_percentage: 0,
    status: "Not Started",
  });

  const [newSubtask, setNewSubtask] = useState({
    title: "",
    description: "",
    start_date: "",
    due_date: "",
  });

  const isManager = user?.role === "Manager" || user?.role === "Admin";

  useEffect(() => {
    fetchSubtasks();
    if (isManager) {
      fetchAllUsers();
    }
  }, [taskId]);

  const fetchSubtasks = async () => {
    try {
      setLoading(true);
      // Note: You'll need to add this endpoint to get subtasks by task_id
      // For now, we'll assume the backend has this endpoint
      const response = await fetch(
        `http://localhost:3333/api/subtasks/task/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSubtasks(data);
      }
    } catch (error: any) {
      console.error("Failed to fetch subtasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const users = await adminAPI.getAllUsers();
      setAllUsers(users);
    } catch (error: any) {
      toast.error("Failed to fetch users");
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subtaskAPI.createSubtask(taskId, {
        task_id: taskId,
        ...newSubtask,
      });
      toast.success("Subtask created successfully");
      setNewSubtask({
        title: "",
        description: "",
        start_date: "",
        due_date: "",
      });
      setCreateSubtaskDialogOpen(false);
      fetchSubtasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to create subtask");
    }
  };

  const handleUpdateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubtask) return;

    try {
      await subtaskAPI.updateSubtask(selectedSubtask.id, taskId, {
        title: selectedSubtask.title,
        description: selectedSubtask.description,
        start_date: selectedSubtask.start_date,
        due_date: selectedSubtask.due_date,
      });
      toast.success("Subtask updated successfully");
      setEditSubtaskDialogOpen(false);
      setSelectedSubtask(null);
      fetchSubtasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to update subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    if (!window.confirm("Are you sure you want to delete this subtask?")) return;

    try {
      await subtaskAPI.deleteSubtask(subtaskId, taskId);
      toast.success("Subtask deleted successfully");
      fetchSubtasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete subtask");
    }
  };

  const handleAssignSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubtask || !selectedUserId) return;

    try {
      await subtaskAssignmentAPI.assignSubtask({
        subtask_id: selectedSubtask.id,
        user_id: parseInt(selectedUserId),
      });
      toast.success("User assigned to subtask successfully");
      setAssignSubtaskDialogOpen(false);
      setSelectedUserId("");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign user");
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubtask) return;

    try {
      await subtaskAPI.updateSubtaskProgress(selectedSubtask.id, progressData);
      toast.success("Progress updated successfully");
      setUpdateProgressDialogOpen(false);
      setSelectedSubtask(null);
      fetchSubtasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to update progress");
    }
  };

  const fetchSubtaskAssignments = async (subtaskId: number) => {
    try {
      const assignments = await subtaskAssignmentAPI.getSubtaskAssignments(subtaskId);
      setSubtaskAssignments(assignments);
    } catch (error: any) {
      toast.error("Failed to fetch assignments");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "In Progress":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "Not Started":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
      case "Blocked":
        return "bg-red-500/20 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading subtasks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Subtasks
        </h3>
        {isManager && (
          <Dialog open={createSubtaskDialogOpen} onOpenChange={setCreateSubtaskDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#0f5841] to-[#194f87] hover:opacity-90" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Subtask
              </Button>
            </DialogTrigger>
            <DialogContent className={theme === 'dark' ? 'bg-slate-800 text-white' : ''}>
              <DialogHeader>
                <DialogTitle>Create New Subtask</DialogTitle>
                <DialogDescription>
                  Break down the task into smaller, manageable subtasks
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubtask} className="space-y-4">
                <div>
                  <Label htmlFor="subtask-title">Subtask Title</Label>
                  <Input
                    id="subtask-title"
                    value={newSubtask.title}
                    onChange={(e) =>
                      setNewSubtask({ ...newSubtask, title: e.target.value })
                    }
                    required
                    className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="subtask-description">Description</Label>
                  <Textarea
                    id="subtask-description"
                    value={newSubtask.description}
                    onChange={(e) =>
                      setNewSubtask({ ...newSubtask, description: e.target.value })
                    }
                    rows={3}
                    className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subtask-start">Start Date</Label>
                    <Input
                      id="subtask-start"
                      type="date"
                      value={newSubtask.start_date}
                      onChange={(e) =>
                        setNewSubtask({ ...newSubtask, start_date: e.target.value })
                      }
                      required
                      className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtask-due">Due Date</Label>
                    <Input
                      id="subtask-due"
                      type="date"
                      value={newSubtask.due_date}
                      onChange={(e) =>
                        setNewSubtask({ ...newSubtask, due_date: e.target.value })
                      }
                      required
                      className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateSubtaskDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-[#0f5841] to-[#194f87]">
                    Create Subtask
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {subtasks.length === 0 ? (
        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <CardContent className="text-center py-8">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              No subtasks yet. {isManager && "Create one to break down this task!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subtasks.map((subtask) => (
            <Card key={subtask.id} className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className={`text-base mb-2 ${theme === 'dark' ? 'text-white' : ''}`}>
                      {subtask.title}
                    </CardTitle>
                    <Badge className={getStatusColor(subtask.status || "Not Started")}>
                      {subtask.status || "Not Started"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {isManager && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedSubtask(subtask);
                            fetchSubtaskAssignments(subtask.id);
                            setAssignSubtaskDialogOpen(true);
                          }}
                          title="Assign user"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedSubtask(subtask);
                            setEditSubtaskDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedSubtask(subtask);
                        setProgressData({
                          progress_percentage: subtask.progress_percentage || 0,
                          status: subtask.status || "Not Started",
                        });
                        setUpdateProgressDialogOpen(true);
                      }}
                      title="Update progress"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {subtask.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Progress
                    </span>
                    <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {subtask.progress_percentage || 0}%
                    </span>
                  </div>
                  <Progress value={subtask.progress_percentage || 0} className="h-2" />
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {new Date(subtask.start_date).toLocaleDateString()} -{" "}
                      {new Date(subtask.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Subtask Dialog */}
      {selectedSubtask && editSubtaskDialogOpen && (
        <Dialog open={editSubtaskDialogOpen} onOpenChange={setEditSubtaskDialogOpen}>
          <DialogContent className={theme === 'dark' ? 'bg-slate-800 text-white' : ''}>
            <DialogHeader>
              <DialogTitle>Edit Subtask</DialogTitle>
              <DialogDescription>Update subtask details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateSubtask} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={selectedSubtask.title}
                  onChange={(e) =>
                    setSelectedSubtask({ ...selectedSubtask, title: e.target.value })
                  }
                  required
                  className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedSubtask.description}
                  onChange={(e) =>
                    setSelectedSubtask({
                      ...selectedSubtask,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start">Start Date</Label>
                  <Input
                    id="edit-start"
                    type="date"
                    value={selectedSubtask.start_date}
                    onChange={(e) =>
                      setSelectedSubtask({
                        ...selectedSubtask,
                        start_date: e.target.value,
                      })
                    }
                    required
                    className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-due">Due Date</Label>
                  <Input
                    id="edit-due"
                    type="date"
                    value={selectedSubtask.due_date}
                    onChange={(e) =>
                      setSelectedSubtask({
                        ...selectedSubtask,
                        due_date: e.target.value,
                      })
                    }
                    required
                    className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditSubtaskDialogOpen(false);
                    setSelectedSubtask(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[#0f5841] to-[#194f87]">
                  Update Subtask
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Subtask Dialog */}
      {selectedSubtask && assignSubtaskDialogOpen && (
        <Dialog open={assignSubtaskDialogOpen} onOpenChange={setAssignSubtaskDialogOpen}>
          <DialogContent className={theme === 'dark' ? 'bg-slate-800 text-white' : ''}>
            <DialogHeader>
              <DialogTitle>Assign User to Subtask</DialogTitle>
              <DialogDescription>Select a user to assign to this subtask</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAssignSubtask} className="space-y-4">
              <div>
                <Label htmlFor="assign-user">Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.full_name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAssignSubtaskDialogOpen(false);
                    setSelectedUserId("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#0f5841] to-[#194f87]"
                  disabled={!selectedUserId}
                >
                  Assign User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Update Progress Dialog */}
      {selectedSubtask && updateProgressDialogOpen && (
        <Dialog open={updateProgressDialogOpen} onOpenChange={setUpdateProgressDialogOpen}>
          <DialogContent className={theme === 'dark' ? 'bg-slate-800 text-white' : ''}>
            <DialogHeader>
              <DialogTitle>Update Subtask Progress</DialogTitle>
              <DialogDescription>
                Update the progress and status of this subtask
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateProgress} className="space-y-4">
              <div>
                <Label htmlFor="progress">Progress Percentage</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={progressData.progress_percentage}
                  onChange={(e) =>
                    setProgressData({
                      ...progressData,
                      progress_percentage: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                  className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={progressData.status}
                  onValueChange={(value) =>
                    setProgressData({ ...progressData, status: value })
                  }
                >
                  <SelectTrigger className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUpdateProgressDialogOpen(false);
                    setSelectedSubtask(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[#0f5841] to-[#194f87]">
                  Update Progress
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
