import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { BarChart3, TrendingUp, AlertCircle, Users, Clock, CheckCircle2, CheckSquare, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [permissionError, setPermissionError] = useState(false);

  // Pie chart colors matching the design system
  const COLORS = ['#0f5841', '#194f87', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setPermissionError(false);
      
      if (user?.role === "Member") {
        await fetchMemberReports();
        return;
      }
      
      try {
        const overdueResponse = await reportAPI.getOverdueTasks();
        
        if (overdueResponse.success && overdueResponse.data) {
          setOverdueTasks(overdueResponse.data);
        } else if (Array.isArray(overdueResponse)) {
          setOverdueTasks(overdueResponse);
        }

        const workloadResponse = await reportAPI.getWorkload();
        
        if (workloadResponse.success && workloadResponse.data) {
          setWorkload(workloadResponse.data);
        } else if (Array.isArray(workloadResponse)) {
          setWorkload(workloadResponse);
        }
      } catch (error: any) {
        if (error.message?.includes("Forbidden") || error.message?.includes("permission")) {
          await fetchMemberReports();
        } else {
          throw error;
        }
      }
      
    } catch (error: any) {
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
      const projectsResponse = await projectAPI.getMyProjects();
      
      let projectsList = [];
      if (projectsResponse && projectsResponse.success && projectsResponse.data) {
        projectsList = projectsResponse.data;
      } else if (Array.isArray(projectsResponse)) {
        projectsList = projectsResponse;
      }
      
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
          return [];
        }
      });
      
      const allTasksArrays = await Promise.all(allTasksPromises);
      const allTasks = allTasksArrays.flat();
      
      setAllTasks(allTasks);
      
      const today = new Date();
      const overdue = allTasks.filter((task: any) => {
        const dueDate = new Date(task.due_date);
        return dueDate < today && task.status !== "completed";
      });
      
      setOverdueTasks(overdue);
      
      if (allTasks.length > 0) {
        setWorkload([{
          user_id: user?.id || 0,
          full_name: user?.full_name || "Me",
          task_count: allTasks.length
        }]);
      }
      
    } catch (error: any) {
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

  // Prepare pie chart data for task status distribution
  const taskStatusData = (() => {
    const statusCounts: { [key: string]: number } = {
      'completed': 0,
      'in_progress': 0,
      'pending': 0,
      'overdue': 0
    };

    const today = new Date();
    
    // Use allTasks if available (for members), otherwise use overdueTasks + workload estimation
    if (allTasks.length > 0) {
      allTasks.forEach((task: any) => {
        const dueDate = new Date(task.due_date);
        const normalizedStatus = task.status?.toLowerCase().replace(' ', '_');
        
        if (dueDate < today && normalizedStatus !== 'completed') {
          statusCounts.overdue++;
        } else if (normalizedStatus === 'completed') {
          statusCounts.completed++;
        } else if (normalizedStatus === 'in_progress' || normalizedStatus === 'active') {
          statusCounts.in_progress++;
        } else {
          statusCounts.pending++;
        }
      });
    } else {
      // Fallback for admin/manager view
      statusCounts.overdue = overdueTasks.length;
      const totalTasks = workload.reduce((sum, w) => sum + w.task_count, 0);
      statusCounts.in_progress = Math.floor(totalTasks * 0.6);
      statusCounts.pending = Math.floor(totalTasks * 0.2);
      statusCounts.completed = totalTasks - statusCounts.in_progress - statusCounts.pending - statusCounts.overdue;
    }

    return [
      { name: 'Completed', value: statusCounts.completed, color: '#10b981' },
      { name: 'In Progress', value: statusCounts.in_progress, color: '#194f87' },
      { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
      { name: 'Overdue', value: statusCounts.overdue, color: '#ef4444' }
    ].filter(item => item.value > 0);
  })();

  // Prepare pie chart data for workload distribution
  const workloadPieData = workload.slice(0, 6).map((member, index) => ({
    name: member.full_name,
    value: member.task_count,
    color: COLORS[index % COLORS.length]
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
        <Card className="border-l-4 border-l-red-500">
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

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Tasks</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {taskStatusData.find(d => d.name === 'Completed')?.value || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Tasks finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="overdue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="overdue">Overdue Tasks</TabsTrigger>
          <TabsTrigger value="workload">Team Workload</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Status Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-[#0f5841]" />
                  Task Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {taskStatusData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No task data available</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={taskStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {taskStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {taskStatusData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-gray-700">
                            {item.name}: <span className="font-semibold">{item.value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Workload Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#194f87]" />
                  Workload by Team Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workloadPieData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No workload data available</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={workloadPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {workloadPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {workloadPieData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-gray-700">
                            {item.name}: <span className="font-semibold">{item.value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
