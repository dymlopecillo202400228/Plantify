import express from "express";
import { supabase } from "../config/Supabase.js";
import {authenticateUser,authorizeAdmin} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateUser, authorizeAdmin);

const handleError = (res, error, message) => {
  console.error(message, error);

  return res.status(500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production"
      ? { details: error.message }
      : {})
  });
};

router.get("/dashboard", async (req, res) => {
  try {
    const [products, orders, customers] =
      await Promise.all([
        supabase
          .from("products")
          .select("*"),

        supabase
          .from("orders")
          .select("*"),

        supabase
          .from("profiles")
          .select("*")
          .eq("role", "customer")
      ]);

    if (products.error) {
      return handleError(
        res,
        products.error,
        "Unable to load products."
      );
    }

    if (orders.error) {
      return handleError(
        res,
        orders.error,
        "Unable to load orders."
      );
    }

    if (customers.error) {
      return handleError(
        res,
        customers.error,
        "Unable to load customers."
      );
    }

    const productList = products.data || [];
    const orderList = orders.data || [];
    const customerList = customers.data || [];

    const paidOrders = orderList.filter(
      (order) =>
        order.payment_status === "paid" ||
        order.status === "paid"
    );

    const totalSales = paidOrders.reduce(
      (total, order) =>
        total +
        Number(
          order.total_amount ??
          order.total ??
          0
        ),
      0
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalProducts: productList.length,
        totalOrders: orderList.length,
        totalCustomers: customerList.length,
        totalSales
      }
    });

  } catch (error) {
    return handleError(
      res,
      error,
      "Unable to load dashboard statistics."
    );
  }
});

router.get("/orders", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      return handleError(
        res,
        error,
        "Unable to load orders."
      );
    }

    return res.status(200).json({
      success: true,
      orders: data || []
    });

  } catch (error) {
    return handleError(
      res,
      error,
      "Unable to load orders."
    );
  }
});

router.get("/customers", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "customer");

    if (error) {
      return handleError(
        res,
        error,
        "Unable to load customers."
      );
    }

    const customers = (data || []).map(
      (customer) => ({
        id: customer.id,
        full_name: customer.full_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        role: customer.role
      })
    );

    return res.status(200).json({
      success: true,
      customers
    });

  } catch (error) {
    return handleError(
      res,
      error,
      "Unable to load customers."
    );
  }
});

export default router;
