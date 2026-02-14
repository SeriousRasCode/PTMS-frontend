// API Utility Functions for PTMS
// Backend API configuration

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/"
).replace(/\/+$/, ""); // Remove trailing slashes

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Helper function for API requests
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const token = getAuthToken();
  const headers: any = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if response has content
    const contentType = response.headers.get("content-type");
    const hasJsonContent =
      contentType && contentType.includes("application/json");

    // Try to parse response body
    let data;
    try {
      const text = await response.text();

      // If empty response
      if (!text || text.trim() === "") {
        data = {};
      } else if (hasJsonContent) {
        // If JSON content type, parse as JSON
        data = JSON.parse(text);
      } else {
        // If not JSON (e.g., HTML error page)
        // Check if it's an HTML error indicating endpoint doesn't exist
        if (
          text.includes("Cannot POST") ||
          text.includes("Cannot GET") ||
          text.includes("Cannot PUT") ||
          text.includes("Cannot PATCH") ||
          text.includes("Cannot DELETE")
        ) {
          throw new Error(
            `Backend endpoint not found: ${options.method || "GET"} ${endpoint}\n\nThe backend returned an HTML error page, which means this endpoint doesn't exist on your backend server.\n\nPlease verify:\n1. Your backend server is properly set up\n2. The endpoint ${endpoint} is defined in your backend routes\n3. Open test-backend-connection.html to diagnose endpoint issues`,
          );
        }
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 200)}`,
        );
      }
    } catch (parseError: any) {
      // If it's already our custom error, rethrow it
      if (
        parseError.message.includes(
          "Backend endpoint not found",
        )
      ) {
        throw parseError;
      }
      // If JSON parsing fails
      throw new Error(
        `Invalid server response. Expected JSON but got: ${parseError.message}`,
      );
    }

    if (!response.ok) {
      // Extract error message from response
      const errorMessage =
        data.message ||
        data.error ||
        `API Error: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    // If it's our custom endpoint error, rethrow it
    if (error.message.includes("Backend endpoint not found")) {
      throw error;
    }
    // If it's a network error or other fetch error
    if (
      error.message === "Failed to fetch" ||
      error.name === "TypeError"
    ) {
      throw new Error(
        "Unable to connect to server. Please ensure the backend is running at " +
          API_BASE_URL,
      );
    }
    throw error;
  }
};

// Auth APIs
export const authAPI = {
  register: (data: {
    full_name: string;
    email: string;
    password: string;
    role_id: number;
  }) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
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

  resetPassword: (data: {
    token: string;
    newPassword: string;
  }) =>
    apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// User APIs
export const userAPI = {
  getProfile: () => apiRequest("/users/profile"),

  getMe: () => apiRequest("/users/me"),

  updateProfile: (data: {
    full_name?: string;
    email?: string;
  }) =>
    apiRequest("/users/update-me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) =>
    apiRequest("/users/me/password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Admin APIs
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

  createRole: (data: { name: string; description: string }) =>
    apiRequest("/admin/create-roles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Project APIs
export const projectAPI = {
  createProject: (data: {
    name: string;
    description: string;
    team_id: number;
    start_date: string;
    end_date: string;
  }) =>
    apiRequest("/create-projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAllProjects: () => apiRequest("/all-projects"),

  updateProject: (
    projectId: number,
    data: {
      name?: string;
      description?: string;
      status?: string;
    },
  ) =>
    apiRequest(`/update-projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Task APIs
export const taskAPI = {
  createTask: (
    projectId: number,
    data: {
      title: string;
      description: string;
      start_date: string;
      due_date: string;
      status: string;
      progress_percentage: number;
    },
  ) =>
    apiRequest(`/tasks/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTasksByProject: (projectId: number) =>
    apiRequest(`/tasks/projects/${projectId}`),

  updateTask: (
    taskId: number,
    data: { progress_percentage?: number },
  ) =>
    apiRequest(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteTask: (taskId: number) =>
    apiRequest(`/tasks/${taskId}`, {
      method: "DELETE",
    }),

  updateProgress: (
    taskId: number,
    data: {
      progress_percentage: number;
      update_note: string;
    },
  ) =>
    apiRequest(`/tasks/${taskId}/progress`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getTaskHistory: (taskId: number) =>
    apiRequest(`/tasks/${taskId}/history`),

  getMyTasks: () => apiRequest("/tasks/my-tasks"),

  assignTask: (taskId: number, userId: number) =>
    apiRequest(`/tasks/${taskId}/assign`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  getAssignments: (taskId: number) =>
    apiRequest(`/tasks/${taskId}/assignments`),
};

// Report APIs
export const reportAPI = {
  getOverdueTasks: () => apiRequest("/reports/overdue-tasks"),

  getWorkload: () => apiRequest("/reports/workload"),
};

// Dashboard APIs
export const dashboardAPI = {
  getManagerDashboard: () => apiRequest("/dashboard/manager"),

  getAdminSummary: () => apiRequest("/dashboard/admin-summary"),
};

// Team APIs
export const teamAPI = {
  getMyTeams: () => apiRequest("/teams/my-teams"),

  createTeam: (data: { name: string }) =>
    apiRequest("/teams/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  addTeamMember: (userId: number, data: { userId: number }) =>
    apiRequest(`/teams/${userId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Export all APIs
export const api = {
  auth: authAPI,
  user: userAPI,
  admin: adminAPI,
  project: projectAPI,
  task: taskAPI,
  report: reportAPI,
  dashboard: dashboardAPI,
  team: teamAPI,
};