import { supabase } from "../config/Supabase.js";


const validQuantity = (quantity) => {
  const number = Number(quantity);

  return Number.isInteger(number) && number > 0;
};

const handleError = (res, error, operation) => {
  console.error(`${operation} error:`, error);

  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error.",
  });
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        product_id,
        quantity,
        products (
          id,
          name,
          price,
          stock,
          image_url
        )
      `)
      .eq("user_id", userId);

    if (error) throw error;

    const items = (data || []).map((item) => {
      const product = item.products;
      const quantity = Number(item.quantity);
      const price = Number(product?.price || 0);

      return {
        id: item.id,
        product_id: item.product_id,
        quantity,
        product,
        subtotal: Number(
          (price * quantity).toFixed(2)
        ),
      };
    });

    const total = Number(
      items
        .reduce(
          (sum, item) => sum + item.subtotal,
          0
        )
        .toFixed(2)
    );

    return res.status(200).json({
      success: true,
      items,
      total,
      count: items.length,
    });
  } catch (error) {
    return handleError(res, error, "Get cart");
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id || !validQuantity(quantity)) {
      return res.status(422).json({
        success: false,
        message: "Valid product and quantity required.",
      });
    }

    const qty = Number(quantity);

    const { data: product, error: productError } =
      await supabase
        .from("products")
        .select("id, name, price, stock")
        .eq("id", product_id)
        .maybeSingle();

    if (productError) throw productError;

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const { data: existing, error: existingError } =
      await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", userId)
        .eq("product_id", product_id)
        .maybeSingle();

    if (existingError) throw existingError;

    const newQuantity =
      Number(existing?.quantity || 0) + qty;

    if (newQuantity > Number(product.stock)) {
      return res.status(409).json({
        success: false,
        message: "Not enough stock available.",
      });
    }

    let result;

    if (existing) {
      result = await supabase
        .from("cart_items")
        .update({
          quantity: newQuantity,
        })
        .eq("id", existing.id)
        .eq("user_id", userId)
        .select()
        .single();
    } else {
      result = await supabase
        .from("cart_items")
        .insert({
          user_id: userId,
          product_id,
          quantity: qty,
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return res.status(200).json({
      success: true,
      message: `${product.name} added to cart successfully.`,
      item: result.data,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Cart changed. Please try again.",
      });
    }

    return handleError(res, error, "Add to cart");
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!validQuantity(quantity)) {
      return res.status(422).json({
        success: false,
        message: "Quantity must be at least 1.",
      });
    }

    const qty = Number(quantity);

    const { data: item, error: itemError } =
      await supabase
        .from("cart_items")
        .select("id, product_id")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

    if (itemError) throw itemError;

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    const { data: product, error: productError } =
      await supabase
        .from("products")
        .select("id, stock")
        .eq("id", item.product_id)
        .maybeSingle();

    if (productError) throw productError;

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product no longer exists.",
      });
    }

    if (qty > Number(product.stock)) {
      return res.status(409).json({
        success: false,
        message: "Not enough stock available.",
      });
    }
    const { data, error } = await supabase
      .from("cart_items")
      .update({
        quantity: qty,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully.",
      item: data,
    });
  } catch (error) {
    return handleError(res, error, "Update cart");
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product removed from cart successfully.",
    });
  } catch (error) {
    return handleError(res, error, "Remove cart");
  }
};
