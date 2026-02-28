import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";

interface ValidationErrors {
  email?: string;
  password?: string;
}

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // If still loading auth state, show nothing (or a loader)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f5841] via-[#194f87] to-[#0f5841] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log("Starting login with:", { email, password: "***" });

    try {
      await login(email, password);
      console.log("Login successful, navigating...");
      toast.success("Login successful!");
      
      // Wait briefly for auth context to update, then redirect based on actual user role
      setTimeout(() => {
        // Get the updated user from localStorage (it's set in login)
        const storedUser = localStorage.getItem("user");
        console.log("Stored user after login:", storedUser);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const role = userData.role || userData.role_name;
          
          console.log("Redirecting to dashboard for role:", role);
          
          const dashboardPath = role === "Admin" 
            ? "/dashboard/admin" 
            : role === "Manager" 
            ? "/dashboard/manager" 
            : "/dashboard/member";
          navigate(dashboardPath);
        } else {
          console.error("No user data found in localStorage after login!");
          toast.error("Login failed: User data not found");
          setLoading(false);
        }
      }, 100);
    } catch (error: any) {
      console.error("Login error caught:", error);
      
      const errorMessage = error?.message || "Login failed. Please check your credentials.";
      
      // If it's a backend endpoint error, show additional help
      if (errorMessage.includes('Backend endpoint not found') || errorMessage.includes('Unable to connect to server')) {
        toast.error('Backend connection error! Please check your backend server.', {
          duration: 10000,
          action: {
            label: 'Diagnose',
            onClick: () => window.open('/test-backend-connection.html', '_blank')
          }
        });
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }
      
      setLoading(false);
    }
  };

  return (
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

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-[#194f87] hover:text-[#0f5841] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87] hover:from-[#0d4a36] hover:to-[#15406e] text-white font-medium py-6"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-[#194f87] hover:text-[#0f5841] font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-white/60 text-sm">
          <p>Project Task Management System</p>
        </div>
      </div>
    </div>
  );
};