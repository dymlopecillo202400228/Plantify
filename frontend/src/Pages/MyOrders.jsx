import {useState,useEffect, useCallback} from "react";
import { Link } from "react-router-dom";
import {Package,RefreshCw,ShoppingBag,CalendarDays,CreditCard,AlertCircle,ArrowRight} from "lucide-react";
import api from "../Services/api";
import { useAuth } from "../Context/AuthContext";
import "../Style/MyOrders.css";

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();

  const userId = user?.id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get("/orders");

      const body = response.data;
      const result = body?.data ?? body;

      const list = Array.isArray(result)
        ? result
        : result?.orders;

      if (!Array.isArray(list)) {
        throw new Error("Invalid orders response.");
      }

      setOrders(list);

    } catch (err) {
      console.error("MY ORDERS ERROR:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load orders."
      );

    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading) {
      fetchOrders();
    }
  }, [authLoading, fetchOrders]);

  const formatPrice = amount =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP"
    }).format(Number(amount) || 0);

  const formatDate = date =>
    date
      ? new Date(date).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })
      : "Date unavailable";

  const statusClass = status => {
    switch (status) {
      case "paid":
      case "delivered":
        return "status-success";

      case "processing":
      case "shipped":
        return "status-info";

      case "cancelled":
      case "failed":
      case "expired":
        return "status-danger";

      default:
        return "status-pending";
    }
  };

  return (
    <main className="myorders-page">
      <div className="myorders-container">

        <div className="myorders-header">
          <div>
            <p className="myorders-eyebrow">
              YOUR ACCOUNT / ORDER HISTORY
            </p>

            <h1>My Orders</h1>

            <p className="myorders-description">
              View and track all your Plantify
              purchases in one place.
            </p>
          </div>

          <button
            className="myorders-refresh"
            onClick={fetchOrders}
            disabled={loading || authLoading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="myorders-error" role="alert">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {(loading || authLoading) && (
          <div className="myorders-empty">
            <RefreshCw size={36} />
            <h2>Loading orders...</h2>
            <p>Please wait.</p>
          </div>
        )}

        {!loading &&
          !authLoading &&
          !error &&
          orders.length === 0 && (
            <div className="myorders-empty">

              <div className="myorders-empty-icon">
                <Package size={43} />
              </div>

              <h2>No orders yet</h2>

              <p>
                Your plant collection is waiting to grow!
                Start shopping to place your first order.
              </p>

              <Link
                to="/products"
                className="myorders-shop-button"
              >
                <ShoppingBag size={18} />
                Explore Plants
                <ArrowRight size={18} />
              </Link>

            </div>
          )}

        {!loading &&
          !authLoading &&
          !error &&
          orders.length > 0 && (
            <div className="myorders-list">

              {orders.map(order => {
                const status =
                  order.status || "pending_payment";

                const isPaid =
                  order.payment_status === "paid" ||
                  [
                    "paid",
                    "processing",
                    "shipped",
                    "delivered"
                  ].includes(status);

                return (
                  <article
                    className="myorders-card"
                    key={order.id}
                  >

                    <div className="myorders-card-top">
                      <div>
                        <span className="myorders-order-label">
                          ORDER NUMBER
                        </span>

                        <h3>
                          #{String(order.id)
                            .slice(0, 8)
                            .toUpperCase()}
                        </h3>
                      </div>

                      <span
                        className={
                          "myorders-status " +
                          statusClass(status)
                        }
                      >
                        {status
                          .replaceAll("_", " ")
                          .toUpperCase()}
                      </span>
                    </div>

                    <div className="myorders-products">

                      {(order.order_items || []).map(item => (
                        <div
                          className="myorders-product"
                          key={item.id || item.product_id}
                        >

                          {item.products?.image_url ? (
                            <img
                              src={item.products.image_url}
                              alt={
                                item.products?.name ||
                                "Product"
                              }
                            />
                          ) : (
                            <div className="myorders-product-placeholder">
                              <Package size={28} />
                            </div>
                          )}

                          <div className="myorders-product-info">

                            <strong>
                              {item.products?.name ||
                                "Product"}
                            </strong>

                            <p>
                              Quantity: {item.quantity}
                            </p>

                            <p>
                              {formatPrice(item.unit_price)}
                              {" "}each
                            </p>

                          </div>

                          <strong>
                            {formatPrice(
                              Number(item.unit_price) *
                              Number(item.quantity)
                            )}
                          </strong>

                        </div>
                      ))}

                    </div>

                    <div className="myorders-card-details">

                      <div className="myorders-detail">
                        <CalendarDays size={19} />

                        <div>
                          <small>Order Date</small>

                          <strong>
                            {formatDate(order.created_at)}
                          </strong>
                        </div>
                      </div>

                      <div className="myorders-detail">
                        <CreditCard size={19} />

                        <div>
                          <small>Payment Method</small>
                          <strong>Maya Payment</strong>

                          <small>
                            {isPaid
                              ? "Payment confirmed"
                              : "Payment not confirmed"}
                          </small>
                        </div>
                      </div>

                      <div className="myorders-total">
                        <small>Total Amount</small>

                        <strong>
                          {formatPrice(
                            order.total_amount ??
                            order.total
                          )}
                        </strong>
                      </div>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

      </div>
    </main>
  );
}