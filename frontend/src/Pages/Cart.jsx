import {useState,useEffect,useCallback, useMemo} from "react";
import { Link, useNavigate } from "react-router-dom";
import {Leaf,ArrowLeft,ArrowRight,Plus,Minus,Trash2,ShieldCheck,ShoppingCart,AlertCircle,Loader2, Package} from "lucide-react";
import api from "../ApiClient/api";
import "../Style/Cart.css";

const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount || 0));
};

const extractItems = (body) => {
  const data = body?.data ?? body;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.cart?.items)) return data.cart.items;
  if (Array.isArray(body?.items)) return body.items;

  return [];
};

const normalizeItem = (item) => {
  const product = item.product || item.products || {};

  return {
    id: item.id,
    product_id: item.product_id || product.id,
    name: product.name || item.name || "Product",
    image_url: product.image_url || item.image_url || "",
    price: Number(product.price ?? item.price ?? 0),
    quantity: Number(item.quantity || 1),
    stock: Number(product.stock ?? item.stock ?? 0)
  };
};

function Cart() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const loadCart = useCallback(async () => {
    try {
      const response = await api.get("/cart");

      const cartItems = extractItems(response.data);

      setItems(cartItems.map(normalizeItem));
      setError("");
    } catch (err) {
      console.error("LOAD CART ERROR:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load your shopping cart."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();

    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener(
      "plantify:cart-updated",
      handleCartUpdate
    );

    return () => {
      window.removeEventListener(
        "plantify:cart-updated",
        handleCartUpdate
      );
    };
  }, [loadCart]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0
    );
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [items]);

  const updateQuantity = async (item, quantity) => {
    if (quantity < 1) return;

    if (item.stock > 0 && quantity > item.stock) {
      setError("Not enough stock available.");
      return;
    }

    if (!item.id) {
      setError("Cart item ID is missing.");
      return;
    }

    setUpdatingId(item.id);
    setError("");

    try {
      await api.put(
        `/cart/${encodeURIComponent(item.id)}`,
        { quantity }
      );

      await loadCart();

    } catch (err) {
      console.error("UPDATE QUANTITY ERROR:", err);

      setError(
        err.response?.data?.message ||
        "Unable to update quantity."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (item) => {
    if (!item.id) {
      setError("Cart item ID is missing.");
      return;
    }

    setUpdatingId(item.id);
    setError("");

    try {
      await api.delete(
        `/cart/${encodeURIComponent(item.id)}`
      );

      await loadCart();

    } catch (err) {
      console.error("REMOVE ITEM ERROR:", err);

      setError(
        err.response?.data?.message ||
        "Unable to remove product."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    navigate("/checkout");
  };

  if (loading) {
    return (
      <main className="plantify-cart">
        <div className="cart-loading">
          <Loader2 size={36} />
          <p>Loading your shopping cart...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="plantify-cart">
      <div className="cart-container">

        <div className="cart-header">
          <span className="cart-eyebrow">
            <Leaf size={16} />
            YOUR GREEN COLLECTION
          </span>

          <h1>Shopping Cart</h1>

          <p>
            Review your selected plants and gardening essentials.
          </p>
        </div>

        {error && (
          <div className="cart-alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={55} />

            <h3>Your cart is empty</h3>

            <p>
              Discover beautiful plants and gardening essentials
              for your home.
            </p>

            <Link to="/products" className="cart-shop-btn">
              Continue Shopping
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="cart-layout">

            <section className="cart-products">

              <div className="cart-section-heading">
                <h2>My Cart</h2>

                <span>
                  {totalQuantity}{" "}
                  {totalQuantity === 1 ? "Item" : "Items"}
                </span>
              </div>

              <div className="cart-items">
                {items.map((item) => {
                  const isUpdating = updatingId === item.id;

                  return (
                    <div
                      className="cart-item"
                      key={item.id || item.product_id}
                    >

                      <div className="cart-item-image">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                          />
                        ) : (
                          <span style={{ fontSize: "45px" }}>
                            ðŸŒ±
                          </span>
                        )}
                      </div>

                      <div className="cart-item-details">
                        <h3>{item.name}</h3>

                        <p>
                          {formatPrice(item.price)} each
                        </p>

                        <div className="cart-quantity">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item,
                                item.quantity - 1
                              )
                            }
                            disabled={
                              isUpdating ||
                              item.quantity <= 1
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} />
                          </button>

                          <span>{item.quantity}</span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item,
                                item.quantity + 1
                              )
                            }
                            disabled={
                              isUpdating ||
                              (item.stock > 0 &&
                                item.quantity >= item.stock)
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-actions">
                        <strong>
                          {formatPrice(
                            item.price * item.quantity
                          )}
                        </strong>

                        <button
                          type="button"
                          className="cart-remove"
                          onClick={() => removeItem(item)}
                          disabled={isUpdating}
                        >
                          <Trash2 size={15} />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link
                to="/products"
                className="cart-continue"
              >
                <ArrowLeft size={17} />
                Continue Shopping
              </Link>
            </section>

            <aside className="cart-summary">
              <h2>Order Summary</h2>

              <div className="cart-summary-line">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <div className="cart-summary-line">
                <span>Products</span>
                <strong>{totalQuantity}</strong>
              </div>

              <div className="cart-summary-total">
                <strong>Total</strong>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <button
                type="button"
                className="cart-checkout-btn"
                onClick={handleCheckout}
              >
                Proceed to Checkout
                <ArrowRight size={18} />
              </button>

              <p className="cart-secure">
                <ShieldCheck size={16} />
                Secure checkout with Maya
              </p>

              <p className="cart-total-note">
                Final prices are verified by the backend
                during checkout.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default Cart;