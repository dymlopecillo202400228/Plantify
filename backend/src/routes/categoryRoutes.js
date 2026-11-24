import express from "express";
import { supabase } from "../config/Supabase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, description")
      .order("name", { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      categories: data || []
    });

  } catch (error) {
    console.error("CATEGORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load categories."
    });
  }
});

export default router;
