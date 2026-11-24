import React from "react";import {BrowserRouter,Routes,Route,Navigate,useLocation} from "react-router-dom";
import {AuthProvider,useAuth} from "./Context/AuthContext";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import AIAssistant from "./Components/AIAssistant";
import Home from "./Pages/Home";
import Products from "./Pages/Products";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Cart from "./Pages/Cart";
import Checkout from "./Pages/Checkout";
import MyOrders from "./Pages/MyOrders";
import PaymentSuccess from "./Pages/PaymentSuccess";
import Settings from "./Pages/Settings";
import AdminDashboard from "./Pages/AdminDashboard";
import "./index.css";

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f8f3",
        color: "#216b45",
        fontSize: "18px",
        fontWeight: "600"
      }}
    >
      Loading Plantify...
    </div>
  );
}

function ProtectedRoute({
  children,
  adminOnly = false
}) {
  const { user, loading } = useAuth();

  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return (
      <Navigate
        to={
          user.role === "admin"
            ? "/admin"
            : "/products"
        }
        replace
      />
    );
  }

  return children;
}

function AppLayout() {
  const location = useLocation();

  const isAdminPage =
    location.pathname.startsWith("/admin");

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register";

  const hideNavbar = isAdminPage;

  const hideFooter =
    isAdminPage || isAuthPage;

  const hideAssistant =
    isAdminPage || isAuthPage;

  return (
    <div
      className="app-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {!hideNavbar && <Navbar />}

      <main
        className="app-main"
        style={{ flex: 1 }}
      >
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/shop"
            element={<Products />}
          />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment-success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment-failed"
            element={
              <ProtectedRoute>
                <Navigate
                  to="/orders"
                  replace
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment-cancelled"
            element={
              <ProtectedRoute>
                <Navigate
                  to="/orders"
                  replace
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </main>

      {!hideAssistant && <AIAssistant />}

      {!hideFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}