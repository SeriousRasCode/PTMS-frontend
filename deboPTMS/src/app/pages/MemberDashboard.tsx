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