import { supabase } from "../config/Supabase.js";

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in."
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false
      });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      orders: data || []
    });

  } catch (error) {
    console.error("GET ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your orders."
    });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in."
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    return res.status(200).json({
      success: true,
      order: data
    });

  } catch (error) {
    console.error("GET ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve order."
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in."
      });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    if (order.status !== "pending_payment") {
      return res.status(409).json({
        success: false,
        message: "Only unpaid orders can be cancelled."
      });
    }

    return res.status(409).json({
      success: false,
      message: "Payment cancellation requires verification."
    });

  } catch (error) {
    console.error("CANCEL ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel order."
    });
  }
};