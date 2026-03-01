// API Utility Functions for PTMS Mobile
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API configuration
// IMPORTANT: This URL is for Android emulator to access localhost.
// You might need to change this to your computer's IP address if you are running on a physical device.
const API_BASE_URL = "http://10.0.2.2:3000/api";

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = await AsyncStorage.getItem("authToken");
  
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
      if (response.status !== 403 && !data.message?.includes('Forbidden')) {
        console.error("API Error:", data);
      } else {
        console.log("Permission denied (403):", data.message);
      }
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error: any) {
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
};

// User APIs
export const userAPI = {
  getProfile: () => apiRequest("/users/profile"),
  getMe: () => apiRequest("/users/me"),
};

// Project APIs
export const projectAPI = {
  getMyProjects: () => apiRequest("/projects/my-projects"),
};

// Task APIs
export const taskAPI = {
  getMyTasks: () => apiRequest("/tasks/my-tasks"),
  getTasksByProject: (projectId: number) =>
    apiRequest(`/tasks/projects/${projectId}`),
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
};

// Export all APIs
export const api = {
  auth: authAPI,
  user: userAPI,
  project: projectAPI,
  task: taskAPI,
};
