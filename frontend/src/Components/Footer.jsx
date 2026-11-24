import { Link } from "react-router-dom";
import "../Style/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-about">
          <h2>Plantify</h2>
          <p>
            Bring nature into your home. Discover beautiful plants
            and create a greener, fresher environment with Plantify.
          </p>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/products">Shop Plants</Link>
          <Link to="/cart">Shopping Cart</Link>
          <Link to="/my-orders">My Orders</Link>
        </div>

        <div className="footer-links">
          <h3>My Account</h3>
          <Link to="/login">Login</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/checkout">Checkout</Link>
        </div>

        <div className="footer-contact">
          <h3>Contact Us</h3>
          <p>Email: support@plantify.com</p>
          <p>Location: Philippines</p>
          <p>Payment: Maya</p>
        </div>

      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Plantify. All Rights Reserved.
        </p>
        <p>Growing a greener tomorrow.</p>
      </div>
    </footer>
  );
}

export default Footer;