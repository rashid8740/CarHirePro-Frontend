import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";

// Base URL: DEV = localhost, PROD = VITE_API_URL from environment
const baseURL: string = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : (import.meta.env.VITE_API_URL as string);

// Create Axios instance
export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor: attach token if exists
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401, 403, and network errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (!error.response) {
      console.error("Network error:", error.message);
      alert("Cannot connect to the server. Please try again later.");
    } else {
      const status = error.response.status;
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("car-hire-token");
        localStorage.removeItem("car-hire-user");
        window.location.href = "/";
      } else if (status === 403) {
        console.warn("Access denied: insufficient permissions");
        alert("Access denied: insufficient permissions");
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to set or remove auth token
export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem("token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;
  }
}
