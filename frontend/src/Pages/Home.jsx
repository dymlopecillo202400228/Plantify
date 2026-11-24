import { Link } from "react-router-dom";
import {Leaf,ShoppingBag,ShieldCheck,ArrowRight,Sprout,Truck} from "lucide-react";
import "../Style/Home.css";

function Home() {
  return (
    <main className="plantify-home">

      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-text">
            <span className="home-eyebrow">
              <Leaf size={17} />
              WELCOME TO PLANTIFY
            </span>

            <h1>
              Bring Nature
              <br />
              <span>Into Your Home.</span>
            </h1>

            <p>
              Discover beautiful plants, fresh greenery,
              and gardening essentials to create a
              greener, healthier, and more relaxing space.
            </p>

            <div className="home-hero-actions">
              <Link to="/products" className="home-shop-btn">
                Explore Plants
                <ArrowRight size={19} />
              </Link>

              <a href="#why-plantify" className="home-learn-btn">
                Why Plantify?
              </a>
            </div>

            <div className="home-hero-highlights">
              <span>
                <Sprout size={18} /> Quality Plants
              </span>

              <span>
                <Truck size={18} /> Easy Ordering
              </span>
            </div>
          </div>

          <div className="home-hero-visual">
            <img
              src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1100&q=85"
              alt="Beautiful green plants in a garden"
            />

            <div className="home-hero-badge">
              <span>🌿</span>

              <div>
                <strong>Grow with Plantify</strong>
                <small>Your greener journey starts here</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-benefits" id="why-plantify">
        <div className="home-section-heading">
          <span className="home-section-eyebrow">
            WHY SHOP WITH US
          </span>

          <h2>Why Choose Plantify?</h2>

          <p>
            Everything you need to bring nature closer to home.
          </p>
        </div>

        <div className="home-benefit-grid">
          <div className="home-benefit-card">
            <div className="home-benefit-icon">
              <Leaf size={27} />
            </div>

            <h3>Quality Plants</h3>

            <p>
              Explore our collection of plants carefully
              selected for your home and garden.
            </p>
          </div>

          <div className="home-benefit-card">
            <div className="home-benefit-icon">
              <ShoppingBag size={27} />
            </div>

            <h3>Easy Shopping</h3>

            <p>
              Browse your favorite plants, add them to
              your cart, and order conveniently online.
            </p>
          </div>

          <div className="home-benefit-card">
            <div className="home-benefit-icon">
              <ShieldCheck size={27} />
            </div>

            <h3>Secure Payments</h3>

            <p>
              Complete your purchase through our
              integrated Maya Checkout payment service.
            </p>
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div className="home-cta-content">
          <span>🌱 YOUR GREEN JOURNEY STARTS HERE</span>

          <h2>Find Your Perfect Plant Today</h2>

          <p>
            Discover plants and gardening essentials
            that make every space feel alive.
          </p>

          <Link to="/products" className="home-cta-btn">
            Shop Our Collection
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </main>
  );
}

export default Home;