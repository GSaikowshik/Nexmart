import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, ShieldCheck, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function CheckoutPage() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Address State
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    addressLine1: '',
    city: '',
    postalCode: '',
    country: '',
  });

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/checkout');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = Address, 2 = Review, 3 = Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.postalCode) {
      setError('Please fill in all required shipping fields.');
      return;
    }
    setError(null);
    setCheckoutStep(2);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      // Create order on FastAPI (saves directly to DB & finalizes payment)
      const orderPayload = {
        shipping_address: shippingAddress,
        billing_address: shippingAddress, // Simple duplicate for now
      };

      const order = await api.post('/orders', orderPayload);
      setCreatedOrder(order);

      // Success step
      clearCart();
      setCheckoutStep(3);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during checkout. Please check stock levels.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && checkoutStep !== 3) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '20px' }}>
        <ShoppingBag size={48} className="text-muted" />
        <h2>Your cart is empty</h2>
        <p>Add some products before proceeding to checkout.</p>
        <Link to="/shop" className="btn btn-primary">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      {checkoutStep === 3 ? (
        /* Success Screen */
        <div className="glass" style={{ maxWidth: '600px', margin: '40px auto', padding: '48px', borderRadius: 'var(--radius-lg)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          <CheckCircle2 size={64} style={{ color: 'var(--success)' }} />
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Order Placed Successfully!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Thank you for your purchase. Your order has been received and is now processing.
            </p>
          </div>

          {createdOrder && (
            <div className="glass" style={{ width: '100%', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'left', fontSize: '0.95rem' }}>
              <p style={{ marginBottom: '8px' }}><strong>Order ID:</strong> {createdOrder.id}</p>
              <p style={{ marginBottom: '8px' }}><strong>Total Paid:</strong> ${createdOrder.total_amount?.toFixed(2)}</p>
              <p><strong>Deliver to:</strong> {shippingAddress.fullName}, {shippingAddress.addressLine1}, {shippingAddress.city}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', width: '100%', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/orders')}>
              View Order History
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              Continue Shopping
            </button>
          </div>
        </div>
      ) : (
        /* Checkout Form Grid */
        <div className="checkout-grid">
          <div>
            {/* Step Indicators */}
            <div className="flex gap-lg" style={{ marginBottom: '32px' }}>
              <span style={{ fontWeight: 600, color: checkoutStep === 1 ? 'var(--primary)' : 'var(--text-muted)' }}>
                1. Shipping Address
              </span>
              <span style={{ fontWeight: 600, color: checkoutStep === 2 ? 'var(--primary)' : 'var(--text-muted)' }}>
                2. Review & Place Order
              </span>
            </div>

            {error && (
              <div className="flex align-center gap-sm danger" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: '0.95rem' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {checkoutStep === 1 ? (
              /* Address Form */
              <div className="checkout-section-box">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Truck size={22} /> Delivery Details
                </h2>
                <form onSubmit={handleAddressSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="input-group">
                    <label className="input-label">Full Name *</label>
                    <input
                      type="text"
                      className="input-control"
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                      placeholder="Jane Doe"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Street Address *</label>
                    <input
                      type="text"
                      className="input-control"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                      placeholder="123 Main St"
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label">City *</label>
                      <input
                        type="text"
                        className="input-control"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        placeholder="New York"
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Postal Code *</label>
                      <input
                        type="text"
                        className="input-control"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                        placeholder="10001"
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Country *</label>
                    <input
                      type="text"
                      className="input-control"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      placeholder="United States"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
                    Continue to Review
                  </button>
                </form>
              </div>
            ) : (
              /* Review & Place Order Box */
              <div className="checkout-section-box">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={22} style={{ color: 'var(--success)' }} /> Review & Place Order
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '12px' }}>Shipping Address</h4>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{shippingAddress.fullName}</p>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{shippingAddress.addressLine1}</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{shippingAddress.city}, {shippingAddress.postalCode}, {shippingAddress.country}</p>
                  </div>

                  <div className="flex align-center gap-sm" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
                    <span>Clicking 'Place Order' will instantly process your order and mock a successful checkout.</span>
                  </div>

                  <div className="flex gap-md" style={{ marginTop: '12px' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setCheckoutStep(1)}
                      disabled={loading}
                    >
                      Back to Shipping
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      {loading ? 'Processing Order...' : 'Place Order'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Right Column */}
          <div>
            <div className="checkout-section-box glass">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Order Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {cartItems.map((item) => (
                  <div key={item.product_id} className="flex justify-between align-center" style={{ fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.product?.name} <strong style={{ color: 'var(--text-primary)' }}>x{item.quantity}</strong>
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                  <span style={{ color: 'var(--success)', fontWeight: 500 }}>FREE</span>
                </div>
                <div className="flex justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '1.2rem', fontWeight: 700 }}>
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
