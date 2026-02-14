import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CheckSquare, Plus, Calendar, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Tasks = () => {

    const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Design homepage mockup",
      description: "Create initial design for new homepage",
      project: "Website Redesign",
      status: "in_progress",
      progress_percentage: 60,
      due_date: "2026-02-20",
      priority: "high",
      assignee: "John Doe"
    },
    {
      id: 2,
      title: "Implement authentication flow",
      description: "Set up user login and registration",
      project: "Mobile App",
      status: "in_progress",
      progress_percentage: 30,
      due_date: "2026-02-18",
      priority: "high",
      assignee: "Jane Smith"
    },
    {
      id: 3,
      title: "Write API documentation",
      description: "Document all REST endpoints",
      project: "API Integration",
      status: "not_started",
      progress_percentage: 0,
      due_date: "2026-02-25",
      priority: "medium",
      assignee: "Mike Johnson"
    },
    {
      id: 4,
      title: "Code review",
      description: "Review and provide feedback",
      project: "Website Redesign",
      status: "completed",
      progress_percentage: 100,
      due_date: "2026-02-12",
      priority: "low",
      assignee: "Sarah Williams"
    },
  ]);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    project_id: "1",
    due_date: "",
    priority: "medium",
  });

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const task = {
      id: Date.now(),
      ...newTask,
      project: "Website Redesign",
      status: "not_started",
      progress_percentage: 0,
      assignee: "Unassigned",
    };

    setTasks([...tasks, task]);
    toast.success("Task created successfully!");
    setNewTask({ title: "", description: "", project_id: "1", due_date: "", priority: "medium" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "not_started":
        return "bg-gray-400";
      default:
        return "bg-gray-500";
    }
  };

    const renderTaskCard = (task: any) => (
    <Card key={task.id} className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{task.title}</h3>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              <AlertCircle size={14} className="mr-1" />
              {task.priority.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-gray-600">
              <CheckSquare size={14} className="mr-1" />
              {task.project}
            </Badge>
            <Badge variant="outline" className="text-gray-600">
              <User size={14} className="mr-1" />
              {task.assignee}
            </Badge>
            <Badge variant="outline" className="text-gray-600">
              <Calendar size={14} className="mr-1" />
              {new Date(task.due_date).toLocaleDateString()}
            </Badge>
          </div>

          <div className="pt-3 border-t flex items-center justify-between">
            <span className="text-sm text-gray-600">Progress: {task.progress_percentage}%</span>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

    return(
        <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage and track all tasks</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={newTask.project_id} onValueChange={(value) => setNewTask({ ...newTask, project_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Website Redesign</SelectItem>
                    <SelectItem value="2">Mobile App</SelectItem>
                    <SelectItem value="3">API Integration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleCreateTask}
                className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white"
              >
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="not_started">Not Started</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterTasks("all").map(renderTaskCard)}
          </div>
        </TabsContent>
        <TabsContent value="not_started" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterTasks("not_started").map(renderTaskCard)}
          </div>
        </TabsContent>
        <TabsContent value="in_progress" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterTasks("in_progress").map(renderTaskCard)}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterTasks("completed").map(renderTaskCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
    );

};