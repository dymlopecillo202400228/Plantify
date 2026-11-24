import express from "express";

import {
  createCheckout
} from "../controllers/paymentController.js";

import {
  authenticateUser
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/checkout",
  authenticateUser,
  createCheckout
);

export default router;