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
  register: (full_name: string, email: string, password: string) => Promise<void>;
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
      } catch (e) {
        logout();
        setIsLoading(false);
        return;
      }
      
      // Verify token is still valid
      userAPI.getMe()
        .then((response) => {
          const userProfile = response.user || response.data || response;
          
          const userData: User = {
            id: userProfile.id,
            full_name: userProfile.full_name || (parsedUser?.full_name) || "User",
            email: userProfile.email || (parsedUser?.email) || "",
            role: (parsedUser?.role) || "Member",
            is_active: userProfile.is_active !== undefined ? userProfile.is_active : true,
          };
          
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          setIsLoading(false);
        })
        .catch((error) => {
          logout();
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.token) {
        const authToken = response.token;
        setToken(authToken);
        localStorage.setItem("authToken", authToken);
        
        if (response.user) {
          const backendUser = response.user;
          
          let roleName = "Member";
          if (backendUser.roles && backendUser.roles.length > 0) {
            const firstRole = backendUser.roles[0];
            if (typeof firstRole === "string") {
              roleName = firstRole;
            } else if (typeof firstRole === "object" && firstRole !== null) {
              roleName = firstRole.name || firstRole.role_name || "Member";
            }
          }

          const userData: User = {
            id: backendUser.id,
            full_name: backendUser.fullName || backendUser.full_name || "User",
            email: backendUser.email || email,
            role: roleName,
            is_active: backendUser.is_active !== undefined ? backendUser.is_active : true,
          };
          
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          try {
            const profileResponse = await userAPI.getMe();
            const userProfile = profileResponse.data || profileResponse;
            
            let roleName = "Member";
            if (userProfile.role) {
              roleName = userProfile.role;
            } else if (userProfile.roles && userProfile.roles.length > 0) {
              const firstRole = userProfile.roles[0];
              if (typeof firstRole === "string") {
                roleName = firstRole;
              } else if (typeof firstRole === "object" && firstRole !== null) {
                roleName = firstRole.name || firstRole.role_name || "Member";
              }
            } else if (userProfile.role_id !== undefined) {
              roleName = getRoleName(userProfile.role_id);
            }

            const userData: User = {
              id: userProfile.id,
              full_name: userProfile.full_name || userProfile.fullName || "User",
              email: userProfile.email || email,
              role: roleName,
              is_active: userProfile.is_active !== undefined ? userProfile.is_active : true,
            };
            
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } catch (profileError) {
            throw new Error("Unable to fetch user profile");
          }
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (full_name: string, email: string, password: string) => {
    try {
      await authAPI.register({ full_name, email, password });
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await userAPI.getMe();
      const userProfile = response.user || response.data || response;
      
      const userData: User = {
        id: userProfile.id,
        full_name: userProfile.full_name || user?.full_name || "User",
        email: userProfile.email || user?.email || "",
        role: user?.role || "Member",
        is_active: userProfile.is_active !== undefined ? userProfile.is_active : true,
      };
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
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