import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartDrawer({ isOpen, onClose }) {
  const { cartItems, totalPrice, updateCartItemQty, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleQtyChange = (item, newQty) => {
    if (newQty <= 0) {
      removeFromCart(item.product_id);
    } else {
      updateCartItemQty(item.product, newQty);
    }
  };

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div className={`drawer-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
      
      {/* Drawer */}
      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={20} /> Your Cart
          </h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close Drawer">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {cartItems.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-muted)' }}>
              <ShoppingCart size={48} />
              <p>Your shopping cart is empty.</p>
              <button className="btn btn-primary" onClick={() => { onClose(); navigate('/shop'); }}>
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div className="cart-item-row" key={item.product_id}>
                <img 
                  src={item.product?.image_urls?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80'} 
                  alt={item.product?.name} 
                  className="cart-item-img" 
                />
                <div className="cart-item-details">
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {item.product?.name}
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      ${item.product?.price?.toFixed(2)}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginTop: '8px' }}>
                    <div className="cart-item-qty">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleQtyChange(item, item.quantity - 1)}
                        style={{ padding: '2px', border: 'none', background: 'none' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.quantity}</span>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleQtyChange(item, item.quantity + 1)}
                        style={{ padding: '2px', border: 'none', background: 'none' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.product_id)} 
                      style={{ color: 'var(--danger)', padding: '4px', background: 'none', border: 'none' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <div className="flex justify-between align-center" style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: 600 }}>Subtotal</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Shipping and taxes calculated at checkout.
            </p>
            <button className="btn btn-primary" onClick={handleCheckout} style={{ width: '100%' }}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
