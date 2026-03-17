import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, Lock, XCircle, Eye, EyeOff, Sun, Moon } from "lucide-react";
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
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // If still loading auth state, show nothing (or a loader)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f5841] via-[#194f87] to-[#0f5841] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Validation functions
  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return undefined;
  };

  // Real-time validation on blur
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    
    const newErrors = { ...errors };
    
    switch (field) {
      case "email":
        const emailError = validateEmail(email);
        if (emailError) newErrors.email = emailError;
        else delete newErrors.email;
        break;
      case "password":
        const passError = validatePassword(password);
        if (passError) newErrors.password = passError;
        else delete newErrors.password;
        break;
    }
    
    setErrors(newErrors);
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    const passError = validatePassword(password);
    if (passError) newErrors.password = passError;
    
    setErrors(newErrors);
    setTouched({ email: true, password: true });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      toast.success("Login successful!");
      
      // Wait briefly for auth context to update, then redirect based on actual user role
      setTimeout(() => {
        // Get the updated user from localStorage (it's set in login)
        const storedUser = localStorage.getItem("user");
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const role = userData.role || userData.role_name;
          
          const dashboardPath = role === "Admin" 
            ? "/dashboard/admin" 
            : role === "Manager" 
            ? "/dashboard/manager" 
            : "/dashboard/member";
          navigate(dashboardPath);
        } else {
          toast.error("Login failed: User data not found");
          setLoading(false);
        }
      }, 100);
    } catch (error: any) {
      let errorMessage = "Login failed. Please try again.";
      
      if (error?.message) {
        if (error.message.includes('CORS') || error.message.includes('Cannot connect')) {
          errorMessage = "Cannot connect to backend server. Please ensure:\n1. Backend is running on http://localhost:3333\n2. CORS is enabled on your backend to allow requests from this origin";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage, { 
        duration: 8000,
        style: { whiteSpace: 'pre-line' }
      });
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-[#0f5841] via-[#194f87] to-[#0f5841]'} flex items-center justify-center p-4`}>
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 text-white hover:bg-white/10 p-3 rounded-lg transition-colors z-50"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
      </button>
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <img src="/debo-logo.svg" alt="Debo Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/80">Sign in to your PTMS account</p>
        </div>

        {/* Login Form */}
        <div className={`${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white'} rounded-2xl shadow-2xl p-8`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  onBlur={() => handleBlur("email")}
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle size={14} className="flex-shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  onBlur={() => handleBlur("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle size={14} className="flex-shrink-0" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className={`text-sm font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-[#194f87] hover:text-[#0f5841]'
                }`}
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
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Don't have an account?{" "}
              <Link
                to="/register"
                className={`font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-[#194f87] hover:text-[#0f5841]'
                }`}
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