import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Clock,
  Plus,
  Calendar,
  TrendingUp
} from "lucide-react";


interface Project {
  id: number;
  name: string;
  status: string;
  progress: number;
  tasks: number;
  completedTasks: number;
  team_size: number;
  deadline: string;
}