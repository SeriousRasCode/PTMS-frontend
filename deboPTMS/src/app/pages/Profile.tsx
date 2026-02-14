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
    );

};