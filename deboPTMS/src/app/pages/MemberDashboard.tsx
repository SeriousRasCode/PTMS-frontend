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


  return(

    <div className="space-y-6">

        {/* Header */}
      <div className="bg-gradient-to-r from-[#0f5841] via-[#194f87] to-[#0f5841] rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
        <p className="text-white/90">Track your tasks and update your progress</p>
      </div>

  );

};
