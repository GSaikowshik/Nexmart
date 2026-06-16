import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Filter, Search, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Read URL parameters
  const currentCategory = searchParams.get('category_slug') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort_by') || '';

  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    async function fetchFilterData() {
      try {
        const data = await api.get('/categories');
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetchFilterData();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (currentCategory) queryParams.append('category_slug', currentCategory);
        if (currentSearch) queryParams.append('search', currentSearch);
        if (currentSort) queryParams.append('sort_by', currentSort);

        const data = await api.get(`/products?${queryParams.toString()}`);
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [currentCategory, currentSearch, currentSort]);

  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters('search', searchInput);
  };

  return (
    <div className="container">
      <div className="flex justify-between align-center flex-wrap gap-md" style={{ marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Explore Shop</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Find your next favorite item from our quality catalog.</p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px' }}>
          <div className="input-group" style={{ position: 'relative', flexDirection: 'row' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ flex: 1, paddingRight: '40px' }}
            />
            <button 
              type="submit" 
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            >
              <Search size={18} />
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '40px' }}>
        {/* Filters Sidebar */}
        <aside className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '24px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Filter size={18} /> Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => updateFilters('category_slug', '')} 
                style={{ 
                  textAlign: 'left', 
                  fontSize: '0.95rem',
                  fontWeight: !currentCategory ? 600 : 400, 
                  color: !currentCategory ? 'var(--primary)' : 'var(--text-secondary)'
                }}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button 
                  key={cat.id} 
                  onClick={() => updateFilters('category_slug', cat.slug)}
                  style={{ 
                    textAlign: 'left', 
                    fontSize: '0.95rem',
                    fontWeight: currentCategory === cat.slug ? 600 : 400, 
                    color: currentCategory === cat.slug ? 'var(--primary)' : 'var(--text-secondary)'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <SlidersHorizontal size={18} /> Sort By
            </h3>
            <select 
              className="input-control" 
              value={currentSort}
              onChange={(e) => updateFilters('sort_by', e.target.value)}
              style={{ width: '100%', padding: '8px 12px' }}
            >
              <option value="">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
            </select>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main>
          {loading ? (
            <div className="grid grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="card" key={i}>
                  <div className="skeleton skeleton-image" style={{ height: '260px' }} />
                  <div className="product-card-content">
                    <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '85%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '50%', marginTop: '12px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px', color: 'var(--text-muted)' }}>
              <Search size={48} />
              <h3>No products found</h3>
              <p>Try clearing your search or category filters.</p>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setSearchParams({});
                  setSearchInput('');
                }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3">
              {products.map((product) => (
                <div className="card" key={product.id}>
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
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
