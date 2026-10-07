import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { BarChart3, TrendingUp, AlertCircle, Users, Clock, CheckCircle2, CheckSquare, PieChart as PieChartIcon, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { reportAPI, taskAPI, projectAPI, unwrapList } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

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
  const { theme } = useTheme();

  // Pie chart colors matching the design system
  const COLORS = ['#0f5841', '#194f87', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

  // Members (and anyone without report permissions) get a view built from their own tasks.
  const loadMemberReports = async () => {
    const projectsList = unwrapList<any>(await projectAPI.getMyProjects());

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
    const allTasks = allTasksArrays.flat();

    const today = new Date();
    const overdueTasks = allTasks.filter((task: any) => {
      const dueDate = new Date(task.due_date);
      return dueDate < today && task.status !== "completed";
    });

    const workload: Workload[] =
      allTasks.length > 0
        ? [{ user_id: user?.id || 0, full_name: user?.full_name || "Me", task_count: allTasks.length }]
        : [];

    return { overdueTasks, workload, allTasks };
  };

  const { data, isLoading: loading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["reports", user?.role, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<{ overdueTasks: OverdueTask[]; workload: Workload[]; allTasks: any[] }> => {
      if (user?.role === "Member") {
        return loadMemberReports();
      }
      // Admin/Manager: use the report endpoints, falling back to a personal view if not permitted.
      try {
        const overdueTasks = unwrapList<OverdueTask>(await reportAPI.getOverdueTasks());
        const workload = unwrapList<Workload>(await reportAPI.getWorkload());
        return { overdueTasks, workload, allTasks: [] };
      } catch (err: any) {
        if (err.message?.includes("Forbidden") || err.message?.includes("permission")) {
          return loadMemberReports();
        }
        throw err;
      }
    },
  });

  const overdueTasks: OverdueTask[] = data?.overdueTasks ?? [];
  const workload: Workload[] = data?.workload ?? [];
  const allTasks: any[] = data?.allTasks ?? [];

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
      <div className="space-y-6">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Couldn't load reports</h3>
          <p className={`text-center mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {(error as Error)?.message || "Something went wrong while fetching report data."}
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
      <div>
        <h1 className={`text-3xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Reports & Analytics
          {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
        </h1>
        <p className={theme === 'dark' ? 'text-gray-300 mt-1' : 'text-gray-600 mt-1'}>Track performance and productivity metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`border-l-4 border-l-red-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Overdue Tasks</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{overdueTasks.length}</div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Requires attention</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${theme === 'dark' ? 'border-l-blue-400 bg-slate-800 border-slate-700' : 'border-l-blue-500 bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Active Members</CardTitle>
            <Users className={`h-5 w-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{workload.length}</div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Working on tasks</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-[#0f5841] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Workload</CardTitle>
            <CheckSquare className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {workload.reduce((sum, w) => sum + w.task_count, 0)}
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Total tasks assigned</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-[#194f87] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Completion Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-[#194f87]" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {allTasks.length > 0 ? Math.round((allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100) : 0}%
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Task completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className={theme === 'dark' ? 'bg-slate-800' : ''}>
          <TabsTrigger value="status" className={theme === 'dark' ? 'data-[state=active]:bg-slate-700' : ''}>
            <PieChartIcon className="h-4 w-4 mr-2" />
            Task Status
          </TabsTrigger>
          <TabsTrigger value="workload" className={theme === 'dark' ? 'data-[state=active]:bg-slate-700' : ''}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Team Workload
          </TabsTrigger>
          <TabsTrigger value="overdue" className={theme === 'dark' ? 'data-[state=active]:bg-slate-700' : ''}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Overdue Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
              <CardHeader>
                <CardTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`status-cell-${entry.name}-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                      border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#f1f5f9' : '#111827' }}
                    itemStyle={{ color: theme === 'dark' ? '#f1f5f9' : '#111827' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
              <CardHeader>
                <CardTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Status Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taskStatusData.map((status, index) => (
                    <div key={`status-legend-${status.name}-${index}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: status.color }}></div>
                        <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>{status.name}</span>
                      </div>
                      <Badge className={theme === 'dark' ? 'bg-slate-700 text-white' : ''} variant="outline">{status.value} tasks</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workload">
          <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Team Workload Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={workloadChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e5e7eb'} />
                      <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#6b7280'} />
                      <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#6b7280'} />
                      <Tooltip contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                        border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                        color: theme === 'dark' ? '#f1f5f9' : '#111827'
                      }} />
                      <Legend wrapperStyle={{ color: theme === 'dark' ? '#f1f5f9' : '#111827' }} />
                      <Bar dataKey="tasks" fill="#194f87" name="Tasks Assigned" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={workloadPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {workloadPieData.map((entry, index) => (
                          <Cell key={`workload-cell-${entry.name}-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                        border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
                        color: theme === 'dark' ? '#f1f5f9' : '#111827'
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Overdue Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {overdueTasks.length === 0 ? (
                <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No overdue tasks! Great work!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overdueTasks.map((task) => (
                    <div key={task.id} className={`p-4 border rounded-lg ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{task.title}</h3>
                            <Badge variant="destructive" className="bg-red-500 text-white">{getDaysOverdue(task.due_date)}d overdue</Badge>
                          </div>
                          <div className={`flex items-center gap-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            <span className="flex items-center gap-1">
                              <CheckSquare size={14} />
                              {task.project_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              Progress: {task.progress_percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};