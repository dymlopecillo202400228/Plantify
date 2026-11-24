import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Leaf,Mail,Lock,Eye,EyeOff,LogIn,ArrowRight,CheckCircle2} from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import "../Style/Login.css";

export default function Login() {
  const navigate = useNavigate();

  const {
    login,
    isAuthenticated,
    user,
    loading
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      navigate(
        user.role === "admin" ? "/admin" : "/products",
        { replace: true }
      );
    }
  }, [loading, isAuthenticated, user, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setSubmitting(true);

      const loggedUser = await login(
        email.trim(),
        password
      );

      navigate(
        loggedUser.role === "admin"
          ? "/admin"
          : "/products",
        { replace: true }
      );
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to log in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="plantify-login-loading">
        <Leaf size={32} />
        <p>Loading your account...</p>
      </div>
    );
  }

  return (
    <main className="plantify-login-page">
      <div className="plantify-login-layout">

        <section className="plantify-login-welcome">
          <div className="plantify-login-welcome-inner">

            <div className="plantify-login-eyebrow">
              <Leaf size={17} />
              YOUR GREEN JOURNEY CONTINUES HERE
            </div>

            <h1>
              Welcome
              <br />
              <em>back.</em>
            </h1>

            <p className="plantify-login-description">
              Sign in to Plantify and continue discovering
              beautiful plants, fresh seeds, and gardening
              essentials for your perfect green space.
            </p>

            <div className="plantify-login-benefits">
              <div>
                <CheckCircle2 size={20} />
                <span>Explore our plant collection</span>
              </div>

              <div>
                <CheckCircle2 size={20} />
                <span>Manage your favorite gardening finds</span>
              </div>

              <div>
                <CheckCircle2 size={20} />
                <span>Track orders with secure Maya checkout</span>
              </div>
            </div>

            <div className="plantify-login-leaf-art">
              <Leaf size={100} strokeWidth={1.3} />
            </div>

          </div>
        </section>

        <section className="plantify-login-form-side">
          <div className="plantify-login-card">

            <div className="plantify-login-header">
              <div className="plantify-login-icon">
                <Leaf size={29} />
              </div>

              <p className="plantify-login-small-label">
                WELCOME TO PLANTIFY
              </p>

              <h2>Sign In</h2>

              <p>
                Enter your account details to continue
                your green journey.
              </p>
            </div>

            <form onSubmit={handleLogin}>

              {error && (
                <div
                  className="plantify-login-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="plantify-login-field">
                <label htmlFor="login-email">
                  Email Address
                </label>

                <div className="plantify-login-input">
                  <Mail size={19} />

                  <input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="plantify-login-field">
                <label htmlFor="login-password">
                  Password
                </label>

                <div className="plantify-login-input">
                  <Lock size={19} />

                  <input
                    id="login-password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="plantify-password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="plantify-login-submit"
                disabled={submitting}
              >
                <LogIn size={19} />

                {submitting
                  ? "Signing in..."
                  : "Sign In"}

                {!submitting && (
                  <ArrowRight size={19} />
                )}
              </button>
            </form>

            <div className="plantify-login-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/register">
                  Create an account
                </Link>
              </p>

              <Link
                to="/products"
                className="plantify-back-shop"
              >
                Continue Shopping
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="plantify-login-security">
              <Lock size={14} />
              Your account is protected with secure login
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}