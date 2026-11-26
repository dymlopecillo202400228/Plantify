import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Leaf,UserRound,Mail,LockKeyhole,Eye,EyeOff,ArrowRight,CheckCircle2,AlertCircle,ShieldCheck} from "lucide-react";
import api from "../ApiClient/api";
import "../Style/Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordValid = form.password.length >= 8;
  const passwordsMatch =
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!fullName || !email || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        fullName,
        full_name: fullName,
        email,
        password
      });

      const result = response.data?.data || response.data;

      if (
        response.data?.success === false ||
        result?.success === false
      ) {
        throw new Error(
          result.message || "Registration failed."
        );
      }

      setMessage(
        "Account created successfully! Please sign in to continue."
      );

      setForm({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: ""
      });

      const needsVerification =
        result?.user?.identities?.length === 0 ||
        (result?.user && !result.user.email_confirmed_at &&
          !result?.session);

      if (!needsVerification) {
        navigate("/login", {
          replace: true,
          state: {
            message: "Registration successful. Please log in."
          }
        });
      } else {
        setMessage(
          "Account created. Check your email for a verification link, then log in."
        );
      }

    } catch (err) {
      console.error("REGISTER ERROR:", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="plantify-register-page">
      <div className="register-layout">

        <div className="register-intro">
          <div className="register-intro-badge">
            <Leaf size={17} />
            YOUR GREEN JOURNEY STARTS HERE
          </div>

          <h1>
            Grow something
            <br />
            <em>beautiful.</em>
          </h1>

          <p>
            Join Plantify and discover plants,
            fresh seeds, and gardening essentials
            for your perfect green space.
          </p>

          <div className="register-benefits">
            <div>
              <CheckCircle2 size={20} />
              Explore our plant collection
            </div>

            <div>
              <CheckCircle2 size={20} />
              Save your favorite gardening finds
            </div>

            <div>
              <CheckCircle2 size={20} />
              Shop with secure Maya checkout
            </div>
          </div>

          <div className="register-intro-decoration">
            <Leaf size={115} strokeWidth={1.1} />
          </div>
        </div>

        <div className="register-card">
          <div className="register-card-heading">
            <div className="register-icon">
              <Leaf size={28} />
            </div>

            <span className="register-eyebrow">
              JOIN THE PLANTIFY FAMILY
            </span>

            <h2>Create an Account</h2>

            <p>
              Fill in your details to start
              your green journey.
            </p>
          </div>

          {error && (
            <div className="register-alert error" role="alert">
              <AlertCircle size={19} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="register-alert success" role="status">
              <CheckCircle2 size={19} />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="register-field">
              <label htmlFor="fullName">
                Full Name
              </label>

              <div className="register-input">
                <UserRound size={19} />

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="email">
                Email Address
              </label>

              <div className="register-input">
                <Mail size={19} />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="register-input">
                <LockKeyhole size={19} />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="register-eye"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword
                    ? <EyeOff size={19} />
                    : <Eye size={19} />
                  }
                </button>
              </div>

              <p
                className={
                  "register-hint " +
                  (passwordValid ? "valid" : "")
                }
              >
                <CheckCircle2 size={14} />
                At least 8 characters
              </p>
            </div>

            <div className="register-field">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="register-input">
                <LockKeyhole size={19} />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="register-eye"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation"
                      : "Show confirmation"
                  }
                >
                  {showConfirmPassword
                    ? <EyeOff size={19} />
                    : <Eye size={19} />
                  }
                </button>
              </div>

              {form.confirmPassword && (
                <p
                  className={
                    "register-hint " +
                    (passwordsMatch
                      ? "valid"
                      : "invalid")
                  }
                >
                  <CheckCircle2 size={14} />
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}

              {!loading && <ArrowRight size={19} />}
            </button>

          </form>

          <div className="register-signin">
            Already have an account?{" "}
            <Link to="/login">
              Sign In
            </Link>
          </div>

          <div className="register-security">
            <ShieldCheck size={17} />
            Your account information is protected.
          </div>
        </div>
      </div>
    </main>
  );
}