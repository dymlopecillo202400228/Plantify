import { useEffect, useRef, useState } from "react";
import {User,Camera,Mail,Phone,MapPin,LockKeyhole,ShieldCheck, Eye,EyeOff,Save,CheckCircle,AlertCircle,LoaderCircle} from "lucide-react";
import api from "../ApiClient/api";
import "../Style/Settings.css";

export default function Settings() {
  const fileInput = useRef(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: "",
    address: "",
    city: "",
    province: "",
    postal_code: ""
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/profile");

      const data =
        response.data.profile ||
        response.data.data ||
        response.data;

      setProfile({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        avatar_url: data.avatar_url || "",
        address: data.address || "",
        city: data.city || "",
        province: data.province || "",
        postal_code: data.postal_code || ""
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!profile.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    try {
      setSaving(true);

      await api.put("/profile", {
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        province: profile.province,
        postal_code: profile.postal_code
      });

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be below 5MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("avatar", file);

      const response = await api.post(
        "/profile/avatar",
        formData
      );

      const avatarUrl =
        response.data.avatar_url ||
        response.data.data?.avatar_url ||
        response.data.profile?.avatar_url;

      if (avatarUrl) {
        setProfile((previous) => ({
          ...previous,
          avatar_url: avatarUrl
        }));
      } else {
        await loadProfile();
      }

      setMessage("Profile picture updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to upload profile picture."
      );
    } finally {
      setUploading(false);

      if (fileInput.current) {
        fileInput.current.value = "";
      }
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPassword((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const changePassword = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !password.currentPassword ||
      !password.newPassword ||
      !password.confirmPassword
    ) {
      setError("Please complete all password fields.");
      return;
    }

    if (password.newPassword.length < 8) {
      setError(
        "New password must contain at least 8 characters."
      );
      return;
    }

    if (
      password.newPassword !== password.confirmPassword
    ) {
      setError("New passwords do not match.");
      return;
    }

    if (
      password.currentPassword === password.newPassword
    ) {
      setError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setSaving(true);

      await api.put("/profile/change-password", {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
        confirmPassword: password.confirmPassword
      });

      setMessage("Password changed successfully.");

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to change password."
      );
    } finally {
      setSaving(false);
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setMessage("");
    setError("");
    setShowPassword(false);
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <LoaderCircle className="settings-spinner" />
        <p>Loading your account...</p>
      </div>
    );
  }

  return (
    <section className="settings-page">
      <div className="settings-container">

        <div className="settings-header">
          <span className="settings-eyebrow">
            <ShieldCheck size={16} />
            YOUR ACCOUNT
          </span>

          <h1>Account Settings</h1>

          <p>
            Manage your personal information,
            delivery address and account security.
          </p>
        </div>

        <div className="settings-layout">

          <aside className="settings-sidebar">

            <div className="settings-user">

              <div className="settings-avatar">

                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                  />
                ) : (
                  <User size={38} />
                )}

              </div>
              <h3>
                {profile.full_name || "Plantify Customer"}
              </h3>
              <p>{profile.email}</p>
            </div>
            <div className="settings-menu">
              <button
                className={
                  activeTab === "profile" ? "active" : ""
                }
                onClick={() => changeTab("profile")}
              >
                <User size={19} />
                My Profile
              </button>
              <button
                className={
                  activeTab === "address" ? "active" : ""
                }
                onClick={() => changeTab("address")}
              >
                <MapPin size={19} />
                Delivery Address
              </button>
              <button
                className={
                  activeTab === "password" ? "active" : ""
                }
                onClick={() => changeTab("password")}
              >
                <LockKeyhole size={19} />
                Change Password
              </button>

              <button
                className={
                  activeTab === "security" ? "active" : ""
                }
                onClick={() => changeTab("security")}
              >
                <ShieldCheck size={19} />
                Account Security
              </button>
            </div>
          </aside>
          <main className="settings-content">
            {message && (
              <div
                className="settings-success"
                role="status"
              >
                <CheckCircle size={19} />
                {message}
              </div>
            )}
            {error && (
              <div
                className="settings-error"
                role="alert"
              >
                <AlertCircle size={19} />
                {error}
              </div>
            )}

            {activeTab === "profile" && (
              <div className="settings-card">

                <div className="settings-card-header">
                  <User size={24} />

                  <div>
                    <h2>Personal Information</h2>
                    <p>Update your personal details.</p>
                  </div>
                </div>
                <div className="settings-photo-section">

                  <div className="settings-large-avatar">

                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                      />
                    ) : (
                      <User size={48} />
                    )}

                  </div>

                  <div>
                    <h3>Profile Picture</h3>
                    <p>
                      JPG, PNG or WEBP. Maximum 5MB.
                    </p>

                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={uploadAvatar}
                      hidden
                    />

                    <button
                      type="button"
                      className="settings-outline-button"
                      onClick={() => fileInput.current?.click()}
                      disabled={uploading}
                    >
                      <Camera size={17} />

                      {uploading
                        ? "Uploading..."
                        : "Change Photo"}
                    </button>
                  </div>

                </div>

                <form onSubmit={saveProfile}>

                  <div className="settings-form-grid">

                    <div className="settings-field">
                      <label htmlFor="full_name">
                        Full Name
                      </label>

                      <div className="settings-input">
                        <User size={18} />

                        <input
                          id="full_name"
                          type="text"
                          name="full_name"
                          value={profile.full_name}
                          onChange={handleProfileChange}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>

                    <div className="settings-field">
                      <label htmlFor="email">
                        Email Address
                      </label>

                      <div className="settings-input">
                        <Mail size={18} />

                        <input
                          id="email"
                          type="email"
                          value={profile.email}
                          readOnly
                        />
                      </div>

                      <small>
                        Your registered account email.
                      </small>
                    </div>

                    <div className="settings-field">
                      <label htmlFor="phone">
                        Phone Number
                      </label>

                      <div className="settings-input">
                        <Phone size={18} />

                        <input
                          id="phone"
                          type="tel"
                          name="phone"
                          value={profile.phone}
                          onChange={handleProfileChange}
                          placeholder="09XXXXXXXXX"
                        />
                      </div>
                    </div>

                  </div>

                  <div className="settings-actions">
                    <button
                      type="submit"
                      className="settings-save-button"
                      disabled={saving || uploading}
                    >
                      <Save size={18} />

                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>

                </form>

              </div>
            )}

            {activeTab === "address" && (
              <div className="settings-card">

                <div className="settings-card-header">
                  <MapPin size={24} />

                  <div>
                    <h2>Delivery Address</h2>

                    <p>
                      Manage your default shipping address.
                    </p>
                  </div>
                </div>

                <form onSubmit={saveProfile}>

                  <div className="settings-form-grid">

                    <div className="settings-field full-width">
                      <label htmlFor="address">
                        Complete Address
                      </label>

                      <textarea
                        id="address"
                        name="address"
                        value={profile.address}
                        onChange={handleProfileChange}
                        placeholder="House number, street and barangay"
                        rows={4}
                        required
                      />
                    </div>

                    <div className="settings-field">
                      <label htmlFor="city">City</label>

                      <input
                        id="city"
                        type="text"
                        name="city"
                        value={profile.city}
                        onChange={handleProfileChange}
                        placeholder="Enter city"
                        required
                      />
                    </div>

                    <div className="settings-field">
                      <label htmlFor="province">
                        Province
                      </label>

                      <input
                        id="province"
                        type="text"
                        name="province"
                        value={profile.province}
                        onChange={handleProfileChange}
                        placeholder="Enter province"
                        required
                      />
                    </div>

                    <div className="settings-field">
                      <label htmlFor="postal_code">
                        Postal Code
                      </label>

                      <input
                        id="postal_code"
                        type="text"
                        name="postal_code"
                        value={profile.postal_code}
                        onChange={handleProfileChange}
                        placeholder="9200"
                        inputMode="numeric"
                        required
                      />
                    </div>

                  </div>

                  <div className="settings-actions">
                    <button
                      type="submit"
                      className="settings-save-button"
                      disabled={saving}
                    >
                      <Save size={18} />

                      {saving
                        ? "Saving..."
                        : "Save Address"}
                    </button>
                  </div>

                </form>

              </div>
            )}

            {activeTab === "password" && (
              <div className="settings-card">

                <div className="settings-card-header">
                  <LockKeyhole size={24} />

                  <div>
                    <h2>Change Password</h2>

                    <p>
                      Keep your Plantify account secure.
                    </p>
                  </div>
                </div>

                <form onSubmit={changePassword}>

                  <div className="settings-password-form">

                    <div className="settings-field">

                      <label htmlFor="currentPassword">
                        Current Password
                      </label>

                      <div className="settings-input">
                        <LockKeyhole size={18} />

                        <input
                          id="currentPassword"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          name="currentPassword"
                          value={password.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                          autoComplete="current-password"
                          required
                        />

                        <button
                          type="button"
                          className="settings-eye"
                          aria-label={
                            showPassword
                              ? "Hide passwords"
                              : "Show passwords"
                          }
                          onClick={() =>
                            setShowPassword(!showPassword)
                          }
                        >
                          {showPassword
                            ? <EyeOff size={18} />
                            : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="settings-field">

                      <label htmlFor="newPassword">
                        New Password
                      </label>

                      <div className="settings-input">
                        <LockKeyhole size={18} />

                        <input
                          id="newPassword"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          name="newPassword"
                          value={password.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter new password"
                          autoComplete="new-password"
                          minLength={8}
                          required
                        />
                      </div>
                    </div>
                    <div className="settings-field">
                      <label htmlFor="confirmPassword">
                        Confirm New Password
                      </label>
                      <div className="settings-input">
                        <LockKeyhole size={18} />

                        <input
                          id="confirmPassword"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          name="confirmPassword"
                          value={password.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Confirm new password"
                          autoComplete="new-password"
                          required
                        />
                      </div>
                    </div>
                    <div className="settings-password-note">
                      <ShieldCheck size={22} />
                      <div>
                        <strong>Password Requirements</strong>
                        <p>
                          Use at least 8 characters and choose
                          a password you do not use on other
                          websites.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="settings-actions">
                    <button
                      type="submit"
                      className="settings-save-button"
                      disabled={saving}
                    >
                      <LockKeyhole size={18} />

                      {saving
                        ? "Updating..."
                        : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "security" && (
              <div className="settings-card">
                <div className="settings-card-header">
                  <ShieldCheck size={24} />
                  <div>
                    <h2>Account Security</h2>
                    <p>
                      Manage your account protection.
                    </p>
                  </div>
                </div>
                <div className="settings-security-item">
                  <div className="settings-security-icon">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3>Registered Email</h3>
                    <p>{profile.email}</p>
                  </div>
                </div>
                <div className="settings-security-item">

                  <div className="settings-security-icon">
                    <LockKeyhole size={24} />
                  </div>
                  <div>
                    <h3>Account Password</h3>
                    <p>Update your login credentials.</p>
                  </div>
                  <button
                    className="settings-outline-button"
                    onClick={() => changeTab("password")}
                  >
                    Change
                  </button>
                </div>
                <div className="settings-password-note">
                  <ShieldCheck size={24} />
                  <div>
                    <strong>Security Reminder</strong>
                    <p>
                      Never share your password or payment
                      information with anyone.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}