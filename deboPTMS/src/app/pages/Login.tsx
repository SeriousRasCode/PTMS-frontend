import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Login successful!");
      
      // Redirect based on role
      setTimeout(() => {
        const role = email.includes("admin") ? "Admin" : email.includes("manager") ? "Manager" : "Member";
        const dashboardPath = role === "Admin" 
          ? "/dashboard/admin" 
          : role === "Manager" 
          ? "/dashboard/manager" 
          : "/dashboard/member";
        navigate(dashboardPath);
      }, 100);
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
