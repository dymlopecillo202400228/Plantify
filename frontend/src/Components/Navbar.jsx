import { useState } from "react";
import { Link,NavLink,useNavigate} from "react-router-dom";
import {Leaf,ShoppingCart,Package,Settings,LayoutDashboard,LogOut,LogIn,UserPlus, Menu,X,UserRound} from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import "../Style/Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user?.role === "admin";
  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();

      setMenuOpen(false);

      navigate("/login", {
        replace: true
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navClass = ({ isActive }) =>
    isActive
      ? "plantify-nav-link active"
      : "plantify-nav-link";

  return (
    <header className="plantify-navbar">

      <div className="plantify-navbar-container">

        <Link
          to="/"
          className="plantify-logo"
          onClick={closeMenu}
        >
          <Leaf size={27} strokeWidth={2} />

          <span>Plantify</span>
        </Link>

        <button
          type="button"
          className="plantify-mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={
            menuOpen ? "Close menu" : "Open menu"
          }
          aria-expanded={menuOpen}
          aria-controls="plantify-navigation"
        >
          {menuOpen ? (
            <X size={26} />
          ) : (
            <Menu size={26} />
          )}
        </button>

        <nav
          id="plantify-navigation"
          className={`plantify-nav-menu ${
            menuOpen ? "open" : ""
          }`}
        >

          <NavLink
            to="/products"
            className={navClass}
            onClick={closeMenu}
          >
            <span>Shop</span>
          </NavLink>

          {user ? (
            <>

              {!isAdmin && (
                <>

                  <NavLink
                    to="/cart"
                    className={navClass}
                    onClick={closeMenu}
                  >
                    <ShoppingCart size={19} />

                    <span>Cart</span>
                  </NavLink>

                  <NavLink
                    to="/orders"
                    className={navClass}
                    onClick={closeMenu}
                  >
                    <Package size={19} />

                    <span>My Orders</span>
                  </NavLink>

                </>
              )}

              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={navClass}
                  onClick={closeMenu}
                >
                  <LayoutDashboard size={19} />

                  <span>Dashboard</span>
                </NavLink>
              )}

              <NavLink
                to="/settings"
                className={navClass}
                onClick={closeMenu}
              >
                <Settings size={19} />

                <span>Settings</span>
              </NavLink>

              <Link
                to="/settings"
                className="plantify-profile-link"
                onClick={closeMenu}
                title="My Profile"
                aria-label="My Profile"
              >

                <div className="plantify-nav-avatar">

                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Profile"
                    />
                  ) : (
                    <UserRound size={19} />
                  )}

                </div>

                <div className="plantify-user-info">

                  <span className="plantify-user-name">
                    {user.full_name ||
                      user.name ||
                      "My Account"}
                  </span>

                  <span className="plantify-user-role">
                    {isAdmin
                      ? "Administrator"
                      : "Customer"}
                  </span>

                </div>

              </Link>

              <button
                type="button"
                className="plantify-logout-button"
                onClick={handleLogout}
              >
                <LogOut size={18} />

                <span>Logout</span>
              </button>

            </>
          ) : (
            <>

              <NavLink
                to="/login"
                className={navClass}
                onClick={closeMenu}
              >
                <LogIn size={18} />

                <span>Login</span>
              </NavLink>

              <Link
                to="/register"
                className="plantify-register-button"
                onClick={closeMenu}
              >
                <UserPlus size={18} />

                <span>Register</span>
              </Link>

            </>
          )}

        </nav>

      </div>

    </header>
  );
}