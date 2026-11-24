import axios from "axios";

const backendURL = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api"
).trim().replace(/\/+$/, "");

const baseURL = backendURL.endsWith("/api")
    ? backendURL
    : `${backendURL}/api`;

const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json"
    },
    timeout: 60000
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("plantify_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;