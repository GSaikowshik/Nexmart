import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ search, onSearchChange, category, onCategoryChange }) {
  const categoriesList = ['All', 'Electronics', 'Jewelery', "Men's Clothing", "Women's Clothing"];

  const containerStyle = {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto 32px auto',
    padding: '0 20px',
    flexWrap: 'wrap'
  };

  const searchContainerStyle = {
    position: 'relative',
    flex: 1,
    minWidth: '280px'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px 12px 48px',
    borderRadius: '8px',
    border: '1px solid #eaeaea',
    fontSize: '1rem',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: 'white',
    color: '#333'
  };

  const selectStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #eaeaea',
    fontSize: '1rem',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    background: 'white',
    cursor: 'pointer',
    color: '#333',
    minWidth: '180px'
  };

  const iconStyle = {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999',
    pointerEvents: 'none'
  };

  return (
    <div style={containerStyle}>
      <div style={searchContainerStyle}>
        <Search size={20} style={iconStyle} />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={inputStyle}
        />
      </div>
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        style={selectStyle}
      >
        {categoriesList.map((cat) => (
          <option key={cat} value={cat === 'All' ? '' : cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
