import express from "express";
import { getCustomers,createCustomer,updateCustomer,deleteCustomer} from "../controllers/customerController.js";
import {authenticateUser,authorizeAdmin} from "../middleware/authMiddleware.js";

const router = express.Router();

// Only authenticated administrators can access CRUD.
router.use(authenticateUser, authorizeAdmin);
router.get("/", getCustomers);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
