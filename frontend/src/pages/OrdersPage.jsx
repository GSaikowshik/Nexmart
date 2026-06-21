import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Calendar, Tag, AlertCircle } from 'lucide-react';
import api from '../services/api';
import supabase from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

const getStatusStepIndex = (status) => {
  const s = status?.toLowerCase();
  if (s === 'processing') return 0;
  if (s === 'shipped') return 1;
  if (s === 'out for delivery' || s === 'out_for_delivery') return 2;
  if (s === 'delivered') return 3;
  return -1;
};

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/orders');
      return;
    }

    async function fetchOrders() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || 'dev-mock-token';

        const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        const url = baseUrl.endsWith('/api/v1') 
          ? `${baseUrl}/orders` 
          : baseUrl.endsWith('/api')
            ? `${baseUrl}/orders`
            : `${baseUrl}/api/orders`;

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('Order Fetch Response:', data);

        // Sort orders descending by date
        const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setOrders(sorted);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user, navigate]);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'processing':
        return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' };
      case 'shipped':
        return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' };
      case 'delivered':
        return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' };
      case 'cancelled':
        return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' };
      default:
        return { backgroundColor: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.2)' };
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={16} /> Back to Home
      </button>

      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ClipboardList size={32} /> My Orders
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Track and review your transactional order history.</p>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="skeleton" key={i} style={{ height: '150px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '48px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', color: 'var(--text-muted)' }}>
          <ClipboardList size={48} />
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet.</p>
          <Link to="/shop" className="btn btn-primary" style={{ marginTop: '8px' }}>
            Browse Shop
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {orders.map((order) => {
            console.log('Order Data:', order);
            return (
              <div className="card" key={order.id} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="flex justify-between align-center flex-wrap gap-md" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Order ID</p>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', fontFamily: 'monospace' }}>{order.id.substring(0, 8)}...</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Date Placed</p>
                    <p style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total</p>
                    <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>${order.total_amount?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Order Items Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between align-center">
                    <div className="flex align-center gap-md">
                      <img 
                        src={item.product?.image_urls?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=50'} 
                        alt={item.product?.name} 
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                      <div>
                        <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>{item.product?.name || 'Product'}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Qty: {item.quantity} @ ${item.unit_price?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Visual Order Progress Timeline */}
              {getStatusStepIndex(order.status) >= 0 && (
                <div style={{
                  padding: '24px 0',
                  borderTop: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  margin: '12px 0'
                }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '24px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Tracking Timeline
                  </p>
                  <div style={{ position: 'relative', width: '100%', padding: '0 10px' }}>
                    {/* Progress Bar background line */}
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      left: '12.5%',
                      right: '12.5%',
                      height: '4px',
                      backgroundColor: 'var(--border)',
                      borderRadius: '2px',
                      zIndex: 1
                    }} />

                    {/* Progress Bar active line */}
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      left: '12.5%',
                      width: `${(getStatusStepIndex(order.status) / 3) * 75}%`,
                      height: '4px',
                      backgroundColor: 'var(--success)',
                      borderRadius: '2px',
                      zIndex: 2,
                      transition: 'width 0.4s ease'
                    }} />

                    {/* Steps Container */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 3 }}>
                      {['Processing', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                        const currentStepIndex = getStatusStepIndex(order.status);
                        const isCompleted = idx <= currentStepIndex;
                        const isActive = idx === currentStepIndex;

                        return (
                          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '25%' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: isCompleted ? 'var(--success)' : 'var(--background)',
                              border: `3px solid ${isCompleted ? 'var(--success)' : 'var(--border)'}`,
                              color: isCompleted ? '#ffffff' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.8rem',
                              boxShadow: isActive ? '0 0 0 4px rgba(16, 185, 129, 0.2)' : 'none',
                              transition: 'all 0.3s ease'
                            }}>
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span style={{
                              marginTop: '8px',
                              fontSize: '0.72rem',
                              fontWeight: isActive ? '700' : isCompleted ? '600' : '500',
                              color: isActive ? 'var(--text-primary)' : isCompleted ? 'var(--text-secondary)' : 'var(--text-muted)',
                              textAlign: 'center',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              lineHeight: '1.2',
                              padding: '0 4px'
                            }}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between align-center flex-wrap gap-md" style={{ borderTop: getStatusStepIndex(order.status) >= 0 ? 'none' : '1px solid var(--border)', paddingTop: getStatusStepIndex(order.status) >= 0 ? '0' : '16px', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span 
                    style={{ 
                      padding: '4px 10px', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '0.8rem', 
                      fontWeight: 700, 
                      textTransform: 'uppercase',
                      ...getStatusBadgeStyle(order.status)
                    }}
                  >
                    Status: {order.status}
                  </span>
                  <span 
                    style={{ 
                      padding: '4px 10px', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '0.8rem', 
                      fontWeight: 700, 
                      textTransform: 'uppercase',
                      backgroundColor: order.payment_status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: order.payment_status === 'paid' ? '#10b981' : '#ef4444',
                      border: order.payment_status === 'paid' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    Payment: {order.payment_status}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Calendar size={15} style={{ color: 'var(--primary)' }} />
                  <span>
                    <strong>Expected Delivery:</strong>{' '}
                    {order.estimated_delivery_date ? (
                      new Date(order.estimated_delivery_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    ) : (
                      'Delivery date pending'
                    )}
                  </span>
                </p>
              </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
