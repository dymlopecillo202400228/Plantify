import express from "express";

import {getMyOrders,getOrderById,cancelOrder} from "../controllers/orderController.js";

import {authenticateUser} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/", getMyOrders);

router.get("/:id", getOrderById);

router.patch("/:id/cancel", cancelOrder);

export default router;