import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Skeleton } from "../components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { FolderKanban, Plus, Users, Calendar, ExternalLink, ChevronLeft, ChevronRight, Search, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { projectAPI, teamAPI, unwrapList } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  team_name: string;
  manager_name: string;
  manager_id?: number;
}

interface Team {
  id: number;
  name: string;
}

export const Projects = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const itemsPerPage = 6;

  // Filters live in the URL so they survive refresh and can be shared/bookmarked.
  const dateFrom = searchParams.get("from") || "";
  const dateTo = searchParams.get("to") || "";
  const search = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "default";
  const currentPage = Number(searchParams.get("page")) || 1;

  // Local mirror of the search box so typing is instant; debounced into the URL.
  const [searchInput, setSearchInput] = useState(search);

  // Update one or more URL params at once; values at their default are removed.
  const DEFAULTS: Record<string, string> = { sort: "default" };
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

  // Debounce the search box -> URL (and reset to page 1 on change).
  useEffect(() => {
    if (searchInput === search) return;
    const id = setTimeout(() => {
      updateParams({ q: searchInput, page: "" });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    team_id: "",
  });

  const {
    data: projects = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["projects", user?.role, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Project[]> => {
      const response =
        user?.role === "Admin"
          ? await projectAPI.getAllProjects()
          : await projectAPI.getMyProjects();

      let projectsList = unwrapList<any>(response);

      if (projectsList.length > 0) {
        const hasManagerName = projectsList.some((p: any) => p.manager_name);
        const hasManagerId = projectsList.some((p: any) => p.manager_id);

        if (!hasManagerName && hasManagerId && user?.role === "Manager") {
          projectsList = projectsList.map((project: any) => ({
            ...project,
            manager_name: project.manager_id === user?.id ? user?.full_name : "Unknown Manager",
          }));
        } else if (!hasManagerName && hasManagerId && user?.role === "Member") {
          projectsList = projectsList.map((project: any) => ({
            ...project,
            manager_name: project.manager_name || "Project Manager",
          }));
        }
      }

      return projectsList;
    },
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams", user?.role],
    enabled: !!user,
    queryFn: async (): Promise<Team[]> => {
      let response;

      if (user?.role === "Admin") {
        try {
          response = await teamAPI.getAllTeams();
        } catch (error) {
          response = await teamAPI.getMyTeams();
        }
      } else {
        response = await teamAPI.getMyTeams();
      }

      return unwrapList<Team>(response);
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: () =>
      projectAPI.createProject({
        name: newProject.name,
        description: newProject.description,
        team_id: parseInt(newProject.team_id),
        start_date: newProject.start_date,
        end_date: newProject.end_date,
      }),
    onSuccess: () => {
      toast.success("Project created successfully!");
      setNewProject({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        team_id: "",
      });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create project");
    },
  });
  const creating = createProjectMutation.isPending;

  const handleCreateProject = () => {
    if (!newProject.name || !newProject.description || !newProject.team_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!newProject.start_date || !newProject.end_date) {
      toast.error("Please select start and end dates");
      return;
    }

    createProjectMutation.mutate();
  };

  const handleStatusChange = async (projectId: number, projectData: Project, newStatus: string) => {
    try {
      setUpdatingStatus(projectId);

      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      let statusToSend = newStatus;
      
      const backendStatuses = projects.map((p: Project) => p.status).filter(Boolean);

      if (backendStatuses.length > 0) {
        const hasUnderscores = backendStatuses.some((s: string) => s && s.includes('_'));
        const hasSpaces = backendStatuses.some((s: string) => s && s.includes(' '));
        const isLowercase = backendStatuses.every((s: string) => s && s === s.toLowerCase());
        const isTitleCase = backendStatuses.some((s: string) => s && s[0] === s[0].toUpperCase());
        
        if (hasUnderscores && isLowercase) {
          const map: { [key: string]: string } = {
            'Planned': 'planning',
            'Active': 'in_progress',
            'Completed': 'completed',
            'On Hold': 'on_hold'
          };
          statusToSend = map[newStatus] || newStatus;
        } else if (hasSpaces && isLowercase) {
          const map: { [key: string]: string } = {
            'Planned': 'planning',
            'Active': 'in progress',
            'Completed': 'completed',
            'On Hold': 'on hold'
          };
          statusToSend = map[newStatus] || newStatus;
        } else if (hasSpaces && isTitleCase) {
          const map: { [key: string]: string } = {
            'Planned': 'Planning',
            'Active': 'In Progress',
            'Completed': 'Completed',
            'On Hold': 'On Hold'
          };
          statusToSend = map[newStatus] || newStatus;
        } else if (hasUnderscores && isTitleCase) {
          const map: { [key: string]: string } = {
            'Planned': 'Planning',
            'Active': 'In_Progress',
            'Completed': 'Completed',
            'On Hold': 'On_Hold'
          };
          statusToSend = map[newStatus] || newStatus;
        } else if (isLowercase) {
          const map: { [key: string]: string } = {
            'Planned': 'planning',
            'Active': 'active',
            'Completed': 'completed',
            'On Hold': 'onhold'
          };
          statusToSend = map[newStatus] || newStatus.toLowerCase();
        } else if (isTitleCase) {
          const map: { [key: string]: string } = {
            'Planned': 'Planning',
            'Active': 'Active',
            'Completed': 'Completed',
            'On Hold': 'OnHold'
          };
          statusToSend = map[newStatus] || newStatus;
        }
      }
      
      const updatePayload = {
        name: projectData.name,
        description: projectData.description,
        status: statusToSend,
        start_date: formatDate(projectData.start_date),
        end_date: formatDate(projectData.end_date),
      };
      
      await projectAPI.updateProject(projectId, updatePayload);
      
      toast.success("Project status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });

    } catch (error: any) {
      toast.error(error.message || "Failed to update project status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase().replace('_', ' ');
    switch (normalizedStatus) {
      case "completed":
        return "bg-green-500";
      case "in progress":
      case "active":
        return theme === 'dark' ? "bg-blue-400" : "bg-blue-500";
      case "on hold":
        return "bg-yellow-500";
      case "planned":
      case "planning":
        return theme === 'dark' ? "bg-gray-600" : "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    const normalizedStatus = status?.toLowerCase().replace('_', ' ');
    switch (normalizedStatus) {
      case "completed":
        return "Completed";
      case "in progress":
      case "active":
        return "Active";
      case "on hold":
        return "On Hold";
      case "planned":
      case "planning":
        return "Planning";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
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
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Couldn't load projects</h3>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-center mb-4`}>
            {(error as Error)?.message || "Something went wrong while fetching projects."}
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

  const canCreateProject = user?.role === "Manager" || user?.role === "Admin";

  // Filter by name/description search and start_date range
  // (string compare works for YYYY-MM-DD).
  const searchLower = search.toLowerCase();
  const filteredProjects = projects.filter((project: Project) => {
    const startDate = project.start_date?.slice(0, 10);
    if (dateFrom && (!startDate || startDate < dateFrom)) return false;
    if (dateTo && (!startDate || startDate > dateTo)) return false;
    if (
      searchLower &&
      !project.name?.toLowerCase().includes(searchLower) &&
      !project.description?.toLowerCase().includes(searchLower)
    ) {
      return false;
    }
    return true;
  });

  const indexOfLastProject = currentPage * itemsPerPage;
  const indexOfFirstProject = indexOfLastProject - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const hasActiveFilters = !!(dateFrom || dateTo || search);

  const handleDateFromChange = (value: string) => updateParams({ from: value, page: "" });
  const handleDateToChange = (value: string) => updateParams({ to: value, page: "" });
  const goToPage = (page: number) => updateParams({ page: page > 1 ? String(page) : "" });
  const clearFilters = () => {
    setSearchInput("");
    updateParams({ from: "", to: "", q: "", page: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Projects
            {isFetching && <RefreshCw className={`h-4 w-4 animate-spin ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />}
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Manage and track all your projects</p>
        </div>
        {canCreateProject && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className={`max-w-2xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <DialogHeader>
                <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>Create New Project</DialogTitle>
                <DialogDescription className={theme === 'dark' ? 'text-gray-300' : ''}>
                  Fill in the project details to get started
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name" className={theme === 'dark' ? 'text-gray-200' : ''}>Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter project name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="description" className={theme === 'dark' ? 'text-gray-200' : ''}>Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the project"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                    className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="team" className={theme === 'dark' ? 'text-gray-200' : ''}>Team *</Label>
                  <Select
                    value={newProject.team_id}
                    onValueChange={(value) => setNewProject({ ...newProject, team_id: value })}
                  >
                    <SelectTrigger className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}>
                      {teams.map((team: Team) => (
                        <SelectItem key={team.id} value={team.id.toString()} className={theme === 'dark' ? 'text-white' : ''}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date" className={theme === 'dark' ? 'text-gray-200' : ''}>Start Date *</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={newProject.start_date}
                      onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                      className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className={theme === 'dark' ? 'text-gray-200' : ''}>End Date *</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={newProject.end_date}
                      onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                      className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateProject}
                  className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87]"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search + Date Range Filter */}
      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardContent className="flex flex-wrap items-end gap-4 py-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="filter-search" className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Search</Label>
            <div className="relative">
              <Search className={`absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
              <Input
                id="filter-search"
                placeholder="Search by name or description"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`pl-8 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="filter-from" className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Start date from</Label>
            <Input
              id="filter-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className={theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}
            />
          </div>
          <div>
            <Label htmlFor="filter-to" className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>To</Label>
            <Input
              id="filter-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => handleDateToChange(e.target.value)}
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
              Showing {filteredProjects.length} of {projects.length} projects
            </span>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-l-4 border-l-[#0f5841] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{filteredProjects.length}</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${theme === 'dark' ? 'border-l-blue-400 bg-slate-800 border-slate-700' : 'border-l-blue-500 bg-white'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {filteredProjects.filter((p: Project) => {
                const status = p.status?.toLowerCase().replace('_', ' ');
                return status === "active" || status === "in progress";
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-green-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {filteredProjects.filter((p: Project) => p.status?.toLowerCase() === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-yellow-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>On Hold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {filteredProjects.filter((p: Project) => {
                const status = p.status?.toLowerCase().replace('_', ' ');
                return status === "on hold";
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className={`h-16 w-16 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mb-4`} />
            {projects.length > 0 ? (
              <>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No projects match your filters</h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-center mb-4`}>
                  Try adjusting or clearing the search and date filters
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
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No projects yet</h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-center mb-4`}>
                  {canCreateProject
                    ? "Create your first project to get started"
                    : "No projects available"}
                </p>
                {canCreateProject && (
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="bg-gradient-to-r from-[#0f5841] to-[#194f87]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Project
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentProjects.map((project: Project) => (
              <Card key={project.id} className={`hover:shadow-lg transition-shadow ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3 mb-2">
                        <span className={theme === 'dark' ? 'text-white' : ''}>{project.name}</span>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </CardTitle>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{project.description}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                      className={theme === 'dark' ? 'hover:bg-slate-700' : ''}
                    >
                      <ExternalLink className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`flex items-center gap-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="flex items-center gap-1">
                      <Users size={16} />
                      {project.team_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="font-medium">Manager:</span> {project.manager_name}
                  </div>
                  {(user?.role === "Admin" || (user?.role === "Manager" && project.manager_id === user?.id)) && (
                    <div className="space-y-2">
                      <Label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Change Status</Label>
                      <Select
                        value={(() => {
                          const statusMap: { [key: string]: string } = {
                            'planning': 'Planned',
                            'planned': 'Planned',
                            'in_progress': 'Active',
                            'active': 'Active',
                            'completed': 'Completed',
                            'on_hold': 'On Hold',
                            'on hold': 'On Hold'
                          };
                          const normalizedStatus = project.status?.toLowerCase().replace(' ', '_');
                          return statusMap[normalizedStatus] || project.status;
                        })()}
                        onValueChange={(value) => handleStatusChange(project.id, project, value)}
                        disabled={updatingStatus === project.id}
                      >
                        <SelectTrigger className={`w-full ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}>
                          <SelectItem value="Planned" className={theme === 'dark' ? 'text-white' : ''}>Planning</SelectItem>
                          <SelectItem value="Active" className={theme === 'dark' ? 'text-white' : ''}>Active</SelectItem>
                          <SelectItem value="Completed" className={theme === 'dark' ? 'text-white' : ''}>Completed</SelectItem>
                          <SelectItem value="On Hold" className={theme === 'dark' ? 'text-white' : ''}>On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={theme === 'dark' ? 'border-slate-600 text-gray-200 hover:bg-slate-700' : ''}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={theme === 'dark' ? 'border-slate-600 text-gray-200 hover:bg-slate-700' : ''}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
