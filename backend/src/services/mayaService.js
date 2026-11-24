import axios from "axios";

const MAYA_BASE_URL = (
  process.env.MAYA_BASE_URL ||
  "https://pg-sandbox.paymaya.com"
).replace(/\/+$/, "");

const FRONTEND_URL = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
).replace(/\/+$/, "");


function getAuthorization(key) {
  if (!key || !key.trim()) {
    throw new Error(
      "Missing Maya API key. Check backend/.env"
    );
  }

  return (
    "Basic " +
    Buffer.from(`${key.trim()}:`).toString("base64")
  );
}

function handleMayaError(error) {
  const status = error.response?.status;
  const details = error.response?.data;

  console.error("MAYA API ERROR:", {
    status,
    code: error.code,
    details:
      typeof details === "string"
        ? details.slice(0, 500)
        : details || error.message,
  });

  if (status === 401 || status === 403) {
    throw new Error(
      "Maya rejected your API credentials. " +
      "Check your sandbox public key."
    );
  }

  if (status === 400 || status === 422) {
    throw new Error(
      (typeof details === "object" &&
        details?.message) ||
      "Maya rejected the checkout information. " +
      "Check the payment request."
    );
  }

  if ([502, 503, 504].includes(status)) {
    throw new Error(
      "Maya payment service is temporarily unavailable."
    );
  }

  if (status === 429) {
    throw new Error(
      "Too many requests to Maya. Try again later."
    );
  }

  if (error.code === "ECONNABORTED") {
    throw new Error(
      "Maya request timed out. Please try again."
    );
  }

  if (error.code === "ENOTFOUND") {
    throw new Error(
      "Cannot reach Maya API. Check your connection."
    );
  }

  throw new Error(
    (typeof details === "object" &&
      details?.message) ||
    error.message ||
    "Unable to connect to Maya."
  );
}

export async function createMayaCheckout(payload) {
  const publicKey =
    process.env.MAYA_PUBLIC_KEY?.trim();

  if (!publicKey) {
    throw new Error(
      "MAYA_PUBLIC_KEY is missing in backend/.env"
    );
  }

  const endpoint =
    `${MAYA_BASE_URL}/checkout/v1/checkouts`;

  try {
    const response = await axios.post(
      endpoint,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthorization(publicKey),
        },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("MAYA CHECKOUT ERROR:", {
      status: error.response?.status,
      response: error.response?.data,
      message: error.message,
    });

    handleMayaError(error);
  }
}

export async function requestMayaCheckout(
  total,
  orderId,
  customer,
  items
) {
  if (
    !customer ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new Error("Invalid checkout information.");
  }

  const amount = Number(total);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid checkout amount.");
  }

  const fullName = String(
    customer.fullName || ""
  ).trim();

  if (!fullName) {
    throw new Error("Customer full name is required.");
  }

  const nameParts = fullName.split(/\s+/);

  const firstName = nameParts[0];
  const lastName =
    nameParts.slice(1).join(" ") || firstName;

  const address = {
    line1: String(customer.address || "").trim(),
    city: String(customer.city || "").trim(),
    state: String(customer.province || "").trim(),
    zipCode: String(customer.postalCode || "").trim(),
    countryCode: "PH",
  };

  const checkoutItems = items.map((item) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(
        `Invalid price or quantity for ${item.name}.`
      );
    }

    return {
      name: String(item.name),
      code: String(item.product_id),
      quantity,

      amount: {
        value: Number(price.toFixed(2)),
      },

      totalAmount: {
        value: Number(
          (price * quantity).toFixed(2)
        ),
      },
    };
  });

  const itemTotalCents = checkoutItems.reduce(
    (sum, item) =>
      sum +
      Math.round(item.totalAmount.value * 100),
    0
  );

  if (itemTotalCents !== Math.round(amount * 100)) {
    throw new Error(
      "Checkout total does not match product totals."
    );
  }

  const payload = {
    totalAmount: {
      value: Number(amount.toFixed(2)),
      currency: "PHP",
    },

    buyer: {
      firstName,
      lastName,

      contact: {
        phone: String(customer.phone || "").trim(),
        email: String(customer.email || "").trim(),
      },

      shippingAddress: { ...address },
      billingAddress: { ...address },
    },

    items: checkoutItems,

    redirectUrl: {
      success: `${FRONTEND_URL}/payment/success`,
      failure: `${FRONTEND_URL}/payment/failed`,
      cancel: `${FRONTEND_URL}/cart`,
    },

    requestReferenceNumber: String(orderId),
  };

  console.log("Preparing Maya checkout:", {
    orderId,
    itemCount: checkoutItems.length,
    total: payload.totalAmount.value,
  });

  const result = await createMayaCheckout(payload);

  const checkoutUrl =
    result.redirectUrl || result.checkoutUrl;

  if (
    typeof checkoutUrl !== "string" ||
    !checkoutUrl.startsWith("https://")
  ) {
    throw new Error(
      "Maya did not return a valid checkout URL."
    );
  }

  return {
    checkoutId: result.checkoutId || result.id,
    checkoutUrl,
  };
}

export async function getMayaPayment(paymentId) {
  const secretKey =
    process.env.MAYA_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error(
      "MAYA_SECRET_KEY is missing in backend/.env"
    );
  }

  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  const endpoint =
    `${MAYA_BASE_URL}/payments/v1/payments/` +
    encodeURIComponent(paymentId);

  try {
    const response = await axios.get(
      endpoint,
      {
        headers: {
          Accept: "application/json",
          Authorization: getAuthorization(secretKey),
        },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("MAYA PAYMENT ERROR:", {
      status: error.response?.status,
      response: error.response?.data,
      message: error.message,
    });

    handleMayaError(error);
  }
}
