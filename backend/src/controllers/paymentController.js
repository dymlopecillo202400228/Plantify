import { randomUUID } from "node:crypto";
import { supabase } from "../config/Supabase.js";
import { requestMayaCheckout } from "../services/mayaService.js";

export const createCheckout = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in before checkout."
      });
    }

    const customer =
      req.body.customer ||
      req.body.shipping ||
      req.body;

    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "address",
      "city",
      "province",
      "postalCode"
    ];

    for (const field of requiredFields) {
      if (
        typeof customer?.[field] !== "string" ||
        !customer[field].trim()
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} is required.`
        });
      }
    }


    const deliveryAddress = [
      customer.address,
      customer.city,
      customer.province,
      customer.postalCode
    ]
      .map(value => value.trim())
      .filter(Boolean)
      .join(", ");

    const {
      data: cartItems,
      error: cartError
    } = await supabase
      .from("cart_items")
      .select("product_id, quantity")
      .eq("user_id", userId);

    if (cartError) {
      console.error("CART ERROR:", cartError.message);
      throw cartError;
    }

    if (!cartItems?.length) {
      return res.status(400).json({
        success: false,
        message: "Your shopping cart is empty."
      });
    }

    const quantities = new Map();

    for (const item of cartItems) {
      const quantity = Number(item.quantity);

      if (
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(422).json({
          success: false,
          message: "Invalid cart quantity."
        });
      }

      const productId = String(item.product_id);

      quantities.set(
        productId,
        (quantities.get(productId) || 0) + quantity
      );
    }

    const {
      data: products,
      error: productError
    } = await supabase
      .from("products")
      .select("id, name, price, stock")
      .in("id", [...quantities.keys()]);

    if (productError) {
      console.error(
        "PRODUCT ERROR:",
        productError.message
      );

      throw productError;
    }

    if (
      !products ||
      products.length !== quantities.size
    ) {
      return res.status(404).json({
        success: false,
        message: "One or more products were not found."
      });
    }

    const checkoutItems = [];

    let totalCents = 0;

    for (const product of products) {
      const quantity = quantities.get(
        String(product.id)
      );

      if (Number(product.stock) < quantity) {
        return res.status(409).json({
          success: false,
          message:
            `Insufficient stock for ${product.name}.`
        });
      }

      const priceCents = Math.round(
        Number(product.price) * 100
      );

      if (
        !Number.isSafeInteger(priceCents) ||
        priceCents < 0
      ) {
        throw new Error(
          `Invalid price for ${product.name}.`
        );
      }

      const subtotalCents =
        priceCents * quantity;

      totalCents += subtotalCents;

      checkoutItems.push({
        product_id: product.id,
        name: product.name,
        price: priceCents / 100,
        quantity: quantity,
        subtotal: subtotalCents / 100
      });
    }

    if (
      !Number.isSafeInteger(totalCents) ||
      totalCents <= 0
    ) {
      return res.status(422).json({
        success: false,
        message: "Invalid checkout amount."
      });
    }

    const total = totalCents / 100;
    const orderId = randomUUID();

    const {
      data: savedOrder,
      error: orderError
    } = await supabase
      .from("orders")
      .insert({
        id: orderId,
        user_id: userId,
        customer_name: customer.fullName.trim(),
        customer_email: customer.email.trim(),
        customer_phone: customer.phone.trim(),
        delivery_address: deliveryAddress,
        shipping_address: customer.address.trim(),
        city: customer.city.trim(),
        province: customer.province.trim(),
        postal_code: customer.postalCode.trim(),
        total_amount: total,
        status: "pending_payment",
        payment_status: "pending",
        shipping_details: customer,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error("SAVE ORDER ERROR:", {
        code: orderError.code,
        message: orderError.message
      });

      throw orderError;
    }

    console.log("==============================");
    console.log("ORDER SAVED:", orderId);
    console.log("TOTAL:", total);
    console.log("==============================");

    const orderItems = checkoutItems.map(item => ({
      order_id: orderId,

      product_id: item.product_id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("SAVE ORDER ITEMS ERROR:", {
        code: itemsError.code,
        message: itemsError.message
      });

      // No Maya checkout has been created yet.
      const { error: cleanupError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId)
        .eq("user_id", userId)
        .eq("status", "pending_payment");

      if (cleanupError) {
        console.error(
          "ORDER CLEANUP ERROR:",
          cleanupError.message
        );
      }

      throw itemsError;
    }

    console.log("==============================");
    console.log("ORDER ITEMS SAVED");
    console.log("ITEM COUNT:", orderItems.length);
    console.log("==============================");

    const result = await requestMayaCheckout(
      total,
      orderId,
      customer,
      checkoutItems
    );

    if (!result?.checkoutUrl || !result?.checkoutId) {
      throw new Error(
        "Maya did not return a valid checkout session."
      );
    }

    console.log("==============================");
    console.log("MAYA CHECKOUT CREATED");
    console.log("ORDER ID:", orderId);
    console.log("CHECKOUT ID:", result.checkoutId);
    console.log("==============================");

    const {
      data: savedPayment,
      error: paymentError
    } = await supabase
      .from("payments")
      .insert({
        id: randomUUID(),

        order_id: orderId,

        provider: "maya",

        provider_checkout_id: result.checkoutId,

        amount: total,

        currency: "PHP",

        status: "pending"
      })
      .select()
      .single();

    if (paymentError) {
      console.error("SAVE PAYMENT ERROR:", {
        code: paymentError.code,
        message: paymentError.message,
        orderId: orderId,
        checkoutId: result.checkoutId
      });

      throw paymentError;
    }

    console.log("==============================");
    console.log("PAYMENT RECORD SAVED");
    console.log("PAYMENT ID:", savedPayment.id);
    console.log("AMOUNT:", total);
    console.log("==============================");

    const purchasedProductIds = checkoutItems.map(
      item => item.product_id
    );

    const {
      error: clearCartError
    } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId)
      .in("product_id", purchasedProductIds);

    if (clearCartError) {
      console.error("CLEAR CART ERROR:", {
        code: clearCartError.code,
        message: clearCartError.message
      });
    } else {
      console.log("==============================");
      console.log("CART CLEARED SUCCESSFULLY");
      console.log("USER ID:", userId);
      console.log("==============================");
    }

    return res.status(200).json({
      success: true,

      message: clearCartError
        ? "Checkout created, but cart cleanup failed."
        : "Checkout created and cart cleared.",

      cart_cleared: !clearCartError,

      order_id: orderId,

      payment_id: savedPayment.id,

      checkout_id: result.checkoutId,

      checkoutUrl: result.checkoutUrl,

      checkout_url: result.checkoutUrl,

      total: total,

      items: checkoutItems,

      order: {
        id: savedOrder.id,
        status: savedOrder.status,
        total_amount: savedOrder.total_amount
      }
    });

  } catch (error) {
    console.error("==============================");

    console.error("CHECKOUT ERROR:", {
      code: error.code,
      message: error.message,
      status: error.response?.status
    });

    console.error("==============================");

    return res.status(
      error.response?.status === 503 ? 503 : 500
    ).json({
      success: false,
      message: "Unable to complete checkout."
    });
  }
};