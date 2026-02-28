import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { BarChart3, TrendingUp, AlertCircle, Users, Clock, CheckCircle2, CheckSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { reportAPI, taskAPI, projectAPI } from "../utils/api";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

interface OverdueTask {
  id: number;
  title: string;
  status: string;
  due_date: string;
  progress_percentage: number;
  project_name: string;
}

interface Workload {
  user_id: number;
  full_name: string;
  task_count: number;
}

export const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [workload, setWorkload] = useState<Workload[]>([]);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setPermissionError(false);
      
      // Check if user has permission (Admin or Manager only)
      if (user?.role === "Member") {
        console.log("Member role detected - generating personal reports instead");
        // For members, generate reports from their own tasks
        await fetchMemberReports();
        return;
      }
      
      // For Admin/Manager - use backend report endpoints
      try {
        // Fetch overdue tasks
        const overdueResponse = await reportAPI.getOverdueTasks();
        console.log("Overdue tasks response:", overdueResponse);
        
        if (overdueResponse.success && overdueResponse.data) {
          setOverdueTasks(overdueResponse.data);
        } else if (Array.isArray(overdueResponse)) {
          setOverdueTasks(overdueResponse);
        }

        // Fetch workload data
        const workloadResponse = await reportAPI.getWorkload();
        console.log("Workload response:", workloadResponse);
        
        if (workloadResponse.success && workloadResponse.data) {
          setWorkload(workloadResponse.data);
        } else if (Array.isArray(workloadResponse)) {
          setWorkload(workloadResponse);
        }
      } catch (error: any) {
        // If forbidden, fall back to member reports
        if (error.message?.includes("Forbidden") || error.message?.includes("permission")) {
          console.log("Permission denied - falling back to member reports");
          await fetchMemberReports();
        } else {
          throw error;
        }
      }
      
    } catch (error: any) {
      console.error("Failed to fetch reports:", error);
      if (error.message?.includes("Forbidden") || error.message?.includes("permission")) {
        setPermissionError(true);
      } else {
        toast.error(error.message || "Failed to load report data");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMemberReports = async () => {
    try {
      console.log("Fetching member personal reports...");
      
      // Get all projects
      const projectsResponse = await projectAPI.getMyProjects();
      
      let projectsList = [];
      if (projectsResponse && projectsResponse.success && projectsResponse.data) {
        projectsList = projectsResponse.data;
      } else if (Array.isArray(projectsResponse)) {
        projectsList = projectsResponse;
      }
      
      // Fetch tasks for each project
      const allTasksPromises = projectsList.map(async (project: any) => {
        try {
          const response = await taskAPI.getTasksByProject(project.id);
          
          let projectTasks = [];
          if (Array.isArray(response)) {
            projectTasks = response;
          } else if (response.data && Array.isArray(response.data)) {
            projectTasks = response.data;
          }
          
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
      
      console.log("Total tasks for member reports:", allTasks.length);
      
      // Filter overdue tasks
      const today = new Date();
      const overdue = allTasks.filter((task: any) => {
        const dueDate = new Date(task.due_date);
        return dueDate < today && task.status !== "completed";
      });
      
      setOverdueTasks(overdue);
      
      // Create workload data (just for current user)
      if (allTasks.length > 0) {
        setWorkload([{
          user_id: user?.id || 0,
          full_name: user?.full_name || "Me",
          task_count: allTasks.length
        }]);
      }
      
    } catch (error: any) {
      console.error("Failed to fetch member reports:", error);
      toast.error("Failed to load your reports");
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - due.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const workloadChartData = workload.map(w => ({
    name: w.full_name,
    tasks: w.task_count
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Track performance and productivity metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue Tasks</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{overdueTasks.length}</div>
            <p className="text-xs text-gray-500 mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Members</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{workload.length}</div>
            <p className="text-xs text-gray-500 mt-1">Working on tasks</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#0f5841]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Workload</CardTitle>
            <CheckSquare className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {workload.reduce((sum, w) => sum + w.task_count, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active tasks assigned</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#194f87]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Team Members</CardTitle>
            <Users className="h-5 w-5 text-[#194f87]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{workload.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total team members</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="overdue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="overdue">Overdue Tasks</TabsTrigger>
          <TabsTrigger value="workload">Team Workload</TabsTrigger>
        </TabsList>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Overdue Tasks Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
                  <p>No overdue tasks! Great work!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Task</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Project</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Progress</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Due Date</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Days Overdue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueTasks.map((task) => (
                        <tr key={task.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-900">{task.title}</td>
                          <td className="p-3 text-gray-600">{task.project_name}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${task.progress_percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">{task.progress_percentage}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-gray-600">
                            {new Date(task.due_date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <Badge variant="destructive" className="bg-red-500">
                              {getDaysOverdue(task.due_date)} days
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#194f87]" />
                Team Workload Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workload.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No workload data available</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={workloadChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="tasks" fill="#194f87" name="Active Tasks" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Detailed Workload</h4>
                    <div className="space-y-2">
                      {workload.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0f5841] to-[#194f87] flex items-center justify-center text-white font-semibold">
                              {member.full_name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">{member.full_name}</span>
                          </div>
                          <Badge className="bg-[#194f87]">
                            {member.task_count} {member.task_count === 1 ? 'task' : 'tasks'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};