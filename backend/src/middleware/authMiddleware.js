import { supabase, supabaseAuth,} from "../config/Supabase.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const authorization =
      req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please log in before checkout.",
      });
    }

    const token = authorization
      .slice(7)
      .trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    const { data, error } =
      await supabaseAuth.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message:
          "Your session has expired. Please log in again.",
      });
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("id", data.user.id)
        .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      full_name: profile?.full_name || "",
      role: profile?.role || "customer",
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

export const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Please log in first.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Administrator only.",
    });
  }

  next();
};
