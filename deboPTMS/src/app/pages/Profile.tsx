import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { User, Mail, Lock, Save } from "lucide-react";
import { toast } from "sonner";

export const Profile = () => {

    const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleUpdateProfile = () => {
    if (!profileData.full_name || !profileData.email) {
      toast.error("Please fill in all fields");
      return;
    }

    // Mock API call
    toast.success("Profile updated successfully!");
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    // Mock API call
    toast.success("Password changed successfully!");
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

    return(

        <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white rounded-t-lg">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-white">
              <AvatarFallback className="bg-white text-[#0f5841] text-2xl font-bold">
                {getInitials(user?.full_name || "U")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user?.full_name}</h2>
              <p className="text-white/80">{user?.email}</p>
              <p className="text-sm text-white/90 mt-1 bg-white/20 inline-block px-3 py-1 rounded-full">
                {user?.role}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#0f5841]" />
              Profile Information
            </CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={user?.role || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label>Account Status</Label>
              <Input value={user?.is_active ? "Active" : "Inactive"} disabled />
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleUpdateProfile}
                  className="bg-gradient-to-r from-[#0f5841] to-[#194f87] text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setProfileData({
                      full_name: user?.full_name || "",
                      email: user?.email || "",
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

       {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#194f87]" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>

            <Button
              onClick={handleChangePassword}
              className="bg-gradient-to-r from-[#194f87] to-[#0f5841] text-white"
            >
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    );

};