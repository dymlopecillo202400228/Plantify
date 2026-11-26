import axios from "axios";

const API_URL = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api"
).trim().replace(/\/+$/, "");

const api = axios.create({
    baseURL: API_URL.endsWith("/api")
        ? API_URL
        : `${API_URL}/api`,

    timeout: 90000,

    headers: {
        "Content-Type": "application/json"
    }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || "";

        const isAuthRequest =
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/register");

        const requestToken =
            error.config?.headers?.Authorization;

        const currentToken =
            localStorage.getItem("token");

        if (
            status === 401 &&
            !isAuthRequest &&
            currentToken &&
            requestToken === `Bearer ${currentToken}`
        ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("plantify_token");
            localStorage.removeItem("plantify_user");
            localStorage.removeItem("plantify_session");

            window.dispatchEvent(
                new Event("plantify:session-expired")
            );
        }

        if (
            error.code === "ECONNABORTED" ||
            error.code === "ETIMEDOUT"
        ) {
            console.error("API request timed out.");
        } else {
            console.error(
                "API ERROR:",
                error.response?.data?.message ||
                error.message
            );
        }

        return Promise.reject(error);
    }
);

export default api;