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
  CheckCircle2
} from "lucide-react";
import { Slider } from "../components/ui/slider";
import { toast } from "sonner";

interface Task {
  id: number;
  title: string;
  description: string;
  project: string;
  status: string;
  progress_percentage: number;
  due_date: string;
  priority: string;
}

export const MemberDashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    myTasks: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  useEffect(() => {
    // Mock data
    const mockTasks: Task[] = [
      {
        id: 1,
        title: "Design homepage mockup",
        description: "Create initial design for new homepage",
        project: "Website Redesign",
        status: "in_progress",
        progress_percentage: 60,
        due_date: "2026-02-20",
        priority: "high"
      },
      {
        id: 2,
        title: "Implement authentication flow",
        description: "Set up user login and registration",
        project: "Mobile App Development",
        status: "in_progress",
        progress_percentage: 30,
        due_date: "2026-02-18",
        priority: "high"
      },
      {
        id: 3,
        title: "Write API documentation",
        description: "Document all REST endpoints",
        project: "API Integration",
        status: "not_started",
        progress_percentage: 0,
        due_date: "2026-02-25",
        priority: "medium"
      },
      {
        id: 4,
        title: "Code review for pull request",
        description: "Review and provide feedback on PR #234",
        project: "Website Redesign",
        status: "not_started",
        progress_percentage: 0,
        due_date: "2026-02-16",
        priority: "low"
      },
      {
        id: 5,
        title: "Fix responsive layout issues",
        description: "Address mobile layout problems",
        project: "Website Redesign",
        status: "completed",
        progress_percentage: 100,
        due_date: "2026-02-12",
        priority: "medium"
      },
    ];

    setTasks(mockTasks);
    setStats({
      myTasks: mockTasks.length,
      inProgress: mockTasks.filter(t => t.status === "in_progress").length,
      completed: mockTasks.filter(t => t.status === "completed").length,
      overdue: mockTasks.filter(t => new Date(t.due_date) < new Date() && t.status !== "completed").length,
    });
  }, []);


  return(

    <div className="space-y-6">

        {/* Header */}
      <div className="bg-gradient-to-r from-[#0f5841] via-[#194f87] to-[#0f5841] rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
        <p className="text-white/90">Track your tasks and update your progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#0f5841]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Tasks</CardTitle>
            <CheckSquare className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.myTasks}</div>
            <p className="text-xs text-gray-500 mt-1">Assigned to me</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#194f87]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            <Clock className="h-5 w-5 text-[#194f87]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.inProgress}</div>
            <p className="text-xs text-gray-500 mt-1">Currently working</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
            <p className="text-xs text-gray-500 mt-1">This week</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.overdue}</div>
            <p className="text-xs text-gray-500 mt-1">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* My Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                  isOverdue(task.due_date, task.status) ? "border-red-300 bg-red-50/30" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{task.title}</h3>
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority.toUpperCase()}
                      </Badge>
                      {isOverdue(task.due_date, task.status) && (
                        <Badge variant="destructive" className="bg-red-500">
                          OVERDUE
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Play size={16} />
                        {task.project}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {task.status !== "completed" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">{task.progress_percentage}%</span>
                    </div>
                    <Progress value={task.progress_percentage} className="h-2" />
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Slider
                          value={[task.progress_percentage]}
                          onValueChange={(value) => handleProgressUpdate(task.id, value[0])}
                          max={100}
                          step={5}
                          className="cursor-pointer"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleProgressUpdate(task.id, 100)}
                        className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white"
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

  );

};
