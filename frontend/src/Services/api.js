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
        let token = localStorage.getItem("plantify_token");

        if (!token) {
            try {
                const session = JSON.parse(
                    localStorage.getItem("plantify_session") || "null"
                );

                token = session?.access_token;
            } catch {
                token = null;
            }
        }

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
        if (error.code === "ECONNABORTED") {
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