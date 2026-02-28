import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Users, Plus, Mail, UserPlus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { teamAPI, adminAPI, projectAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

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
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [activeProjects, setActiveProjects] = useState(0);
  const [teamMembers, setTeamMembers] = useState(0);

  useEffect(() => {
    fetchTeams();
    // Only fetch users if the user is an Admin (for the Add Member feature)
    if (user?.role === "Admin") {
      fetchUsers();
    }
  }, [user?.role]);

  // Fetch stats after teams are loaded
  useEffect(() => {
    if (teams.length > 0) {
      fetchStats();
    }
  }, [teams]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      console.log("Fetching teams...");
      console.log("Current user role:", user?.role);
      
      let response;
      
      // Admin users can fetch all teams
      if (user?.role === "Admin") {
        console.log("User is Admin, fetching all teams...");
        response = await teamAPI.getAllTeams();
        console.log("All teams raw response:", JSON.stringify(response, null, 2));
      } else {
        // Non-admin users get their teams
        console.log("User is not Admin, fetching my teams...");
        response = await teamAPI.getMyTeams();
        console.log("My teams raw response:", JSON.stringify(response, null, 2));
      }
      
      // Handle response - check multiple possible formats
      let teamsData = [];
      
      if (response) {
        // Check if response has data property
        if (response.data) {
          teamsData = Array.isArray(response.data) ? response.data : [];
          console.log("Teams extracted from response.data:", teamsData);
        } 
        // Check if response itself is an array
        else if (Array.isArray(response)) {
          teamsData = response;
          console.log("Teams extracted from response array:", teamsData);
        }
        // Check if response has teams property
        else if (response.teams && Array.isArray(response.teams)) {
          teamsData = response.teams;
          console.log("Teams extracted from response.teams:", teamsData);
        }
      }
      
      console.log("Final teams to set:", teamsData);
      setTeams(teamsData);
      
    } catch (error: any) {
      console.error("Failed to fetch teams:", error);
      toast.error(error.message || "Failed to load teams");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log("=== FETCHING TEAM STATS ===");
      
      // Fetch projects to count active ones
      let projectsResponse;
      if (user?.role === "Admin") {
        projectsResponse = await projectAPI.getAllProjects();
      } else {
        projectsResponse = await projectAPI.getMyProjects();
      }
      
      console.log("Projects response for stats:", projectsResponse);
      
      let projectsList = [];
      if (projectsResponse && projectsResponse.success && projectsResponse.data) {
        projectsList = projectsResponse.data;
      } else if (projectsResponse && Array.isArray(projectsResponse.data)) {
        projectsList = projectsResponse.data;
      } else if (Array.isArray(projectsResponse)) {
        projectsList = projectsResponse;
      }
      
      // Count active projects
      const activeCount = projectsList.filter((p: any) => {
        const status = p.status?.toLowerCase().replace('_', ' ');
        return status === "active" || status === "in progress" || status === "in_progress";
      }).length;
      
      console.log("Active projects count:", activeCount);
      setActiveProjects(activeCount);
      
      // Fetch team members count
      let totalMembers = 0;
      if (teams.length > 0) {
        // For each team, fetch members count
        const memberCounts = await Promise.all(
          teams.map(async (team) => {
            try {
              const membersResponse = await teamAPI.getTeamMembers(team.id);
              console.log(`Team ${team.id} members:`, membersResponse);
              
              let membersList = [];
              if (membersResponse && membersResponse.data) {
                membersList = Array.isArray(membersResponse.data) ? membersResponse.data : [];
              } else if (Array.isArray(membersResponse)) {
                membersList = membersResponse;
              }
              
              return membersList.length;
            } catch (error: any) {
              // Silently handle permission errors - user may not have access to all teams
              if (!error.message?.includes('Forbidden') && !error.message?.includes('permission')) {
                console.error(`Failed to fetch members for team ${team.id}:`, error);
              }
              return 0;
            }
          })
        );
        
        totalMembers = memberCounts.reduce((sum, count) => sum + count, 0);
        console.log("Total team members:", totalMembers);
      }
      
      setTeamMembers(totalMembers);
      
    } catch (error: any) {
      console.error("Failed to fetch team stats:", error);
      // Don't show error toast here, stats are optional
    }
  };

  const fetchUsers = async () => {
    // Only Admins can fetch all users
    if (user?.role !== "Admin") {
      console.log("User is not Admin, skipping fetchUsers");
      return;
    }
    
    try {
      const response = await adminAPI.getAllUsers();
      console.log("All users response:", response);
      
      if (response && response.data) {
        setAllUsers(Array.isArray(response.data) ? response.data : []);
      } else if (Array.isArray(response)) {
        setAllUsers(response);
      }
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      // Don't show error toast here, users list is optional
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    // Only admins can create teams
    if (user?.role !== "Admin") {
      toast.error("Only administrators can create teams");
      return;
    }

    try {
      setCreating(true);
      
      await teamAPI.createTeam({ name: newTeam.name });
      toast.success("Team created successfully!");
      
      setNewTeam({ name: "" });
      setDialogOpen(false);
      
      // Refresh teams list
      fetchTeams();
      
    } catch (error: any) {
      console.error("Failed to create team:", error);
      toast.error(error.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-1">Manage your teams and members</p>
        </div>
        {user?.role === "Admin" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Create a new team to organize your project members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    placeholder="Enter team name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateTeam();
                      }
                    }}
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

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-600 text-center mb-4">
              {user?.role === "Admin" 
                ? "Create your first team to start collaborating with others"
                : "You are not a member of any teams yet"}
            </p>
            {user?.role === "Admin" && (
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-gradient-to-r from-[#0f5841] to-[#194f87]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Team
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-[#0f5841] to-[#194f87] rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span>{team.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
                </div>

                {user?.role === "Admin" && (
                  <div className="pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
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

      {/* Team Stats */}
      {teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-[#0f5841]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{teams.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#194f87]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{activeProjects}</div>
              <p className="text-xs text-gray-500 mt-1">Across all teams</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#0f5841]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{teamMembers}</div>
              <p className="text-xs text-gray-500 mt-1">Total members</p>
            </CardContent>
          </Card>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to Team</DialogTitle>
            <DialogDescription>
              Add a new member to the selected team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="team-name">Team</Label>
              <Input
                id="team-name"
                value={selectedTeam?.name || ""}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="user-select">Select User</Label>
              <select
                id="user-select"
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a user</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email}) - {u.role}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={async () => {
                if (!selectedTeam || !selectedUserId) {
                  toast.error("Please select a user");
                  return;
                }

                try {
                  setAddingMember(true);
                  
                  console.log("Adding user to team:", {
                    teamId: selectedTeam.id,
                    userId: selectedUserId,
                  });
                  
                  await adminAPI.addUserToTeam(selectedTeam.id, selectedUserId);
                  toast.success("User added to team successfully!");
                  
                  setAddMemberDialogOpen(false);
                  setSelectedUserId(null);
                  
                } catch (error: any) {
                  console.error("Failed to add user to team:", error);
                  toast.error(error.message || "Failed to add user to team");
                } finally {
                  setAddingMember(false);
                }
              }}
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