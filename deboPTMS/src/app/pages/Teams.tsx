import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Users, Plus, Mail, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

export const Teams = () => {
  const [teams, setTeams] = useState([
    {
      id: 1,
      name: "Development Team",
      members: [
        { id: 1, name: "John Doe", email: "john@example.com", role: "Manager" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Developer" },
        { id: 3, name: "Mike Johnson", email: "mike@example.com", role: "Developer" },
      ]
    },
    {
      id: 2,
      name: "Design Team",
      members: [
        { id: 4, name: "Sarah Williams", email: "sarah@example.com", role: "Lead Designer" },
        { id: 5, name: "Tom Brown", email: "tom@example.com", role: "UI Designer" },
      ]
    },
    {
      id: 3,
      name: "Marketing Team",
      members: [
        { id: 6, name: "Lisa Davis", email: "lisa@example.com", role: "Marketing Manager" },
        { id: 7, name: "Chris Wilson", email: "chris@example.com", role: "Content Writer" },
        { id: 8, name: "Emma Taylor", email: "emma@example.com", role: "Social Media Manager" },
      ]
    },
  ]);

  const [newTeam, setNewTeam] = useState({ name: "" });

  const handleCreateTeam = () => {
    if (!newTeam.name) {
      toast.error("Please enter a team name");
      return;
    }

    const team = {
      id: Date.now(),
      name: newTeam.name,
      members: [],
    };

    setTeams([...teams, team]);
    toast.success("Team created successfully!");
    setNewTeam({ name: "" });
  };

  const getInitials = (name: string) => {
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

  return();

};