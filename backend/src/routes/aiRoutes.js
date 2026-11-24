import express from "express";
import rateLimit from "express-rate-limit";

import { chat} from "../controllers/aiController.js";

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,

  max: 5,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many messages. Please try again in a minute."
  }
});

router.post(
  "/chat",
  aiLimiter,
  chat
);

export default router;