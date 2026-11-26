import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  Package,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Leaf
} from "lucide-react";
import api from "../ApiClient/api";
import "../Style/Product.css";

const formatPrice = (amount) => {
  return "\u20B1" + Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const unwrap = (body) => body?.data ?? body;

function getProducts(body) {
  const data = unwrap(body);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(body?.products)) return body.products;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function getCategories(body) {
  const data = unwrap(body);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(body?.categories)) return body.categories;

  return [];
}

function getCategoryName(product, categories) {
  if (typeof product.category === "string") {
    return product.category;
  }

  if (product.category?.name) {
    return product.category.name;
  }

  if (product.categories?.name) {
    return product.categories.name;
  }

  const found = categories.find(
    (category) =>
      String(category.id) === String(product.category_id)
  );

  return found?.name || "Gardening";
}

export default function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const [productResult, categoryResult] =
          await Promise.allSettled([
            api.get("/products"),
            api.get("/categories")
          ]);

        if (!active) return;

        if (productResult.status === "rejected") {
          throw productResult.reason;
        }

        setProducts(
          getProducts(productResult.value.data)
        );

        if (categoryResult.status === "fulfilled") {
          setCategories(
            getCategories(categoryResult.value.data)
          );
        }
      } catch (err) {
        console.error("PRODUCT LOAD ERROR:", err);

        if (active) {
          setError(
            err.response?.data?.message ||
            "Unable to load products."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const categoryNames = useMemo(() => {
    const names = new Set();

    categories.forEach((category) => {
      if (category.name) names.add(category.name);
    });

    products.forEach((product) => {
      names.add(getCategoryName(product, categories));
    });

    return ["All", ...names];
  }, [categories, products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const category = getCategoryName(
        product,
        categories
      );

      const matchesSearch =
        String(product.name || "")
          .toLowerCase()
          .includes(query) ||
        String(product.description || "")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        selectedCategory === "All" ||
        category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    if (sortBy === "price-low") {
      result.sort(
        (a, b) => Number(a.price) - Number(b.price)
      );
    }

    if (sortBy === "price-high") {
      result.sort(
        (a, b) => Number(b.price) - Number(a.price)
      );
    }

    if (sortBy === "name") {
      result.sort((a, b) =>
        String(a.name).localeCompare(String(b.name))
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );
    }

    return result;
  }, [
    products,
    categories,
    search,
    selectedCategory,
    sortBy
  ]);

  const handleAddToCart = async (product) => {
    setError("");
    setNotice("");

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("plantify_token");

    if (!token) {
      navigate("/login");
      return;
    }

    setAddingId(product.id);

    try {
      await api.post("/cart", {
        product_id: product.id,
        quantity: 1
      });

      setNotice(`${product.name} added to your cart!`);

      window.dispatchEvent(
        new Event("plantify:cart-updated")
      );
    } catch (err) {
      console.error("ADD TO CART ERROR:", err);

      if (err.response?.status === 401) {
        setError(
          "Your login session has expired. Please log in again."
        );
      } else {
        setError(
          err.response?.data?.message ||
          "Unable to add product to cart."
        );
      }
    } finally {
      setAddingId(null);
    }
  };

  return (
    <main className="plantify-shop">
      <section className="collection-section">
        <div className="shop-heading">
          <div>
            <p className="section-label">
              <Leaf size={15} />
              HANDPICKED FOR YOU
            </p>

            <h1>Explore Our Collection</h1>

            <p className="section-description">
              Everything you need to grow your own
              little paradise.
            </p>
          </div>

          <div className="product-count">
            <Package size={18} />
            {filteredProducts.length} Products
          </div>
        </div>

        {error && (
          <div
            className="shop-message shop-error"
            role="alert"
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {notice && (
          <div
            className="shop-message shop-success"
            role="status"
          >
            <CheckCircle2 size={18} />
            <span>{notice}</span>
            <Link to="/cart">View Cart</Link>
          </div>
        )}

        <div className="shop-toolbar">
          <div className="search-box">
            <Search size={19} />

            <input
              type="search"
              placeholder="Search plants, seeds, tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="sort-box">
            <SlidersHorizontal size={18} />

            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

              <option value="name">
                Name: A to Z
              </option>
            </select>
          </div>
        </div>

        <div className="category-filters">
          {categoryNames.map((category) => (
            <button
              key={category}
              type="button"
              className={
                "category-btn " +
                (selectedCategory === category
                  ? "active"
                  : "")
              }
              onClick={() =>
                setSelectedCategory(category)
              }
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="shop-empty">
            <Loader2 size={30} />
            <p>Loading our collection...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="shop-empty">
            <Package size={42} />
            <h3>No products found</h3>
            <p>Try another search or category.</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const stock = Number(product.stock || 0);
              const available = stock > 0;

              return (
                <article
                  className="product-card"
                  key={product.id}
                >
                  <div className="product-image-wrap">
                    {product.image_url ? (
                      <img
                        className="product-image"
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="product-placeholder">
                        <Leaf size={60} />
                      </div>
                    )}

                    <span
                      className={
                        "stock-badge " +
                        (available
                          ? "in-stock"
                          : "out-stock")
                      }
                    >
                      {available
                        ? "In Stock"
                        : "Out of Stock"}
                    </span>
                  </div>

                  <div className="product-info">
                    <span className="product-category">
                      {getCategoryName(
                        product,
                        categories
                      )}
                    </span>

                    <h3 className="product-name">
                      {product.name}
                    </h3>

                    <p className="product-description">
                      {product.description ||
                        "Quality gardening essentials for your green space."}
                    </p>

                    <p className="product-availability">
                      <Package size={15} />
                      {stock} items available
                    </p>

                    <div className="product-bottom">
                      <div>
                        <small>PRICE</small>

                        <div className="product-price">
                          {formatPrice(product.price)}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="add-cart-btn"
                        disabled={
                          !available ||
                          addingId === product.id
                        }
                        onClick={() =>
                          handleAddToCart(product)
                        }
                      >
                        <ShoppingCart size={17} />

                        {addingId === product.id
                          ? "Adding..."
                          : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}