// API Utility Functions for PTMS
// Backend API configuration

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api"; // Backend API base URL

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken");

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
    // If it's a network error (server not reachable)
    if (error.message === 'Failed to fetch' || error instanceof TypeError) {
      throw new Error(`Unable to connect to server at ${API_BASE_URL}. Please ensure your backend is running.`);
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
  }) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        role_id: 3, // Always register as Member (role_id: 3)
      }),
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

  getMyRole: () => apiRequest("/users/me/role"),

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

  addUserToTeam: (teamId: number, userId: number) => {
    const payload = { userId };
    return apiRequest(`/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
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
  
  getMyProjects: () => apiRequest("/projects/my-projects"),

  getProjectMembers: (projectId: number) => 
    apiRequest(`/projects/${projectId}/members`),

  updateProject: (
    projectId: number,
    data: {
      name?: string;
      description?: string;
      status?: string;
      start_date?: string;
      end_date?: string;
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

  getAllTeams: () => apiRequest("/teams/all-teams"),

  getTeamMembers: (teamId: number) => apiRequest(`/teams/${teamId}/members`),

  createTeam: (data: { name: string }) =>
    apiRequest("/teams/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  addTeamMember: (teamId: number, data: { userId: number }) =>
    apiRequest(`/teams/${teamId}/members`, {
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