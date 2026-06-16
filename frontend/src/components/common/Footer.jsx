import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Col 1 */}
          <div className="footer-col">
            <Link to="/" className="logo" style={{ marginBottom: '8px' }}>
              <ShoppingBag className="text-gradient" size={24} />
              <span className="text-gradient">NexMart</span>
            </Link>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Experience the pinnacle of high-tech and style curated specifically for your modern aesthetic.
            </p>
          </div>

          {/* Col 2 */}
          <div className="footer-col">
            <h4 className="footer-title">Shop</h4>
            <div className="footer-links">
              <Link to="/shop?category_slug=electronics" className="footer-link">Electronics</Link>
              <Link to="/shop?category_slug=fashion" className="footer-link">Fashion</Link>
              <Link to="/shop?category_slug=home-kitchen" className="footer-link">Home & Kitchen</Link>
            </div>
          </div>

          {/* Col 3 */}
          <div className="footer-col">
            <h4 className="footer-title">Company</h4>
            <div className="footer-links">
              <a href="#" className="footer-link">About Us</a>
              <a href="#" className="footer-link">Careers</a>
              <a href="#" className="footer-link">Sustainability</a>
            </div>
          </div>

          {/* Col 4 */}
          <div className="footer-col">
            <h4 className="footer-title">Support</h4>
            <div className="footer-links">
              <a href="#" className="footer-link">Contact Support</a>
              <a href="#" className="footer-link">Shipping & Returns</a>
              <a href="#" className="footer-link">FAQ</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom flex justify-between align-center flex-wrap gap-md">
          <p>&copy; {new Date().getFullYear()} NexMart Inc. All rights reserved.</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Developed by{' '}
            <a 
              href="https://www.linkedin.com/in/gandikotasaikowshik" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gradient" 
              style={{ fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
            >
              Gandikota Sai Kowshik
            </a>
          </p>
          <div className="flex gap-md">
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
