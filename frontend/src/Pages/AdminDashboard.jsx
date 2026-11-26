import { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data.categories || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load categories."
      );
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const addCategory = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/categories", {
        name: name.trim(),
        description: description.trim()
      });

      setName("");
      setDescription("");
      setSuccess("Category added successfully!");
      await loadCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to add category."
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      await api.delete(`/categories/${id}`);
      setSuccess("Category deleted successfully!");
      setError("");
      await loadCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete category."
      );
    }
  };

  return (
    <div className="category-page">
      <div className="category-heading">
        <div>
          <p className="category-eyebrow">
            PLANTIFY MANAGEMENT
          </p>

          <h1>Manage Categories</h1>

          <p>
            Organize your plants and gardening products.
          </p>
        </div>
      </div>

      {error && (
        <div className="category-error">
          {error}
        </div>
      )}

      {success && (
        <div className="category-success">
          {success}
        </div>
      )}

      <div className="category-card">
        <h2>Add New Category</h2>

        <form
          onSubmit={addCategory}
          className="category-form"
        >
          <label htmlFor="category-name">
            Category Name
          </label>

          <input
            id="category-name"
            type="text"
            placeholder="e.g. Indoor Plants"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />

          <label htmlFor="category-description">
            Description
          </label>

          <textarea
            id="category-description"
            placeholder="Enter category description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "+ Add Category"}
          </button>
        </form>
      </div>

      <div className="category-card">
        <h2>Existing Categories</h2>

        {categories.length === 0 ? (
          <p>
            No categories found. Add your first category.
          </p>
        ) : (
          <div className="category-list">
            {categories.map((category) => (
              <div
                className="category-item"
                key={category.id}
              >
                <div>
                  <h3>{category.name}</h3>

                  <p>
                    {category.description || "No description"}
                  </p>
                </div>

                <button
                  type="button"
                  className="category-delete"
                  onClick={() => deleteCategory(category.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}