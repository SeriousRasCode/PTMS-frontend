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

// Create context with a default value
const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  login: async () => {
    throw new Error("AuthProvider not initialized");
  },
  register: async () => {
    throw new Error("AuthProvider not initialized");
  },
  logout: () => {
    throw new Error("AuthProvider not initialized");
  },
  refreshUser: async () => {
    throw new Error("AuthProvider not initialized");
  },
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

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
        setIsLoading(false); // Set loading to false immediately with cached data
      } catch (e) {
        logout();
        setIsLoading(false);
        return;
      }
      
      // Optionally verify token in background (non-blocking)
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
        })
        .catch((error) => {
          // Silently fail - user already has cached data
          console.warn("Token verification failed:", error);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });

      if (response.token || response.data?.token || response.accessToken) {
        const authToken = response.token || response.data?.token || response.accessToken;
        setToken(authToken);
        localStorage.setItem("authToken", authToken);
        
        // Get user data from response
        const backendUser = response.user || response.data?.user || response.data;
        
        if (backendUser && backendUser.id) {
          let roleName = "Member";
          if (backendUser.roles && backendUser.roles.length > 0) {
            const firstRole = backendUser.roles[0];
            if (typeof firstRole === "string") {
              roleName = firstRole;
            } else if (typeof firstRole === "object" && firstRole !== null) {
              roleName = firstRole.name || firstRole.role_name || "Member";
            }
          } else if (backendUser.role) {
            roleName = backendUser.role;
          } else if (backendUser.role_id !== undefined) {
            roleName = getRoleName(backendUser.role_id);
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
            console.error("Profile fetch error:", profileError);
            throw new Error("Unable to fetch user profile");
          }
        }
      } else {
        console.error("No token in response:", response);
        throw new Error(`Login failed: ${response.message || "Invalid response from server"}`);
      }
    } catch (error: any) {
      console.error("Login error:", error);
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