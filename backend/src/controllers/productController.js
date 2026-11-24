import { supabase } from "../config/Supabase.js";

const validCategoryId = (id) => {
  return (
    id !== undefined &&
    id !== null &&
    id !== "" &&
    Number.isSafeInteger(Number(id)) &&
    Number(id) > 0
  );
};

const validPrice = (price) => {
  return (
    price !== undefined &&
    price !== null &&
    price !== "" &&
    Number.isFinite(Number(price)) &&
    Number(price) >= 0
  );
};

const validStock = (stock) => {
  return (
    stock !== undefined &&
    stock !== null &&
    stock !== "" &&
    Number.isSafeInteger(Number(stock)) &&
    Number(stock) >= 0
  );
};

// Handle database errors
const handleError = (res, error) => {
  console.error("PRODUCT ERROR:", error);

  if (error.code === "23503") {
    return res.status(422).json({
      success: false,
      message: "Invalid category or database reference."
    });
  }

  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Product already exists."
    });
  }

  if (error.code === "23502") {
    return res.status(422).json({
      success: false,
      message:
        "A required database field is missing: " +
        error.message
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Database error."
  });
};

export const getProducts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", {
        ascending: false
      });

    if (error) {
      return handleError(res, error);
    }

    return res.status(200).json({
      success: true,
      products: data || []
    });

  } catch (error) {
    return handleError(res, error);
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return handleError(res, error);
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    return res.status(200).json({
      success: true,
      product: data
    });

  } catch (error) {
    return handleError(res, error);
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      price,
      stock,
      image_url
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !validCategoryId(category_id) ||
      !validPrice(price) ||
      !validStock(stock)
    ) {
      return res.status(422).json({
        success: false,
        message:
          "Name, category, price, and stock are required."
      });
    }

    const { data: category, error: categoryError } =
      await supabase
        .from("categories")
        .select("id, name")
        .eq("id", Number(category_id))
        .maybeSingle();

    if (categoryError) {
      return handleError(res, categoryError);
    }

    if (!category) {
      return res.status(422).json({
        success: false,
        message: "Selected category does not exist."
      });
    }

    const productData = {
      name: name.trim(),

      description:
        typeof description === "string"
          ? description.trim()
          : "",

      category_id: Number(category.id),

      category: category.name,
      price: Number(price),
      stock: Number(stock),

      image_url:
        typeof image_url === "string"
          ? image_url.trim() || null
          : null,

      is_active: true
    };

    const { data, error } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (error) {
      return handleError(res, error);
    }

    return res.status(201).json({
      success: true,
      message: "Product added successfully!",
      product: data
    });

  } catch (error) {
    return handleError(res, error);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      category_id,
      price,
      stock,
      image_url,
      is_active
    } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(422).json({
          success: false,
          message: "Valid product name is required."
        });
      }

      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description =
        typeof description === "string"
          ? description.trim()
          : "";
    }

    if (category_id !== undefined) {
      if (!validCategoryId(category_id)) {
        return res.status(422).json({
          success: false,
          message: "Invalid category ID."
        });
      }

      const { data: category, error: categoryError } =
        await supabase
          .from("categories")
          .select("id, name")
          .eq("id", Number(category_id))
          .maybeSingle();

      if (categoryError) {
        return handleError(res, categoryError);
      }

      if (!category) {
        return res.status(422).json({
          success: false,
          message: "Category not found."
        });
      }

      updates.category_id = Number(category.id);

      updates.category = category.name;
    }

    if (price !== undefined) {
      if (!validPrice(price)) {
        return res.status(422).json({
          success: false,
          message: "Invalid product price."
        });
      }

      updates.price = Number(price);
    }

    if (stock !== undefined) {
      if (!validStock(stock)) {
        return res.status(422).json({
          success: false,
          message: "Invalid stock quantity."
        });
      }

      updates.stock = Number(stock);
    }

    if (image_url !== undefined) {
      updates.image_url =
        typeof image_url === "string"
          ? image_url.trim() || null
          : null;
    }

    if (is_active !== undefined) {
      if (typeof is_active !== "boolean") {
        return res.status(422).json({
          success: false,
          message: "is_active must be true or false."
        });
      }

      updates.is_active = is_active;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(422).json({
        success: false,
        message: "No valid fields provided."
      });
    }

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return handleError(res, error);
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      product: data
    });

  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("products")
      .update({
        is_active: false
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return handleError(res, error);
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully!",
      product: data
    });

  } catch (error) {
    return handleError(res, error);
  }
};
