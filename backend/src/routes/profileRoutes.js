import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";

import {
  getProfile,
  updateProfile,
  updateAddress,
  uploadAvatar,
  changePassword
} from "../controllers/profileController.js";

import {
  authenticateUser
} from "../middleware/authMiddleware.js";

const router = express.Router();


const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error("Only JPG, PNG and WEBP are allowed.")
    );
  }
});


const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 5,

  message: {
    success: false,
    message: "Too many password attempts. Please try again later."
  }
});

router.use(authenticateUser);
router.get("/", getProfile);
router.put("/", updateProfile);
router.put("/update", updateProfile);
router.put("/address", updateAddress);


router.post(
  "/avatar",
  upload.single("avatar"),
  uploadAvatar
);

router.put(
  "/change-password",
  passwordLimiter,
  changePassword
);

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  return res.status(400).json({
    success: false,
    message: "Invalid upload or request."
  });
});

export default router;