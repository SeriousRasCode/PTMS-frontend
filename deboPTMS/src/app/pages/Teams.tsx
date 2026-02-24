import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Users, Plus, Mail, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

// Define the shape of our data
interface Member {
  id: number;
  full_name: string; // Adjusted to match typical DB naming
  email: string;
  role: string;
}

interface Team {
  id: number;
  name: string;
  members: Member[];
}

export const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "" });

  // --- FETCH TEAMS ---

 const fetchTeams = async () => {
  try {
    setLoading(true);
    // Adjusted URL: Ensure this matches your router.get path exactly
    const response = await fetch("/api/my-teams", { 
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
      },
    });

    const result = await response.json();

    // Check response.ok in case result.success is missing
    if (response.ok && (result.success || result.data)) { 
      const rawData = result.data || result; // Handle different JSON structures
      
      const teamsWithMembers = rawData.map((t: any) => ({
        ...t,
        // Since backend findTeamsByUserId doesn't return members yet, 
        // we provide a mock empty array so the UI doesn't crash on .map()
        members: t.members || [] 
      }));
      
      setTeams(teamsWithMembers);
    } else {
      toast.error(result.message || "Failed to load teams");
    }
  } catch (err) {
    console.error("Fetch teams error:", err);
    toast.error("Server connection failed");
  } finally {
    setLoading(false);
  }
};

  // --- CREATE TEAM ---
  const handleCreateTeam = async () => {
    if (!newTeam.name) {
      toast.error("Please enter a team name");
      return;
    }

    try {
      const response = await fetch("/api/teams/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(newTeam),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Team created successfully!");
        setIsDialogOpen(false);
        setNewTeam({ name: "" });
        fetchTeams(); // Refresh list
      } else {
        toast.error(result.message || "Failed to create team");
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  // --- UTILS ---
  const getInitials = (name: string = "User") => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (id: number) => {
    const colors = [
      "from-[#0f5841] to-[#194f87]",
      "from-[#194f87] to-[#0f5841]",
      "from-purple-500 to-pink-500",
      "from-orange-500 to-red-500",
      "from-green-500 to-teal-500",
    ];
    return colors[id % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-1">Manage your teams and team members</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>Enter the team name to create a new team.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="Enter team name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ name: e.target.value })}
                />
              </div>
              <Button
                onClick={handleCreateTeam}
                className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white"
              >
                Create Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-[#0f5841]/5 to-[#194f87]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#0f5841] to-[#194f87] rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{team.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <UserPlus size={16} className="mr-2" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {team.members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={48} className="mx-auto mb-2 opacity-30" />
                    <p>No members yet</p>
                  </div>
                ) : (
                  team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`bg-gradient-to-br ${getAvatarColor(member.id)} text-white font-semibold`}>
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{member.full_name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail size={12} />
                            {member.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          {member.role}
                        </span>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <UserMinus size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};