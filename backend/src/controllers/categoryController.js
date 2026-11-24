import { supabase } from "../config/Supabase.js";

export const getCategories = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("products")
            .select("category")
            .eq("is_active", true);

        if (error) throw error;

        const categories = [
            ...new Set(
                data
                    .map((item) => item.category)
                    .filter(Boolean)
            )
        ].sort();

        res.status(200).json({
            success: true,
            categories
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("category", category)
            .eq("is_active", true)
            .order("name", { ascending: true });

        if (error) throw error;

        res.status(200).json({
            success: true,
            category,
            products: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
