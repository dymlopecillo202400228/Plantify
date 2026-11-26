import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function AdminProducts() {
  const initialForm = {
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    image_url: ""
  };

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); 

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  async function loadProducts() {
    try {
      const response = await api.get("/products");
      const data = response.data;

      setProducts(
        Array.isArray(data)
          ? data
          : data.products || data.data || []
      );
    } catch (err) {
      console.error("LOAD PRODUCTS ERROR:", err);
      setError("Unable to load products.");
    }
  }

  async function loadCategories() {
    try {
      const response = await api.get("/categories");
      const data = response.data;

      setCategories(
        Array.isArray(data)
          ? data
          : data.categories || data.data || []
      );
    } catch (err) {
      console.error("LOAD CATEGORIES ERROR:", err);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (
      !form.name.trim() ||
      form.price === "" ||
      form.stock === ""
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0 ||
      !Number.isInteger(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      setError("Enter a valid price and whole-number stock quantity.");
      return;
    }

    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      category_id: form.category_id || null,
      image_url: form.image_url.trim() || null
    };

    setLoading(true);

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, productData);
        setMessage("Product updated successfully!");
      } else {
        await api.post("/products", productData);
        setMessage("Product added successfully!");
      }

      setForm(initialForm);
      setEditingId(null);
      await loadProducts();

    } catch (err) {
      console.error("SAVE PRODUCT ERROR:", err);
      setError(
        err.response?.data?.message ||
        "Unable to save product. Check your admin permissions."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(product) {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? product.stock_quantity ?? ""),
      category_id: product.category_id || "",
      image_url: product.image_url || ""
    });

    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/products/${id}`);
      setMessage("Product deleted successfully!");
      await loadProducts();
    } catch (err) {
      console.error("DELETE PRODUCT ERROR:", err);
      setError(
        err.response?.data?.message ||
        "Unable to delete product."
      );
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setMessage("");
  }

  return (
    <div className="admin-products-page">
      <div className="admin-products-header">
        <div>
          <p className="eyebrow">PLANTIFY ADMIN</p>
          <h1>Product Management</h1>
          <p>Manage the products available in your shop.</p>
        </div>

        <Link to="/admin" className="primary-button">
          Back to Dashboard
        </Link>
      </div>

      <div className="admin-product-form-card">
        <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {message && (
          <div className="success-message">{message}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div>
              <label>Product Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label>Price (₱) *</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label>Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="0"
                required
              />
            </div>

            <div>
              <label>Category</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
              >
                <option value="">Select Category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-full">
              <label>Product Image URL</label>
              <input
                type="url"
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://example.com/plant.jpg"
              />
            </div>

            <div className="admin-form-full">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your product..."
                rows="4"
              />
            </div>
          </div>

          <div className="admin-form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingId
                  ? "Update Product"
                  : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-product-list">
        <h2>All Products ({products.length})</h2>

        {products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>

                    <td>
                      ₱{Number(product.price || 0).toFixed(2)}
                    </td>

                    <td>
                      {product.stock ?? product.stock_quantity ?? 0}
                    </td>

                    <td className="admin-product-actions">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="edit-button"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProducts;
