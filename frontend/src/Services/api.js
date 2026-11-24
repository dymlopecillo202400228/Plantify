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
        let token =
            localStorage.getItem("plantify_token") ||
            localStorage.getItem("token");

        if (!token) {
            try {
                const session = JSON.parse(
                    localStorage.getItem("plantify_session") || "null"
                );

                token = session?.access_token ||
                    session?.session?.access_token;
            } catch {
                token = null;
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;