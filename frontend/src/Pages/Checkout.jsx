import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  ShoppingBag,
  CreditCard,
  Package,
  ShieldCheck
} from "lucide-react";
import api from "../ApiClient/api";
import "../Style/Checkout.css";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postalCode: ""
};

export default function Checkout() {
  const [form, setForm] = useState(initialForm);

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadCart = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/cart");
        const result = response.data;

        const items = Array.isArray(result?.items)
          ? result.items
          : Array.isArray(result?.data?.items)
          ? result.data.items
          : Array.isArray(result)
          ? result
          : [];

        if (active) {
          setCartItems(items);
        }
      } catch (err) {
        console.error(
          "Cart loading error:",
          err.response?.data || err
        );

        if (active) {
          setError(
            err.response?.data?.message ||
            "Unable to load your cart. Please check your login session."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCart();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setError("");
  };

  const getProduct = (item) => {
    return item.product || item.products || item;
  };

  const getPrice = (item) => {
    const product = getProduct(item);
    return Number(product?.price || 0);
  };

  const getQuantity = (item) => {
    return Number(item.quantity || 0);
  };

  const total = cartItems.reduce((sum, item) => {
    return (
      sum +
      getPrice(item) * getQuantity(item)
    );
  }, 0);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (processing || loading) return;

    if (cartItems.length === 0) {
      setError(
        "Your cart is empty. Please add products first."
      );
      return;
    }

    const customer = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      province: form.province.trim(),
      postalCode: form.postalCode.trim()
    };

    for (const [field, value] of Object.entries(
      customer
    )) {
      if (!value) {
        setError(`${field} is required.`);
        return;
      }
    }

    const items = cartItems.map((item) => {
      const product = getProduct(item);

      return {
        product_id:
          item.product_id || product?.id,
        quantity: getQuantity(item)
      };
    });

    if (
      items.some(
        (item) =>
          !item.product_id ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      setError(
        "Your cart contains invalid products."
      );
      return;
    }

    try {
      setProcessing(true);
      setError("");

      const response = await api.post(
        "/payments/checkout",
        {
          customer,
          items
        }
      );

      console.log(
        "Maya checkout response:",
        response.data
      );

      const checkoutUrl =
        response.data?.checkout_url ||
        response.data?.checkoutUrl ||
        response.data?.data?.checkout_url ||
        response.data?.data?.checkoutUrl;

      if (
        typeof checkoutUrl !== "string" ||
        !checkoutUrl.startsWith("https://")
      ) {
        throw new Error(
          "Maya checkout URL was not returned by the backend."
        );
      }

      window.location.assign(checkoutUrl);
    } catch (err) {
      console.error(
        "Maya checkout error:",
        err.response?.data || err
      );

      const status = err.response?.status;

      if (status === 401) {
        setError(
          "Your login session has expired or is not being sent. Please log in again."
        );
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to continue to Maya Payment."
        );
      }
    } finally {
      setProcessing(false);
    }
  };

  const fields = [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      placeholder: "Enter your full name",
      autoComplete: "name"
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "example@email.com",
      autoComplete: "email"
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      placeholder: "09XXXXXXXXX",
      autoComplete: "tel"
    },
    {
      name: "address",
      label: "Complete Address",
      type: "text",
      placeholder: "House, Street, Barangay",
      autoComplete: "street-address"
    },
    {
      name: "city",
      label: "City",
      type: "text",
      placeholder: "Enter city",
      autoComplete: "address-level2"
    },
    {
      name: "province",
      label: "Province",
      type: "text",
      placeholder: "Enter province",
      autoComplete: "address-level1"
    },
    {
      name: "postalCode",
      label: "Postal Code",
      type: "text",
      placeholder: "9200",
      autoComplete: "postal-code"
    }
  ];

  return (
    <main className="checkout-page">
      <div className="checkout-container">

        <Link
          to="/cart"
          className="checkout-back"
        >
          <ArrowLeft size={19} />
          Back to Cart
        </Link>

        <div className="checkout-heading">
          <h1>Secure Checkout</h1>

          <p>
            Complete your shipping details to
            continue to Maya Payment.
          </p>
        </div>

        <form
          onSubmit={handleCheckout}
          className="checkout-layout"
        >

          <section className="checkout-card">
            <h2>
              <MapPin size={25} />
              Shipping Information
            </h2>

            <div className="checkout-fields">
              {fields.map((field) => (
                <div
                  className="checkout-field"
                  key={field.name}
                >
                  <label htmlFor={field.name}>
                    {field.label}
                  </label>

                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    value={form[field.name]}
                    onChange={handleChange}
                    required
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="checkout-card checkout-summary">
            <h2>
              <ShoppingBag size={25} />
              Order Summary
            </h2>

            {loading ? (
              <p>Loading your cart...</p>
            ) : cartItems.length === 0 ? (
              <div className="checkout-empty">
                <Package size={36} />

                <p>Your cart is empty.</p>

                <Link to="/products">
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="checkout-items">
                {cartItems.map((item, index) => {
                  const product = getProduct(item);

                  return (
                    <div
                      className="checkout-item"
                      key={item.id || index}
                    >
                      <div>
                        <strong>
                          {product?.name ||
                            "Product"}
                        </strong>

                        <p>
                          Quantity:{" "}
                          {getQuantity(item)}
                        </p>
                      </div>

                      <strong>
                        {formatPrice(
                          getPrice(item) *
                          getQuantity(item)
                        )}
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="checkout-total">
              <span>Estimated Total</span>

              <strong>
                {formatPrice(total)}
              </strong>
            </div>

            <p className="checkout-total-note">
              The backend will verify the final
              amount using current product prices.
            </p>

            <div className="checkout-payment-info">
              <CreditCard size={24} />

              <div>
                <strong>Maya Payment</strong>

                <p>
                  Continue to Maya's secure
                  payment page.
                </p>
              </div>
            </div>

            {error && (
              <div
                className="checkout-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="checkout-submit"
              disabled={
                processing ||
                loading ||
                cartItems.length === 0
              }
            >
              {processing
                ? "Connecting to Maya..."
                : "Continue to Maya Payment"}

              <ArrowRight size={20} />
            </button>

            <p className="checkout-secure-note">
              <ShieldCheck size={16} />
              Secure payment powered by Maya
            </p>

          </section>
        </form>
      </div>
    </main>
  );
}