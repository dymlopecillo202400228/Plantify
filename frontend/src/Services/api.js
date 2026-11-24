
import axios from "axios";

const baseURL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add the login token to every protected API request.
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("plantify_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
