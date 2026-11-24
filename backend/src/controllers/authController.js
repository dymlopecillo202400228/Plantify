import { supabase, supabaseAuth } from "../config/Supabase.js";
export const register = async (req, res) => {
    try {
        const { fullName, full_name, email, password, phone } = req.body;

        const name = (fullName || full_name || "").trim();

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const { data, error } = await supabaseAuth.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
                data: {
                    full_name: name,
                    phone: phone || null
                }
            }
        });

        if (error) throw error;

        if (!data.user) {
            return res.status(400).json({
                success: false,
                message: "Supabase did not return a user."
            });
        }

        const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
                id: data.user.id,
                full_name: name,
                email: normalizedEmail,
                phone: phone || null
            }, {
                onConflict: "id"
            });

        if (profileError) {
            console.error("PROFILE CREATION ERROR:", profileError);

            return res.status(500).json({
                success: false,
                message: "Account created, but profile could not be saved."
            });
        }

        return res.status(201).json({
            success: true,
            message: data.session
                ? "Registration successful."
                : "Registration successful. Please verify your email.",
            user: data.user,
            session: data.session
        });

    } catch (error) {
        console.error("REGISTRATION ERROR:", error);

        return res.status(400).json({
            success: false,
            message: error.message || "Registration failed."
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const { data, error } =
            await supabaseAuth.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            });

        if (error) throw error;

        if (!data.user || !data.session) {
            return res.status(401).json({
                success: false,
                message: "Login could not be completed."
            });
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, email, phone, role")
            .eq("id", data.user.id)
            .maybeSingle();

        if (profileError) {
            console.error("PROFILE ERROR:", profileError);

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve account profile."
            });
        }

        if (!profile) {
            return res.status(403).json({
                success: false,
                message: "Account profile not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: {
                id: data.user.id,
                email: data.user.email,
                full_name: profile.full_name,
                phone: profile.phone,
                role: profile.role
            },
            session: data.session
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(401).json({
            success: false,
            message: error.message || "Login failed."
        });
    }
};

export const logout = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: "Logout successful."
        });

    } catch (error) {
        console.error("LOGOUT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Logout failed."
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            profile: data
        });

    } catch (error) {
        console.error("GET PROFILE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Unable to retrieve profile."
        });
    }
};
