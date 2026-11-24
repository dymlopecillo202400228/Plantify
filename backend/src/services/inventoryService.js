import { supabase } from "Supabase.js";

export const releaseReservations = async (orderId) => {
    const { error } = await supabase
        .from("stock_reservations")
        .update({
            status: "released"
        })
        .eq("order_id", orderId)
        .eq("status", "reserved");

    if (error) throw error;
};

export const commitReservations = async (orderId) => {
    const { error } = await supabase
        .from("stock_reservations")
        .update({
            status: "committed"
        })
        .eq("order_id", orderId)
        .eq("status", "reserved");

    if (error) throw error;
};