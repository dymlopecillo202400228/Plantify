import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./src/routes/authRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import cartRoutes from "./src/routes/cartRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import customerRoutes from "./src/routes/customerRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";

dotenv.config();

const app = express();

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://plantify-poj1.vercel.app",
    process.env.FRONTEND_URL
]
    .filter(Boolean)
    .map((origin) => origin.trim().replace(/\/+$/, ""));

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Origin not allowed by CORS.")
            );
        },
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Idempotency-Key"
        ],
        credentials: true
    })
);

app.use(express.json({ limit: "1mb" }));

app.use(
    express.urlencoded({
        extended: true
    })
);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Plantify API is running"
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Plantify backend is healthy",
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/customers", customerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/profile", profileRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found",
        path: req.originalUrl,
        method: req.method
    });
});

app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err.message);

    if (res.headersSent) {
        return next(err);
    }

    if (err.message === "Origin not allowed by CORS.") {
        return res.status(403).json({
            success: false,
            message: "Origin not allowed by CORS."
        });
    }

    const status = err.status || err.statusCode || 500;

    res.status(status).json({
        success: false,
        message:
            status >= 500
                ? "Internal server error."
                : err.message
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Plantify API running on port ${PORT}`);
});