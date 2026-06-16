import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, ArrowLeft, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const data = await api.get(`/products/${slug}`);
        setProduct(data);
      } catch (err) {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  const handleQtyChange = (value) => {
    if (value >= 1 && value <= (product?.stock_quantity || 10)) {
      setQuantity(value);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="product-detail-grid">
          <div className="skeleton" style={{ height: '500px', borderRadius: 'var(--radius-lg)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="skeleton skeleton-text" style={{ width: '30%' }} />
            <div className="skeleton skeleton-text" style={{ width: '80%', height: '32px' }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
            <div className="skeleton skeleton-text" style={{ width: '90%', height: '100px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '20px' }}>
        <AlertCircle size={48} className="danger" />
        <h2>{error || 'Product Not Found'}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/shop')}>
          Back to Shop
        </button>
      </div>
    );
  }

  const inStock = product.stock_quantity > 0;

  return (
    <div className="container">
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="product-detail-grid">
        {/* Gallery */}
        <div className="product-gallery">
          <div className="gallery-main">
            <img src={product.image_urls?.[0]} alt={product.name} />
          </div>
        </div>

        {/* Info */}
        <div className="product-info-panel">
          <div>
            <h1 className="product-title" style={{ marginBottom: '8px' }}>{product.name}</h1>
            
            <div className="product-meta-row">
              <div className="rating-badge">
                <Star size={16} fill="var(--primary)" />
                <span>{product.rating?.toFixed(1)} Rating</span>
              </div>

              <div className={`stock-status ${inStock ? 'in-stock' : 'out-of-stock'}`}>
                {inStock ? (
                  <>
                    <Check size={16} /> In Stock ({product.stock_quantity} available)
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} /> Out of Stock
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="detail-price-row">
            <span className="detail-price">${product.price.toFixed(2)}</span>
            {product.compare_at_price > product.price && (
              <span className="detail-compare">${product.compare_at_price.toFixed(2)}</span>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Description</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{product.description}</p>
          </div>

          {inStock && (
            <div className="qty-selector-group">
              <span style={{ fontWeight: 600 }}>Quantity:</span>
              <div className="qty-selector">
                <button className="qty-btn" onClick={() => handleQtyChange(quantity - 1)}>
                  <Minus size={16} />
                </button>
                <span className="qty-val">{quantity}</span>
                <button className="qty-btn" onClick={() => handleQtyChange(quantity + 1)}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          <button 
            className={`btn ${added ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={handleAddToCart}
            disabled={!inStock}
            style={{ width: '100%', padding: '14px 28px', fontSize: '1rem', display: 'flex', justifyContent: 'center', gap: '10px' }}
          >
            {added ? (
              <>
                <Check size={20} /> Added to Cart!
              </>
            ) : (
              <>
                <ShoppingBag size={20} /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <section className="reviews-section">
        <h2 style={{ fontSize: '1.75rem', marginBottom: '24px' }}>Customer Reviews</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="review-item">
            <div className="review-meta">
              <span className="review-author">Alice Johnson</span>
              <span className="review-date">June 12, 2026</span>
            </div>
            <div className="flex" style={{ gap: '2px', color: 'var(--warning)', margin: '4px 0' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill={i < 5 ? 'var(--warning)' : 'none'} />
              ))}
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Absolutely stunning product! Exceeded my expectations in quality and build. Delivery was quick too.
            </p>
          </div>

          <div className="review-item">
            <div className="review-meta">
              <span className="review-author">Mark Davis</span>
              <span className="review-date">May 28, 2026</span>
            </div>
            <div className="flex" style={{ gap: '2px', color: 'var(--warning)', margin: '4px 0' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill={i < 4 ? 'var(--warning)' : 'none'} />
              ))}
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Very solid purchase. Works exactly as described, though I wish there were more color options available.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
