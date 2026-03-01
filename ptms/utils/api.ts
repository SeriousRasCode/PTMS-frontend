// API Utility Functions for PTMS Mobile
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API configuration
// 10.0.2.2 is the default for Android Emulator to see your computer's localhost
// Use your actual IP (like 192.168.x.x) for physical devices
const API_BASE_URL = "http://192.168.121.172:3000/api"; 

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = await AsyncStorage.getItem("authToken");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};

// --- AUTH APIs ---
export const authAPI = {
  register: (data: any) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...data, role_id: 3 }),
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: { email: string }) =>
    apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// --- USER APIs ---
export const userAPI = {
  getProfile: () => apiRequest("/users/profile"),
  getMe: () => apiRequest("/users/me"),
  getMyRole: () => apiRequest("/users/me/role"),
  updateProfile: (data: any) =>
    apiRequest("/users/update-me", { method: "PUT", body: JSON.stringify(data) }),
};

// --- ADMIN APIs ---
export const adminAPI = {
  getAllUsers: () => apiRequest("/admin/all-users"),
  assignRole: (userId: number, roleName: string) =>
    apiRequest(`/admin/users/${userId}/change-roles`, {
      method: "POST",
      body: JSON.stringify({ roleName }),
    }),
  updateUserStatus: (userId: number, is_active: boolean) =>
    apiRequest(`/admin/users/${userId}/change-status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active }),
    }),
};

// --- PROJECT APIs ---
export const projectAPI = {
  createProject: (data: any) =>
    apiRequest("/create-projects", { method: "POST", body: JSON.stringify(data) }),
  getAllProjects: () => apiRequest("/all-projects"),
  getMyProjects: () => apiRequest("/projects/my-projects"),
  updateProject: (projectId: number, data: any) =>
    apiRequest(`/update-projects/${projectId}`, { method: "PUT", body: JSON.stringify(data) }),
};

// --- TASK APIs ---
export const taskAPI = {
  getMyTasks: () => apiRequest("/tasks/my-tasks"),
  getTasksByProject: (projectId: number) => apiRequest(`/tasks/projects/${projectId}`),
  createTask: (projectId: number, data: any) =>
    apiRequest(`/tasks/projects/${projectId}`, { method: "POST", body: JSON.stringify(data) }),
  updateTask: (taskId: number, data: any) =>
    apiRequest(`/tasks/${taskId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (taskId: number) => apiRequest(`/tasks/${taskId}`, { method: "DELETE" }),
  assignTask: (taskId: number, userId: number) =>
    apiRequest(`/tasks/${taskId}/assign`, { method: "POST", body: JSON.stringify({ userId }) }),
};

// --- DASHBOARD & TEAMS ---
export const dashboardAPI = {
  getManagerDashboard: () => apiRequest("/dashboard/manager"),
  getAdminSummary: () => apiRequest("/dashboard/admin-summary"),
};

export const teamAPI = {
  getMyTeams: () => apiRequest("/teams/my-teams"),
  getAllTeams: () => apiRequest("/teams/all-teams"),
  createTeam: (data: { name: string }) =>
    apiRequest("/teams/create", { method: "POST", body: JSON.stringify(data) }),
};

// Response Helper for UI Lists
export const parseArrayResponse = (response: any): any[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.success && Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data)) return response.data;
  return [];
};

// Export Unified Object
export const api = {
  auth: authAPI,
  user: userAPI,
  admin: adminAPI,
  project: projectAPI,
  task: taskAPI,
  dashboard: dashboardAPI,
  team: teamAPI,
};