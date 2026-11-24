import { supabase } from "../config/Supabase.js";

export const getDashboard = async (req, res) => {
    try {
        const { count: totalProducts, error: productsError } =
            await supabase
                .from("products")
                .select("*", { count: "exact", head: true });

        if (productsError) throw productsError;
        const { count: totalOrders, error: ordersError } =
            await supabase
                .from("orders")
                .select("*", { count: "exact", head: true });

        if (ordersError) throw ordersError;

        const { count: totalCustomers, error: customersError } =
            await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .eq("role", "customer");

        if (customersError) throw customersError;

        const { data: sales, error: salesError } = await supabase
            .from("orders")
            .select("total_amount")
            .eq("status", "completed");

        if (salesError) throw salesError;

        const totalSales = (sales || []).reduce(
            (total, order) => total + Number(order.total_amount || 0),
            0
        );

        return res.status(200).json({
            success: true,
            dashboard: {
                totalProducts: totalProducts || 0,
                totalOrders: totalOrders || 0,
                totalCustomers: totalCustomers || 0,
                totalSales
            }
        });

    } catch (error) {
        console.error("ADMIN DASHBOARD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Unable to load admin dashboard."
        });
    }
};
