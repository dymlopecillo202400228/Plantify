import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo
} from "react";

import api from "../ApiClient/api";

const AuthContext = createContext(null);

function extractToken(body) {
    const result = body?.data || body || {};

    return (
        result.session?.access_token ||
        result.token ||
        result.accessToken ||
        result.access_token ||
        body?.session?.access_token ||
        body?.token ||
        null
    );
}

function extractUser(body) {
    const result = body?.data || body || {};

    return result.user || body?.user || null;
}

function normalizeUser(account) {
    if (!account) return null;

    return {
        ...account,
        name:
            account.full_name ||
            account.name ||
            account.email ||
            "",
        role: account.role || "customer"
    };
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("plantify_token");
    localStorage.removeItem("plantify_user");
    localStorage.removeItem("plantify_session");
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const savedUser = localStorage.getItem("user");
            const token = localStorage.getItem("token");

            if (savedUser && token) {
                const account = JSON.parse(savedUser);

                if (account && typeof account === "object") {
                    setUser(normalizeUser(account));
                } else {
                    clearSession();
                }
            } else {
                clearSession();
            }
        } catch (error) {
            console.error("Session restoration error:", error);
            clearSession();
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (email, password) => {
        const response = await api.post("/auth/login", {
            email,
            password
        });

        const body = response.data;
        const token = extractToken(body);
        const account = extractUser(body);

        if (!token || !account) {
            throw new Error(
                "Invalid login response. Expected user and access token."
            );
        }

        const loggedUser = normalizeUser(account);

        clearSession();

        localStorage.setItem("token", token);

        localStorage.setItem(
            "user",
            JSON.stringify(loggedUser)
        );

        setUser(loggedUser);

        return loggedUser;
    }, []);

    const register = useCallback(
        async (name, email, password, phone = "") => {
            const response = await api.post("/auth/register", {
                name,
                full_name: name,
                email,
                password,
                phone
            });

            return response.data;
        },
        []
    );

    const logout = useCallback(() => {
        clearSession();
        setUser(null);
    }, []);

    useEffect(() => {
        const handleExpiredSession = () => {
            logout();
        };

        window.addEventListener(
            "plantify:session-expired",
            handleExpiredSession
        );

        return () => {
            window.removeEventListener(
                "plantify:session-expired",
                handleExpiredSession
            );
        };
    }, [logout]);

    const getAccessToken = useCallback(() => {
        return localStorage.getItem("token");
    }, []);

    const token = user ? getAccessToken() : null;

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            register,
            logout,
            token,
            session: token
                ? {
                    access_token: token,
                    user
                }
                : null,
            isAuthenticated: Boolean(user && token),
            isAdmin: user?.role === "admin",
            getAccessToken
        }),
        [
            user,
            loading,
            login,
            register,
            logout,
            token,
            getAccessToken
        ]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}

export default AuthContext;