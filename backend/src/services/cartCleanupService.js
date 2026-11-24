import { supabase } from "../config/Supabase.js";

export const clearPurchasedCart = async (orderId) => {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  console.log("STARTING CART CLEANUP:", orderId);

  const { data: order, error: orderError } =
    await supabase
      .from("orders")
      .select("id, user_id, status, payment_status")
      .eq("id", orderId)
      .single();

  if (orderError) {
    throw orderError;
  }

  if (order.payment_status !== "paid") {
    throw new Error("Payment has not been confirmed.");
  }

  const { error } = await supabase.rpc(
    "clear_paid_order_cart",
    {
      p_order_id: orderId
    }
  );

  if (error) {
    console.error("CART CLEANUP ERROR:", error.message);
    throw error;
  }

  console.log("============================");
  console.log("CART CLEANUP SUCCESSFUL");
  console.log("ORDER ID:", orderId);
  console.log("============================");

  return true;
};