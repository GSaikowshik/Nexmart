import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        console.log('Fetched products:', data);
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err.message || 'Error loading products');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Foolproof styling
  const gridStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px'
  };

  const cardStyle = {
    border: '1px solid #eaeaea',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    background: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    position: 'relative'
  };

  const imageStyle = {
    width: '100%',
    height: '200px',
    objectFit: 'contain',
    marginBottom: '16px',
    cursor: 'pointer'
  };

  const buttonStyle = {
    marginTop: '12px',
    padding: '10px',
    background: 'var(--primary, #0070f3)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600'
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem' }}>Loading catalog...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
        <h3>Error loading products</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0', minHeight: '60vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '2.5rem', fontWeight: 800 }}>NexMart Catalog</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Find your next favorite item</p>
      
      <div style={gridStyle}>
        {products.map((product) => (
          <div key={product.id} style={cardStyle}>
            <img 
              src={product.image_urls?.[0] || 'https://via.placeholder.com/200'} 
              alt={product.name} 
              style={imageStyle} 
              onClick={() => navigate(`/product/${product.slug}`)}
            />
            <h3 
              style={{ fontSize: '1.1rem', margin: '0 0 8px 0', color: '#333', cursor: 'pointer' }}
              onClick={() => navigate(`/product/${product.slug}`)}
            >
              {product.name}
            </h3>
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#666', 
              margin: '0 0 16px 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              height: '2.7em'
            }}>
              {product.description}
            </p>
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#000' }}>
                ${product.price?.toFixed(2)}
              </span>
            </div>
            <button 
              style={buttonStyle}
              onClick={() => addToCart(product, 1)}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
