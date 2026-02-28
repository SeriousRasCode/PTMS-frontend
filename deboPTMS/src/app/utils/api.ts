// API Utility Functions for PTMS
// Backend API configuration

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api"; // Backend runs on port 3333 - NO trailing slash

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken");
  
  console.log("=== API REQUEST ===");
  console.log("Endpoint:", endpoint);
  console.log("Method:", options.method || "GET");
  console.log("Token exists:", !!token);
  console.log("Full URL:", `${API_BASE_URL}${endpoint}`);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("Authorization header added");
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log("=== API RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("OK:", response.ok);

    const contentType = response.headers.get("content-type");
    console.log("Content-Type:", contentType);

    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
      console.log("Response data:", data);
    } else {
      const text = await response.text();
      console.log("Response text:", text);
      data = { message: text };
    }

    if (!response.ok) {
      // Only log non-permission errors to avoid cluttering console
      if (response.status !== 403 && !data.message?.includes('Forbidden')) {
        console.error("API Error:", data);
      } else {
        console.log("Permission denied (403):", data.message);
      }
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error: any) {
    // Only log detailed errors for non-permission issues
    if (!error.message?.includes('Forbidden') && !error.message?.includes('permission')) {
      console.error("=== API REQUEST FAILED ===");
      console.error("Error:", error);
      console.error("Message:", error.message);
    } else {
      console.log("Permission check failed (expected for some user roles)");
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
    console.log("addUserToTeam API call:", {
      endpoint: `/teams/${teamId}/members`,
      method: "POST",
      payload: payload,
      stringified: JSON.stringify(payload),
    });
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
  ) => {
    console.log("taskAPI.createTask called with:", { projectId, data });
    return apiRequest(`/tasks/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then(response => {
      console.log("taskAPI.createTask response:", response);
      return response;
    }).catch(error => {
      console.error("taskAPI.createTask error:", error);
      throw error;
    });
  },

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

  assignTask: (taskId: number, userId: number) => {
    console.log("=== ASSIGNING TASK ===");
    console.log("Task ID:", taskId);
    console.log("User ID:", userId);
    console.log("Endpoint:", `/tasks/${taskId}/assign`);
    console.log("Payload:", { userId });
    
    return apiRequest(`/tasks/${taskId}/assign`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }).then(response => {
      console.log("=== TASK ASSIGNMENT RESPONSE ===");
      console.log("Response:", response);
      return response;
    }).catch(error => {
      console.error("=== TASK ASSIGNMENT ERROR ===");
      console.error("Error:", error);
      throw error;
    });
  },

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