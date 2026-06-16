import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Sun, Moon, LogOut, Package, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar({ onCartClick }) {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar glass">
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="logo">
          <ShoppingBag className="text-gradient" size={28} />
          <span className="text-gradient">NexMart</span>
        </Link>

        {/* Links */}
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/shop" className={`nav-link ${location.pathname === '/shop' ? 'active' : ''}`}>
            Shop
          </Link>
        </div>

        {/* Actions */}
        <div className="nav-actions">
          {/* Theme Toggle */}
          <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Cart Icon */}
          <button className="btn-icon badge-wrapper" onClick={onCartClick} aria-label="Open Cart">
            <ShoppingBag size={20} />
            {totalItems > 0 && <span className="badge">{totalItems}</span>}
          </button>

          {/* User Auth Info */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
              >
                <User size={18} />
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.user_metadata?.full_name || user.email}
                </span>
              </button>
              
              {dropdownOpen && (
                <div 
                  className="glass" 
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: '180px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 200
                  }}
                >
                  <Link 
                    to="/profile" 
                    className="nav-link" 
                    onClick={() => setDropdownOpen(false)}
                    style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}
                  >
                    <User size={16} /> Profile
                  </Link>
                  <Link 
                    to="/orders" 
                    className="nav-link" 
                    onClick={() => setDropdownOpen(false)}
                    style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}
                  >
                    <ClipboardList size={16} /> My Orders
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="nav-link"
                    style={{ 
                      textAlign: 'left', 
                      padding: '12px 16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      fontSize: '0.9rem',
                      width: '100%',
                      borderTop: '1px solid var(--border)'
                    }}
                  >
                    <LogOut size={16} className="danger" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
