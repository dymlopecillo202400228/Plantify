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
import aiRoutes from "./src/routes/aiRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5175",
    process.env.FRONTEND_URL
]
    .filter(Boolean)
    .map((url) => url.trim().replace(/\/+$/, ""));

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));
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

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Plantify API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/customers", customerRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/profile", profileRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

app.use((err, req, res, next) => {
    console.error(err.message);

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "Origin not allowed"
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Plantify API running on port ${PORT}`);
});