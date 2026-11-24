import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {CheckCircle,Clock,Package} from "lucide-react";
import api from "../Services/api";

export default function PaymentSuccess() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const orderId = sessionStorage.getItem(
      "plantify_last_order_id"
    );

    const checkOrder = async () => {
      if (!orderId) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await api.get(
          `/orders/${encodeURIComponent(orderId)}`
        );

        const result =
          response.data?.order ||
          response.data?.data?.order;

        if (active) {
          setOrder(result);
          setError("");
        }

      } catch (err) {
        if (active) {
          setError("Unable to retrieve payment status.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    checkOrder();

    const interval = setInterval(checkOrder, 5000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 60000);

    return () => {
      active = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const paid =
    order?.payment_status === "paid" ||
    [
      "paid",
      "processing",
      "shipped",
      "delivered"
    ].includes(order?.status);

  return (
    <main
      style={{
        minHeight: "80vh",
        background: "#f4f8f3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "25px"
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "22px",
          padding: "45px",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
          border: "1px solid #dfe9df"
        }}
      >

        {paid ? (
          <CheckCircle size={75} color="#216943" />
        ) : (
          <Clock size={75} color="#ca8a04" />
        )}

        <h1 style={{ color: "#174b35" }}>
          {loading
            ? "Checking Payment..."
            : paid
            ? "Payment Successful!"
            : "Payment Confirmation Pending"}
        </h1>

        <p style={{ color: "#82988a", lineHeight: 1.8 }}>
          {paid
            ? "Thank you for shopping with Plantify. Your payment has been confirmed."
            : "We are waiting for verified payment confirmation. You can check your order status in My Orders."}
        </p>

        {error && (
          <p style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}

        {order && (
          <p>
            Order #{String(order.id).slice(0, 8)}
          </p>
        )}

        <Link
          to="/orders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: "#216943",
            color: "white",
            padding: "15px 25px",
            borderRadius: "10px",
            textDecoration: "none",
            marginTop: "20px"
          }}
        >
          <Package size={20} />
          View My Orders
        </Link>

      </div>
    </main>
  );
}