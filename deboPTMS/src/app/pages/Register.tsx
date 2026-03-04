import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { User, Mail, Lock, UserPlus, CheckCircle2, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ValidationErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading } = useAuth();
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
  const validateFullName = (value: string): string | undefined => {
    if (!value.trim()) return "Full name is required";
    if (value.trim().length < 2) return "Full name must be at least 2 characters";
    if (value.trim().length > 100) return "Full name is too long";
    return undefined;
  };

  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    if (value.length > 100) return "Password is too long";
    if (!/[A-Za-z]/.test(value)) return "Password must contain at least one letter";
    if (!/[0-9]/.test(value)) return "Password must contain at least one number";
    return undefined;
  };

  const validateConfirmPassword = (value: string): string | undefined => {
    if (!value) return "Please confirm your password";
    if (value !== password) return "Passwords do not match";
    return undefined;
  };

  // Real-time validation on blur
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    
    const newErrors = { ...errors };
    
    switch (field) {
      case "fullName":
        const nameError = validateFullName(fullName);
        if (nameError) newErrors.fullName = nameError;
        else delete newErrors.fullName;
        break;
      case "email":
        const emailError = validateEmail(email);
        if (emailError) newErrors.email = emailError;
        else delete newErrors.email;
        break;
      case "password":
        const passError = validatePassword(password);
        if (passError) newErrors.password = passError;
        else delete newErrors.password;
        // Also revalidate confirm password if it's been touched
        if (touched.confirmPassword) {
          const confirmError = validateConfirmPassword(confirmPassword);
          if (confirmError) newErrors.confirmPassword = confirmError;
          else delete newErrors.confirmPassword;
        }
        break;
      case "confirmPassword":
        const confirmError = validateConfirmPassword(confirmPassword);
        if (confirmError) newErrors.confirmPassword = confirmError;
        else delete newErrors.confirmPassword;
        break;
    }
    
    setErrors(newErrors);
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    const nameError = validateFullName(fullName);
    if (nameError) newErrors.fullName = nameError;
    
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    const passError = validatePassword(password);
    if (passError) newErrors.password = passError;
    
    const confirmError = validateConfirmPassword(confirmPassword);
    if (confirmError) newErrors.confirmPassword = confirmError;
    
    setErrors(newErrors);
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    
    return Object.keys(newErrors).length === 0;
  };

  // Password strength indicator
  const getPasswordStrength = (pass: string): { strength: number; label: string; color: string } => {
    if (!pass) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    
    if (strength <= 2) return { strength: 33, label: "Weak", color: "bg-red-500" };
    if (strength === 3) return { strength: 66, label: "Medium", color: "bg-yellow-500" };
    return { strength: 100, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await register(fullName, email, password);
      toast.success("Registration successful! Please log in with your credentials.");
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      const errorMessage = error?.message || "Registration failed. Please try again.";
      
      // Check for duplicate email error
      if (errorMessage.includes('Duplicate entry') || errorMessage.includes('email')) {
        toast.error('Email already registered. Please use a different email or try logging in.', {
          duration: 5000,
        });
      }
      // If it's a database error, show specific help
      else if (errorMessage.includes('Database Error') || errorMessage.includes('foreign key constraint')) {
        toast.error('Database Setup Error: Roles table not properly configured', {
          duration: 12000,
          description: 'Your backend database needs the roles table with role entries. Check console for details.',
        });
      }
      // If it's a backend endpoint error, show additional help
      else if (errorMessage.includes('Backend endpoint not found')) {
        toast.error('Backend endpoint /auth/register not found! Your backend needs to implement this endpoint.', {
          duration: 10000,
          action: {
            label: 'How to Fix',
            onClick: () => window.open('/BACKEND_ENDPOINT_ERROR.md', '_blank')
          }
        });
        
        // Also open the testing tool automatically
        setTimeout(() => {
          window.open('/test-backend-connection.html', '_blank');
        }, 1000);
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#194f87] via-[#0f5841] to-[#194f87] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <img
              src="/debo-logo.png"
              alt="Debo Logo"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-white/80">Join PTMS and start managing projects</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  required
                  onBlur={() => handleBlur("fullName")}
                />
              </div>
              {touched.fullName && errors.fullName && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle size={14} className="flex-shrink-0" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
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
                  placeholder="At least 6 characters"
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
              {password && (
                <div className="mt-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Strength: {passwordStrength.label}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  onBlur={() => handleBlur("confirmPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle size={14} className="flex-shrink-0" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#0f5841] to-[#194f87] hover:from-[#0d4a36] hover:to-[#15406e] text-white font-medium py-6"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#194f87] hover:text-[#0f5841] font-medium transition-colors"
              >
                Sign in
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