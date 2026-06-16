import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Star, ShoppingCart } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [categoriesData, productsData] = await Promise.all([
          api.get('/categories'),
          api.get('/products?featured=true')
        ]);
        setCategories(categoriesData);
        setFeaturedProducts(productsData);
      } catch (err) {
        console.error('Error fetching landing data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="container">
      {/* Hero Banner */}
      <section className="hero">
        <div className="hero-content">
          <span style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)' }}>
            Elevate Your Everyday
          </span>
          <h1 className="hero-title">
            The Next Gen of <span className="text-gradient">Tech & Style</span>
          </h1>
          <p className="hero-subtitle">
            Discover a curated collection of state-of-the-art gadgets, trendsetting fashion, and modern home essentials designed for premium living.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <button className="btn btn-primary" onClick={() => navigate('/shop')}>
              Explore Shop <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/shop?category_slug=electronics')}>
              Browse Tech
            </button>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '32px', textAlign: 'center' }}>
          Browse Categories
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div className="skeleton" style={{ width: '120px', height: '120px', borderRadius: '50%' }} />
                <div className="skeleton skeleton-text" style={{ width: '80px' }} />
              </div>
            ))
          ) : (
            categories.map((cat) => (
              <div 
                className="category-card" 
                key={cat.id} 
                onClick={() => navigate(`/shop?category_slug=${cat.slug}`)}
              >
                <div className="category-image-container">
                  <img src={cat.image_url} alt={cat.name} className="category-image" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{cat.name}</h3>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="product-catalog">
        <div className="flex justify-between align-center" style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem' }}>Featured Products</h2>
          <Link to="/shop" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            View All
          </Link>
        </div>

        <div className="product-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div className="card product-card" key={i}>
                <div className="skeleton skeleton-image" style={{ height: '260px' }} />
                <div className="product-card-content">
                  <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '60%', marginTop: '12px' }} />
                </div>
              </div>
            ))
          ) : (
            featuredProducts.map((product) => (
              <div className="card product-card" key={product.id}>
                <div 
                  className="product-card-img-wrapper"
                  onClick={() => navigate(`/product/${product.slug}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={product.image_urls?.[0]} alt={product.name} className="product-card-img" />
                </div>
                <div className="product-card-content">
                  <span className="product-card-category">
                    {categories.find((c) => c.id === product.category_id)?.name || 'Product'}
                  </span>
                  <h3 
                    className="product-card-title"
                    onClick={() => navigate(`/product/${product.slug}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {product.name}
                  </h3>
                  
                  <div className="flex align-center" style={{ gap: '4px', color: 'var(--warning)' }}>
                    <Star size={16} fill="var(--warning)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {product.rating?.toFixed(1)}
                    </span>
                  </div>

                  <div className="product-card-footer">
                    <div className="product-card-price-group">
                      <span className="product-card-price">${product.price.toFixed(2)}</span>
                      {product.compare_at_price > product.price && (
                        <span className="product-card-compare">${product.compare_at_price.toFixed(2)}</span>
                      )}
                    </div>

                    <button 
                      className="btn btn-primary"
                      onClick={() => addToCart(product, 1)}
                      style={{ padding: '8px' }}
                      aria-label="Add to Cart"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
