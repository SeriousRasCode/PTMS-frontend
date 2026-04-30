// API Utility Functions for PTMS
// Backend API configuration

const API_BASE_URL = "http://localhost:3333/api"; // Direct connection to backend

// Helper function for API requests
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
) => {
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
      credentials: 'include', // Include credentials for CORS
    });

    const contentType = response.headers.get("content-type");

    let data;
    if (
      contentType &&
      contentType.includes("application/json")
    ) {
      data = await response.json();
    } else {
      const text = await response.text();
      
      // Check if it's an HTML error page
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        // Extract error message from HTML if possible
        const errorMatch = text.match(/<pre>(.*?)<\/pre>/s);
        const errorMessage = errorMatch ? errorMatch[1].replace(/&[#\w]+;/g, (match) => {
          const entities: { [key: string]: string } = {
            '&#39;': "'",
            '&quot;': '"',
            '&lt;': '<',
            '&gt;': '>',
            '&amp;': '&'
          };
          return entities[match] || match;
        }) : 'Server error occurred';
        
        console.error('HTML error response:', errorMessage);
        throw new Error(errorMessage);
      }
      
      console.error('Non-JSON response received:', text.substring(0, 200));
      throw new Error('Backend returned non-JSON response. Check console for details.');
    }

    // Only log errors, not successful requests
    if (!response.ok) {
      // Don't log 403 (permission) errors
      if (response.status !== 403) {
        console.error(`API ${options.method || "GET"} ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          data,
        });
      }
    }

    if (!response.ok) {
      // Handle specific error cases with user-friendly messages
      const errorMessage = data.message || data.error || response.statusText;
      
      // Forbidden/Permission errors
      if (response.status === 403) {
        throw new Error(errorMessage || 'You do not have permission to access this resource');
      }
      
      // Not found
      if (response.status === 404) {
        throw new Error(errorMessage || 'Resource not found');
      }
      
      // Server errors (500+)
      if (response.status >= 500) {
        throw new Error(`Server error: ${errorMessage}`);
      }
      
      // General error
      throw new Error(errorMessage || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error: any) {
    // Don't log 403/permission errors or server errors that are handled gracefully
    const isPermissionError = error.message?.includes('permission') || 
                              error.message?.includes('not allowed') ||
                              error.message?.includes('Forbidden');
    
    const isServerError = error.message?.includes('Server error');
    
    // Only log unexpected errors
    if (!isPermissionError && !isServerError) {
      console.error('API Request Error:', {
        endpoint,
        error: error.message,
        type: error.constructor.name,
      });
    }

    // If it's a CORS or network error
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error(
        `Cannot connect to backend at ${API_BASE_URL}. Please ensure your backend is running on http://localhost:3333`,
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

  getTeamMembers: (teamId: number) =>
    apiRequest(`/teams/${teamId}/members`),

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

// Phase APIs
export const phaseAPI = {
  createPhase: (data: {
    project_id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
  }) =>
    apiRequest("/phases", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getProjectPhases: (projectId: number) =>
    apiRequest(`/phases/${projectId}`),

  updatePhase: (
    phaseId: number,
    data: {
      name: string;
      description: string;
      start_date: string;
      end_date: string;
      status: string;
    },
  ) =>
    apiRequest(`/phases/${phaseId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deletePhase: (phaseId: number) =>
    apiRequest(`/phases/${phaseId}`, {
      method: "DELETE",
    }),
};

// Subtask APIs
export const subtaskAPI = {
  // Get subtasks by task_id - since backend doesn't have this endpoint,
  // we'll need to work around it or you need to add it to backend
  getSubtasksByTaskId: (taskId: number) => 
    apiRequest(`/subtasks/task/${taskId}`),

  createSubtask: (
    taskId: number,
    data: {
      task_id: number;
      title: string;
      description: string;
      start_date: string;
      due_date: string;
    },
  ) =>
    apiRequest(`/subtasks/create-subtask/${taskId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSubtask: (
    subtaskId: number,
    taskId: number,
    data: {
      title: string;
      description: string;
      start_date: string;
      due_date: string;
    },
  ) =>
    apiRequest(`/subtasks/update-subtask/${subtaskId}/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteSubtask: (subtaskId: number, taskId: number) =>
    apiRequest(`/subtasks/delete-subtask/${subtaskId}/${taskId}`, {
      method: "DELETE",
    }),

  updateSubtaskProgress: (
    subtaskId: number,
    data: {
      progress_percentage: number;
      status: string;
    },
  ) =>
    apiRequest(`/subtasks/subtask/progress/${subtaskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Subtask Assignment APIs
export const subtaskAssignmentAPI = {
  assignSubtask: (data: { subtask_id: number; user_id: number }) =>
    apiRequest("/subtask-assignments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getSubtaskAssignments: (subtaskId: number) =>
    apiRequest(`/subtask-assignments/${subtaskId}`),

  removeSubtaskAssignment: (subtaskId: number, userId: number) =>
    apiRequest(`/subtask-assignments/${subtaskId}/${userId}`, {
      method: "DELETE",
    }),

  getMySubtasks: (userId: number) =>
    apiRequest(`/subtask-assignments/my-subtask/${userId}`),
};

// Subtask Comment APIs
export const subtaskCommentAPI = {
  addSubtaskComment: (data: {
    subtask_id: number;
    user_id: number;
    comment: string;
  }) =>
    apiRequest("/subtask-comments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getSubtaskComments: (subtaskId: number) =>
    apiRequest(`/subtask-comments/${subtaskId}`),
};

// Attachment APIs
export const attachmentAPI = {
  uploadAttachment: (formData: FormData) => {
    const token = localStorage.getItem("authToken");
    return fetch(`${API_BASE_URL}/attachments/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
    }).then(async (res) => {
      const contentType = res.headers.get("content-type");
      const text = await res.text();
      
      // Check if it's an HTML error page
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        // Extract error message from HTML if possible
        const errorMatch = text.match(/<pre>(.*?)<\/pre>/s);
        let errorMessage = errorMatch ? errorMatch[1].replace(/&[#\w]+;/g, (match) => {
          const entities: { [key: string]: string } = {
            '&#39;': "'",
            '&quot;': '"',
            '&lt;': '<',
            '&gt;': '>',
            '&amp;': '&'
          };
          return entities[match] || match;
        }) : 'Server error occurred';
        
        console.error('Upload HTML error response:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // If response is empty or not JSON, handle it
      if (!text) {
        if (res.ok) {
          return { success: true };
        } else {
          throw new Error(`Upload failed: ${res.statusText}`);
        }
      }
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(text);
        if (!res.ok) {
          // Handle empty error strings from backend
          const errorMsg = (data.error && data.error.trim()) ||
                          (data.message && data.message.trim()) ||
                          res.statusText ||
                          'Upload failed - check backend logs for details';
          throw new Error(errorMsg);
        }
        return data;
      } catch (e) {
        // If it's not JSON but response was ok, return success
        if (res.ok) {
          return { success: true, message: text };
        } else {
          const errorText = text && text.trim() ? text : res.statusText || 'Upload failed';
          throw new Error(errorText);
        }
      }
    });
  },

  getAttachments: (id: number) => {
    // The backend returns attachments filtered by entity ID
    // It returns phase_id, project_id, task_id, or subtask_id
    return apiRequest(`/attachments/${id}`);
  },

  deleteAttachment: (attachmentId: number) =>
    apiRequest(`/attachments/${attachmentId}`, {
      method: "DELETE",
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
  phase: phaseAPI,
  subtask: subtaskAPI,
  subtaskAssignment: subtaskAssignmentAPI,
  subtaskComment: subtaskCommentAPI,
  attachment: attachmentAPI,
};
