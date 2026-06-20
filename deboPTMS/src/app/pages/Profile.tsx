import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { User, Mail, Lock, Save, XCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";

interface PasswordValidationErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordValidationErrors>({});
  const [passwordTouched, setPasswordTouched] = useState<{ [key: string]: boolean }>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation functions
  const validateCurrentPassword = (value: string): string | undefined => {
    if (!value) return "Current password is required";
    return undefined;
  };

  const validateNewPassword = (value: string): string | undefined => {
    if (!value) return "New password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    if (value.length > 100) return "Password is too long";
    if (!/[A-Za-z]/.test(value)) return "Password must contain at least one letter";
    if (!/[0-9]/.test(value)) return "Password must contain at least one number";
    if (value === passwordData.currentPassword) return "New password must be different from current password";
    return undefined;
  };

  const validateConfirmPassword = (value: string): string | undefined => {
    if (!value) return "Please confirm your new password";
    if (value !== passwordData.newPassword) return "Passwords do not match";
    return undefined;
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

  const newPasswordStrength = getPasswordStrength(passwordData.newPassword);

  // Real-time validation on blur for password fields
  const handlePasswordBlur = (field: string) => {
    setPasswordTouched({ ...passwordTouched, [field]: true });
    
    const newErrors = { ...passwordErrors };
    
    switch (field) {
      case "currentPassword":
        const currentError = validateCurrentPassword(passwordData.currentPassword);
        if (currentError) newErrors.currentPassword = currentError;
        else delete newErrors.currentPassword;
        break;
      case "newPassword":
        const newError = validateNewPassword(passwordData.newPassword);
        if (newError) newErrors.newPassword = newError;
        else delete newErrors.newPassword;
        // Also revalidate confirm password if it's been touched
        if (passwordTouched.confirmPassword) {
          const confirmError = validateConfirmPassword(passwordData.confirmPassword);
          if (confirmError) newErrors.confirmPassword = confirmError;
          else delete newErrors.confirmPassword;
        }
        break;
      case "confirmPassword":
        const confirmError = validateConfirmPassword(passwordData.confirmPassword);
        if (confirmError) newErrors.confirmPassword = confirmError;
        else delete newErrors.confirmPassword;
        break;
    }
    
    setPasswordErrors(newErrors);
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: PasswordValidationErrors = {};
    
    const currentError = validateCurrentPassword(passwordData.currentPassword);
    if (currentError) newErrors.currentPassword = currentError;
    
    const newError = validateNewPassword(passwordData.newPassword);
    if (newError) newErrors.newPassword = newError;
    
    const confirmError = validateConfirmPassword(passwordData.confirmPassword);
    if (confirmError) newErrors.confirmPassword = confirmError;
    
    setPasswordErrors(newErrors);
    setPasswordTouched({ currentPassword: true, newPassword: true, confirmPassword: true });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!profileData.full_name || !profileData.email) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsUpdating(true);
    try {
      // Backend returns: { message: 'Profile updated successfully' }
      await userAPI.updateProfile({
        full_name: profileData.full_name,
        email: profileData.email,
      });
      
      // Refresh user data from server
      await refreshUser();
      
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to update profile";
      toast.error(errorMessage);
      console.error("Update profile error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);
    try {
      // Backend returns: { message: 'Password changed successfully' }
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      setPasswordTouched({});
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to change password";
      toast.error(errorMessage);
      console.error("Change password error:", error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>My Profile</h1>
        <p className={`mt-1 text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Manage your account settings and preferences</p>
      </div>

      {/* Profile Overview */}
      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardHeader className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white rounded-t-lg">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-white">
              <AvatarFallback className="bg-white text-[#0f5841] text-xl sm:text-2xl font-bold">
                {getInitials(user?.full_name || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold">{user?.full_name}</h2>
              <p className="text-white/80 text-sm sm:text-base break-all">{user?.email}</p>
              <p className="text-xs sm:text-sm text-white/90 mt-1 bg-white/20 inline-block px-3 py-1 rounded-full">
                {user?.role}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Edit Profile */}
      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
              <User className="h-5 w-5 text-[#0f5841]" />
              Profile Information
            </CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className={`w-full sm:w-auto ${theme === 'dark' ? 'border-slate-600 text-gray-200 hover:bg-slate-700' : ''}`}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className={theme === 'dark' ? 'text-gray-200' : ''}>Full Name</Label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  disabled={!isEditing}
                  className={`pl-10 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white disabled:bg-slate-800 disabled:text-gray-400' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className={theme === 'dark' ? 'text-gray-200' : ''}>Email Address</Label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  disabled={!isEditing}
                  className={`pl-10 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white disabled:bg-slate-800 disabled:text-gray-400' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-gray-200' : ''}>Role</Label>
              <Input 
                value={user?.role || ""} 
                disabled 
                className={theme === 'dark' ? 'bg-slate-800 border-slate-600 text-gray-400' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-gray-200' : ''}>Account Status</Label>
              <Input 
                value={user?.is_active ? "Active" : "Inactive"} 
                disabled 
                className={theme === 'dark' ? 'bg-slate-800 border-slate-600 text-gray-400' : ''}
              />
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                  className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white w-full sm:w-auto"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => {
                    setIsEditing(false);
                    setProfileData({
                      full_name: user?.full_name || "",
                      email: user?.email || "",
                    });
                  }}
                  className={`w-full sm:w-auto ${theme === 'dark' ? 'border-slate-600 text-gray-200 hover:bg-slate-700' : ''}`}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
            <Lock className="h-5 w-5 text-[#194f87]" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className={theme === 'dark' ? 'text-gray-200' : ''}>Current Password</Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  onBlur={() => handlePasswordBlur("currentPassword")}
                  className={`pl-10 pr-10 ${passwordTouched.currentPassword && passwordErrors.currentPassword ? "border-red-500" : ""} ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-400' : ''}`}
                />
                <button
                  type="button"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordTouched.currentPassword && passwordErrors.currentPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle size={14} className="flex-shrink-0" />
                  <span>{passwordErrors.currentPassword}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className={theme === 'dark' ? 'text-gray-200' : ''}>New Password</Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password (min 6 characters)"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  onBlur={() => handlePasswordBlur("newPassword")}
                  className={`pl-10 pr-10 ${passwordTouched.newPassword && passwordErrors.newPassword ? "border-red-500" : ""} ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-400' : ''}`}
                />
                <button
                  type="button"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordTouched.newPassword && passwordErrors.newPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle size={14} className="flex-shrink-0" />
                  <span>{passwordErrors.newPassword}</span>
                </p>
              )}
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${newPasswordStrength.color}`}
                      style={{ width: `${newPasswordStrength.strength}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Strength: {newPasswordStrength.label}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className={theme === 'dark' ? 'text-gray-200' : ''}>Confirm New Password</Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  onBlur={() => handlePasswordBlur("confirmPassword")}
                  className={`pl-10 pr-10 ${passwordTouched.confirmPassword && passwordErrors.confirmPassword ? "border-red-500" : ""} ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-400' : ''}`}
                />
                <button
                  type="button"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordTouched.confirmPassword && passwordErrors.confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle size={14} className="flex-shrink-0" />
                  <span>{passwordErrors.confirmPassword}</span>
                </p>
              )}
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="bg-gradient-to-r from-[#194f87] to-[#0f5841] text-white w-full sm:w-auto"
            >
              {isChangingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};