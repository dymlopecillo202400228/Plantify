import express from "express";

import {getCart,addToCart,updateCartItem, removeCartItem,} from "../controllers/cartController.js";

import {authenticateUser,} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateUser, getCart);
router.post("/", authenticateUser, addToCart);
router.put("/:id", authenticateUser, updateCartItem);
router.delete("/:id", authenticateUser, removeCartItem);

export default router;