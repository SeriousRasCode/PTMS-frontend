import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, userAPI } from "../utils/api";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

// Helper to map role_id to role name
const getRoleName = (role_id: number): string => {
  switch (role_id) {
    case 1:
      return "Admin";
    case 2:
      return "Manager";
    case 3:
      return "Member";
    default:
      return "Member";
  }
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (full_name: string, email: string, password: string, role_id: number) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  };

  useEffect(() => {
    // Check for stored auth token on mount
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      
      let parsedUser: User | null = null;
      
      try {
        parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        console.log("Loaded user from localStorage:", parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        logout();
        setIsLoading(false);
        return;
      }
      
      // Verify token is still valid (optional - can refresh user data later if needed)
      
      userAPI.getMe()
        .then((response) => {
          console.log("Profile refresh response:", response);
          
          // Backend returns: { user: { id, full_name, email, is_active, created_at } }
          const userProfile = response.user || response.data || response;
          
          console.log("User profile extracted:", userProfile);
          
          // Update user data with fresh data from server, but keep the role from localStorage
          const userData: User = {
            id: userProfile.id,
            full_name: userProfile.full_name || (parsedUser?.full_name) || "User",
            email: userProfile.email || (parsedUser?.email) || "",
            role: (parsedUser?.role) || "Member", // Keep role from login since /users/me doesn't return it
            is_active: userProfile.is_active !== undefined ? userProfile.is_active : true,
          };
          
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Token verification failed:", error);
          // Token is invalid, clear auth state
          logout();
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Backend returns: { token: "...", user: { id, fullName, email, roles } }
      const response = await authAPI.login({ email, password });
      
      console.log("Login response:", response);
      
      if (response.token) {
        // Store the token first
        const authToken = response.token;
        setToken(authToken);
        localStorage.setItem("authToken", authToken);
        
        // Backend returns user data directly in login response
        if (response.user) {
          const backendUser = response.user;
          
          console.log("User from login:", backendUser);
          
          // Extract role name from roles array. Backend may return an array of strings
          let roleName = "Member"; // default fallback
          if (backendUser.roles && backendUser.roles.length > 0) {
            const firstRole = backendUser.roles[0];
            if (typeof firstRole === "string") {
              roleName = firstRole;
            } else if (typeof firstRole === "object" && firstRole !== null) {
              roleName =
                firstRole.name || firstRole.role_name || "Member";
            }
          }

          // Construct user object with all necessary fields
          const userData: User = {
            id: backendUser.id,
            full_name: backendUser.fullName || backendUser.full_name || "User",
            email: backendUser.email || email,
            role: roleName,
            is_active:
              backendUser.is_active !== undefined ? backendUser.is_active : true,
          };
          
          console.log("User data constructed:", userData);
          
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          // Fallback: Fetch user profile from /users/me endpoint if not in login response
          try {
            const profileResponse = await userAPI.getMe();
            
            console.log("Profile response (fallback):", profileResponse);
            
            // Backend returns ApiResponse: { success, data, message }
            const userProfile = profileResponse.data || profileResponse;
            
            console.log("User profile extracted:", userProfile);
            
            // Construct user object with all necessary fields
            let roleName = "Member";
            if (userProfile.role) {
              roleName = userProfile.role;
            } else if (userProfile.roles && userProfile.roles.length > 0) {
              const firstRole = userProfile.roles[0];
              if (typeof firstRole === "string") {
                roleName = firstRole;
              } else if (typeof firstRole === "object" && firstRole !== null) {
                roleName =
                  firstRole.name || firstRole.role_name || "Member";
              }
            } else if (userProfile.role_id !== undefined) {
              roleName = getRoleName(userProfile.role_id);
            }

            const userData: User = {
              id: userProfile.id,
              full_name:
                userProfile.full_name || userProfile.fullName || "User",
              email: userProfile.email || email,
              role: roleName,
              is_active:
                userProfile.is_active !== undefined ? userProfile.is_active : true,
            };
            
            console.log("User data constructed:", userData);
            
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } catch (profileError) {
            console.error("Error fetching user profile:", profileError);
            throw new Error("Unable to fetch user profile");
          }
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (full_name: string, email: string, password: string, role_id: number) => {
    try {
      // Backend returns: { message: 'User registered successfully' }
      await authAPI.register({ full_name, email, password, role_id });
      
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      console.log("Refreshing user data...");
      
      // Fetch latest user data from backend
      // Note: /users/me doesn't return roles, so we keep the role from current user state
      const response = await userAPI.getMe();
      
      console.log("Profile refresh response:", response);
      
      // Backend returns: { user: { id, full_name, email, is_active, created_at } }
      const userProfile = response.user || response.data || response;
      
      console.log("User profile extracted:", userProfile);
      
      // Update user data with fresh data from server, but keep the role from current state
      const userData: User = {
        id: userProfile.id,
        full_name: userProfile.full_name || user?.full_name || "User",
        email: userProfile.email || user?.email || "",
        role: user?.role || "Member", // Keep role from login since /users/me doesn't return it
        is_active: userProfile.is_active !== undefined ? userProfile.is_active : true,
      };
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      
      console.log("User data refreshed:", userData);
    } catch (error) {
      console.error("Refresh user error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};