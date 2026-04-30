import { useState, useEffect } from "react";
import { toast } from "sonner";
import { phaseAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus, Edit2, Trash2, Calendar, Paperclip } from "lucide-react";
import { AttachmentManager } from "./AttachmentManager";

interface Phase {
  id: number;
  project_id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  phase_order: number;
  created_at: string;
}

interface ProjectPhasesProps {
  projectId: number;
}

export const ProjectPhases = ({ projectId }: ProjectPhasesProps) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [createPhaseDialogOpen, setCreatePhaseDialogOpen] = useState(false);
  const [editPhaseDialogOpen, setEditPhaseDialogOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [viewAttachmentsPhaseId, setViewAttachmentsPhaseId] = useState<number | null>(null);

  const [newPhase, setNewPhase] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  const isManager = user?.role === "Manager" || user?.role === "Admin";

  useEffect(() => {
    fetchPhases();
  }, [projectId]);

  const fetchPhases = async () => {
    try {
      setLoading(true);
      const data = await phaseAPI.getProjectPhases(projectId);
      console.log("Fetched phases from backend:", data);
      // Log all status values to understand what the backend uses
      if (data && Array.isArray(data)) {
        data.forEach((phase: Phase) => {
          console.log(`Phase "${phase.name}" has status:`, phase.status);
        });
      }
      setPhases(data);
    } catch (error: any) {
      // Only show error if it's not a server error (backend issue)
      if (!error.message?.includes('Server error') && !error.message?.includes('500')) {
        toast.error(error.message || "Failed to fetch phases");
      } else {
        console.error("Phase fetch error (backend issue):", error.message);
      }
      // Set empty array so UI doesn't break
      setPhases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await phaseAPI.createPhase({
        project_id: projectId,
        ...newPhase,
      });
      toast.success("Phase created successfully");
      setNewPhase({ name: "", description: "", start_date: "", end_date: "" });
      setCreatePhaseDialogOpen(false);
      fetchPhases();
    } catch (error: any) {
      toast.error(error.message || "Failed to create phase");
    }
  };

  const handleUpdatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhase) return;

    try {
      // Ensure dates are in YYYY-MM-DD format
      const updateData = {
        name: selectedPhase.name,
        description: selectedPhase.description || "",
        start_date: selectedPhase.start_date.split('T')[0], // Extract date only
        end_date: selectedPhase.end_date.split('T')[0], // Extract date only
        status: selectedPhase.status || "planned",
      };
      
      console.log("Updating phase with data:", updateData);
      
      await phaseAPI.updatePhase(selectedPhase.id, updateData);
      toast.success("Phase updated successfully");
      setEditPhaseDialogOpen(false);
      setSelectedPhase(null);
      fetchPhases();
    } catch (error: any) {
      console.error("Phase update error:", error);
      toast.error(error.message || "Failed to update phase");
    }
  };

  const handleDeletePhase = async (phaseId: number) => {
    if (!window.confirm("Are you sure you want to delete this phase?")) return;

    try {
      await phaseAPI.deletePhase(phaseId);
      toast.success("Phase deleted successfully");
      fetchPhases();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete phase");
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'planned': 'Planned',
      'active': 'Active',
      'completed': 'Completed',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "active":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "planned":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading phases...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Project Phases
        </h3>
        {isManager && (
          <Dialog open={createPhaseDialogOpen} onOpenChange={setCreatePhaseDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#0f5841] to-[#194f87] hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Add Phase
              </Button>
            </DialogTrigger>
            <DialogContent className={theme === 'dark' ? 'bg-slate-800 text-white' : ''}>
              <DialogHeader>
                <DialogTitle>Create New Phase</DialogTitle>
                <DialogDescription>
                  Add a new phase to organize your project timeline
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePhase} className="space-y-4">
                <div>
                  <Label htmlFor="phase-name">Phase Name</Label>
                  <Input
                    id="phase-name"
                    value={newPhase.name}
                    onChange={(e) =>
                      setNewPhase({ ...newPhase, name: e.target.value })
                    }
                    required
                    className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="phase-description">Description</Label>
                  <Textarea
                    id="phase-description"
                    value={newPhase.description}
                    onChange={(e) =>
                      setNewPhase({ ...newPhase, description: e.target.value })
                    }
                    rows={3}
                    className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phase-start">Start Date</Label>
                    <Input
                      id="phase-start"
                      type="date"
                      value={newPhase.start_date}
                      onChange={(e) =>
                        setNewPhase({ ...newPhase, start_date: e.target.value })
                      }
                      required
                      className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phase-end">End Date</Label>
                    <Input
                      id="phase-end"
                      type="date"
                      value={newPhase.end_date}
                      onChange={(e) =>
                        setNewPhase({ ...newPhase, end_date: e.target.value })
                      }
                      required
                      className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreatePhaseDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-[#0f5841] to-[#194f87]">
                    Create Phase
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {phases.length === 0 ? (
        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <CardContent className="text-center py-8">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              No phases added yet. {isManager && "Create one to get started!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {phases.map((phase) => (
            <Card key={phase.id} className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className={`text-base mb-2 ${theme === 'dark' ? 'text-white' : ''}`}>
                      {phase.name}
                    </CardTitle>
                    <Badge className={getStatusColor(phase.status || "planned")}>
                      {getStatusLabel(phase.status || "planned")}
                    </Badge>
                  </div>
                  {isManager && (
                    <div className="flex gap-2">
                      {/* Attachment button hidden - use project-level attachments instead
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setViewAttachmentsPhaseId(phase.id)}
                        title="View attachments"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPhase(phase);
                          setEditPhaseDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePhase(phase.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {phase.description}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {new Date(phase.start_date).toLocaleDateString()} -{" "}
                      {new Date(phase.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Phase Dialog */}
      {selectedPhase && (
        <Dialog open={editPhaseDialogOpen} onOpenChange={setEditPhaseDialogOpen}>
          <DialogContent className={theme === 'dark' ? 'bg-slate-800 text-white' : ''}>
            <DialogHeader>
              <DialogTitle>Edit Phase</DialogTitle>
              <DialogDescription>Update phase details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdatePhase} className="space-y-4">
              <div>
                <Label htmlFor="edit-phase-name">Phase Name</Label>
                <Input
                  id="edit-phase-name"
                  value={selectedPhase.name}
                  onChange={(e) =>
                    setSelectedPhase({ ...selectedPhase, name: e.target.value })
                  }
                  required
                  className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                />
              </div>
              <div>
                <Label htmlFor="edit-phase-description">Description</Label>
                <Textarea
                  id="edit-phase-description"
                  value={selectedPhase.description}
                  onChange={(e) =>
                    setSelectedPhase({
                      ...selectedPhase,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                />
              </div>
              <div>
                <Label htmlFor="edit-phase-status">Status</Label>
                <Select
                  value={selectedPhase.status || "planned"}
                  onValueChange={(value) =>
                    setSelectedPhase({ ...selectedPhase, status: value })
                  }
                >
                  <SelectTrigger className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phase-start">Start Date</Label>
                  <Input
                    id="edit-phase-start"
                    type="date"
                    value={selectedPhase.start_date.split('T')[0]}
                    onChange={(e) =>
                      setSelectedPhase({
                        ...selectedPhase,
                        start_date: e.target.value,
                      })
                    }
                    required
                    className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phase-end">End Date</Label>
                  <Input
                    id="edit-phase-end"
                    type="date"
                    value={selectedPhase.end_date.split('T')[0]}
                    onChange={(e) =>
                      setSelectedPhase({
                        ...selectedPhase,
                        end_date: e.target.value,
                      })
                    }
                    required
                    className={theme === 'dark' ? 'bg-slate-700 text-white border-slate-600' : ''}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditPhaseDialogOpen(false);
                    setSelectedPhase(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[#0f5841] to-[#194f87]">
                  Update Phase
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Phase Attachments Dialog - Hidden, use project-level attachments instead
      {viewAttachmentsPhaseId && (
        <Dialog open={viewAttachmentsPhaseId !== null} onOpenChange={(open) => !open && setViewAttachmentsPhaseId(null)}>
          <DialogContent className={`max-w-4xl ${theme === 'dark' ? 'bg-slate-800 text-white' : ''}`}>
            <DialogHeader>
              <DialogTitle>Phase Attachments</DialogTitle>
              <DialogDescription>
                Manage files and documents for this phase
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <AttachmentManager
                entityId={viewAttachmentsPhaseId}
                entityType="phase"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
      */}
    </div>
  );
};