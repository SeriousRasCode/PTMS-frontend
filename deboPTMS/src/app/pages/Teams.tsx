import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { Users, Plus, UserPlus, Calendar, Search, AlertCircle, RefreshCw, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { teamAPI, adminAPI, projectAPI, unwrapList } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface Team {
  id: number;
  name: string;
  created_at: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export const Teams = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [newTeam, setNewTeam] = useState({ name: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Filters live in the URL so they survive refresh and can be shared/bookmarked.
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "default";
  const [searchInput, setSearchInput] = useState(search);

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

  useEffect(() => {
    if (searchInput === search) return;
    const id = setTimeout(() => updateParams({ q: searchInput }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const {
    data: teams = [],
    isLoading: loading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["teams", user?.role],
    enabled: !!user,
    queryFn: async (): Promise<Team[]> => {
      const response =
        user?.role === "Admin"
          ? await teamAPI.getAllTeams()
          : await teamAPI.getMyTeams();
      return unwrapList<Team>(response);
    },
  });

  // Users for the Add Member dialog (Admin only).
  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users"],
    enabled: !!user && user.role === "Admin",
    queryFn: async (): Promise<User[]> => unwrapList<User>(await adminAPI.getAllUsers()),
  });

  // Aggregate stats: active projects + total members across all teams.
  const teamIds = teams.map((t: Team) => t.id).join(",");
  const { data: stats = { activeProjects: 0, teamMembers: 0 } } = useQuery({
    queryKey: ["team-stats", user?.role, teamIds],
    enabled: teams.length > 0,
    queryFn: async () => {
      const projectsResponse =
        user?.role === "Admin"
          ? await projectAPI.getAllProjects()
          : await projectAPI.getMyProjects();
      const projectsList = unwrapList<any>(projectsResponse);
      const activeProjects = projectsList.filter((p: any) => {
        const status = p.status?.toLowerCase().replace("_", " ");
        return status === "active" || status === "in progress";
      }).length;

      const counts = await Promise.all(
        teams.map(async (team: Team) => {
          try {
            return unwrapList(await teamAPI.getTeamMembers(team.id)).length;
          } catch {
            return 0;
          }
        }),
      );
      const teamMembers = counts.reduce((sum: number, c: number) => sum + c, 0);
      return { activeProjects, teamMembers };
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: () => teamAPI.createTeam({ name: newTeam.name }),
    onSuccess: () => {
      toast.success("Team created successfully!");
      setNewTeam({ name: "" });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to create team"),
  });
  const creating = createTeamMutation.isPending;

  const handleCreateTeam = () => {
    if (!newTeam.name.trim()) {
      toast.error("Please enter a team name");
      return;
    }
    if (user?.role !== "Admin") {
      toast.error("Only administrators can create teams");
      return;
    }
    createTeamMutation.mutate();
  };

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      adminAPI.addUserToTeam(teamId, userId),
    onSuccess: () => {
      toast.success("User added to team successfully!");
      setAddMemberDialogOpen(false);
      setSelectedUserId(null);
      setSelectedTeam(null);
      queryClient.invalidateQueries({ queryKey: ["team-stats"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to add user to team"),
  });
  const addingMember = addMemberMutation.isPending;

  const handleAddMember = () => {
    if (!selectedTeam || !selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    addMemberMutation.mutate({ teamId: selectedTeam.id, userId: selectedUserId });
  };

  // Search + sort applied to the team list.
  const searchLower = search.toLowerCase();
  const visibleTeams = teams
    .filter((t: Team) => !searchLower || t.name?.toLowerCase().includes(searchLower))
    .sort((a: Team, b: Team) => {
      switch (sort) {
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "created-desc":
          return (b.created_at || "").localeCompare(a.created_at || "");
        case "created-asc":
          return (a.created_at || "").localeCompare(b.created_at || "");
        default:
          return 0;
      }
    });

  const hasActiveFilters = !!(search || sort !== "default");
  const clearFilters = () => {
    setSearchInput("");
    updateParams({ q: "", sort: "default" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className={theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Couldn't load teams</h3>
          <p className={`text-center mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
            {(error as Error)?.message || "Something went wrong while fetching teams."}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            Teams
            {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
          </h1>
          <p className={`mt-1 text-sm sm:text-base ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Manage your teams and members</p>
        </div>
        {user?.role === "Admin" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className={theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : "bg-white"}>
              <DialogHeader>
                <DialogTitle className={theme === "dark" ? "text-white" : ""}>Create New Team</DialogTitle>
                <DialogDescription className={theme === "dark" ? "text-gray-300" : ""}>
                  Create a new team to organize your project members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="team-name" className={theme === "dark" ? "text-gray-200" : ""}>Team Name</Label>
                  <Input
                    id="team-name"
                    placeholder="Enter team name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateTeam();
                    }}
                    className={theme === "dark" ? "bg-slate-700 border-slate-600 text-white placeholder:text-gray-400" : ""}
                  />
                </div>
                <Button
                  onClick={handleCreateTeam}
                  className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87]"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search + Sort */}
      {teams.length > 0 && (
        <Card className={theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"}>
          <CardContent className="flex flex-wrap items-end gap-4 py-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="team-search" className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="team-search"
                  placeholder="Search teams by name"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`pl-8 ${theme === "dark" ? "bg-slate-700 border-slate-600 text-white" : ""}`}
                />
              </div>
            </div>
            <div className="min-w-[170px]">
              <Label className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Sort by</Label>
              <Select value={sort} onValueChange={(value) => updateParams({ sort: value })}>
                <SelectTrigger className={theme === "dark" ? "bg-slate-700 border-slate-600 text-white" : ""}>
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent className={theme === "dark" ? "bg-slate-700 border-slate-600" : ""}>
                  <SelectItem value="default" className={theme === "dark" ? "text-white" : ""}>Default</SelectItem>
                  <SelectItem value="name-asc" className={theme === "dark" ? "text-white" : ""}>Name (A → Z)</SelectItem>
                  <SelectItem value="name-desc" className={theme === "dark" ? "text-white" : ""}>Name (Z → A)</SelectItem>
                  <SelectItem value="created-desc" className={theme === "dark" ? "text-white" : ""}>Newest first</SelectItem>
                  <SelectItem value="created-asc" className={theme === "dark" ? "text-white" : ""}>Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className={theme === "dark" ? "border-slate-600 text-gray-200 hover:bg-slate-700" : ""}
              >
                Clear
              </Button>
            )}
            {hasActiveFilters && (
              <span className={`text-sm ml-auto ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                Showing {visibleTeams.length} of {teams.length} teams
              </span>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className={`border-l-4 border-l-[#0f5841] ${theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Total Teams</CardTitle>
            <Users className="h-5 w-5 text-[#0f5841]" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{teams.length}</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${theme === "dark" ? "border-l-blue-400 bg-slate-800 border-slate-700" : "border-l-blue-500 bg-white"}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Active Projects</CardTitle>
            <FolderKanban className={`h-5 w-5 ${theme === "dark" ? "text-blue-400" : "text-blue-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{stats.activeProjects}</div>
            <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Across all teams</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-[#194f87] ${theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Team Members</CardTitle>
            <UserPlus className="h-5 w-5 text-[#194f87]" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{stats.teamMembers}</div>
            <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Total members</p>
          </CardContent>
        </Card>
      </div>

      {/* Teams List */}
      {visibleTeams.length === 0 ? (
        <Card className={theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"}>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <Users className={`h-12 w-12 sm:h-16 sm:w-16 mb-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
            {teams.length > 0 ? (
              <>
                <h3 className={`text-base sm:text-lg font-semibold mb-2 text-center ${theme === "dark" ? "text-white" : "text-gray-900"}`}>No teams match your search</h3>
                <p className={`text-sm sm:text-base text-center mb-4 max-w-md ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Try a different name or clear the filters
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className={theme === "dark" ? "border-slate-600 text-gray-200 hover:bg-slate-700" : ""}
                >
                  Clear filters
                </Button>
              </>
            ) : (
              <>
                <h3 className={`text-base sm:text-lg font-semibold mb-2 text-center ${theme === "dark" ? "text-white" : "text-gray-900"}`}>No teams yet</h3>
                <p className={`text-sm sm:text-base text-center mb-4 max-w-md ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  {user?.role === "Admin"
                    ? "Create your first team to start collaborating with others"
                    : "You are not a member of any teams yet"}
                </p>
                {user?.role === "Admin" && (
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="bg-gradient-to-r from-[#0f5841] to-[#194f87] w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Team
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {visibleTeams.map((team: Team) => (
            <Card key={team.id} className={`hover:shadow-lg transition-shadow ${theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 text-base sm:text-lg ${theme === "dark" ? "text-white" : ""}`}>
                  <div className="p-2 bg-gradient-to-br from-[#0f5841] to-[#194f87] rounded-lg">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <span className="break-words">{team.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex items-center gap-2 text-xs sm:text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
                </div>

                {user?.role === "Admin" && (
                  <div className={`pt-3 border-t ${theme === "dark" ? "border-slate-700" : "border-gray-200"}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`w-full ${theme === "dark" ? "border-slate-600 text-gray-200 hover:bg-slate-700" : ""}`}
                      onClick={() => {
                        setSelectedTeam(team);
                        setAddMemberDialogOpen(true);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Members
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={(open) => {
        setAddMemberDialogOpen(open);
        if (!open) {
          setSelectedUserId(null);
          setSelectedTeam(null);
        }
      }}>
        <DialogContent className={theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : "bg-white"}>
          <DialogHeader>
            <DialogTitle className={theme === "dark" ? "text-white" : ""}>Add Member to Team</DialogTitle>
            <DialogDescription className={theme === "dark" ? "text-gray-300" : ""}>
              Add a new member to the selected team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="member-team-name" className={theme === "dark" ? "text-gray-200" : ""}>Team</Label>
              <Input
                id="member-team-name"
                value={selectedTeam?.name || ""}
                readOnly
                className={theme === "dark" ? "bg-slate-700 border-slate-600 text-gray-300" : "bg-gray-50"}
              />
            </div>
            <div>
              <Label htmlFor="user-select" className={theme === "dark" ? "text-gray-200" : ""}>Select User</Label>
              <select
                id="user-select"
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  theme === "dark"
                    ? "bg-slate-700 border-slate-600 text-white focus:ring-[#194f87]"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              >
                <option value="">Select a user</option>
                {allUsers.map((u: User) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email}) - {u.role}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleAddMember}
              className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87]"
              disabled={addingMember || !selectedUserId}
            >
              {addingMember ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
