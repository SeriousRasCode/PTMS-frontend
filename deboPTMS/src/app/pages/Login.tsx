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

  return(

    <div className="min-h-screen bg-gradient-to-br from-[#0f5841] via-[#194f87] to-[#0f5841] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <LogIn size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/80">Sign in to your PTMS account</p>
        </div>

  );

};
