import { useEffect, useState } from "react";
import axios from "axios";
import "../Style/Customer.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  password: ""
};

export default function Customer() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function getToken() {
    const storedSession = localStorage.getItem(
      "plantify_session"
    );

    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        return session.access_token || "";
      } catch {
        return "";
      }
    }

    return "";
  }

  function getHeaders() {
    const token = getToken();

    return {
      headers: {
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {})
      }
    };
  }

  async function fetchCustomers() {
    setLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/admin/customers`,
        getHeaders()
      );

      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error("CUSTOMER ERROR:", err);

      setError(
        err.response?.data?.message ||
        "Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(customer) {
    setEditingId(customer.id);

    setForm({
      full_name: customer.full_name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      password: ""
    });

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim()
      };

      if (editingId) {
        await axios.put(
          `${API_URL}/admin/customers/${editingId}`,
          payload,
          getHeaders()
        );

        setSuccess("Customer updated successfully!");
      } else {
        await axios.post(
          `${API_URL}/admin/customers`,
          {
            ...payload,
            password: form.password
          },
          getHeaders()
        );

        setSuccess("Customer added successfully!");
      }

      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);

      await fetchCustomers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to save customer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customer) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.full_name}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await axios.delete(
        `${API_URL}/admin/customers/${customer.id}`,
        getHeaders()
      );

      setSuccess("Customer deleted successfully!");

      await fetchCustomers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete customer."
      );
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const keyword = search.toLowerCase();

    return (
      customer.full_name?.toLowerCase().includes(keyword) ||
      customer.email?.toLowerCase().includes(keyword) ||
      customer.phone?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <h1>Manage Customers</h1>

          <p>
            Manage registered Plantify customer accounts.
          </p>
        </div>

        <button
          className="customer-add-btn"
          onClick={openAdd}
        >
          + Add Customer
        </button>
      </div>

      {success && (
        <div className="customer-success">
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="customer-error">
          {error}
        </div>
      )}

      <div className="customer-table-card">
        <div className="customer-table-header">
          <h2>
            Registered Customers ({customers.length})
          </h2>

          <input
            type="search"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="customer-table-wrapper">
          <table className="customer-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.full_name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone || "N/A"}</td>

                    <td>
                      <span className="customer-role">
                        {customer.role}
                      </span>
                    </td>

                    <td>
                      <div className="customer-actions">
                        <button
                          className="customer-edit-btn"
                          onClick={() => openEdit(customer)}
                        >
                          Edit
                        </button>

                        <button
                          className="customer-delete-btn"
                          onClick={() => handleDelete(customer)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="customer-modal-overlay">
          <div
            className="customer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-form-title"
          >
            <div className="customer-modal-header">
              <h2 id="customer-form-title">
                {editingId
                  ? "Edit Customer"
                  : "Add Customer"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="customer-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label>Full Name</label>

              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
              />

              <label>Email Address</label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />

              {!editingId && (
                <>
                  <label>Password</label>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    minLength={8}
                    required
                  />
                </>
              )}

              <div className="customer-modal-actions">
                <button
                  type="button"
                  className="customer-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="customer-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Customer"
                      : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}