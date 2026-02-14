import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    const dashboardPath = user?.role === "Admin" 
      ? "/dashboard/admin" 
      : user?.role === "Manager" 
      ? "/dashboard/manager" 
      : "/dashboard/member";
    
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};
