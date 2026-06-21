import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import supabase from '../services/supabaseClient';

const CartContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to fetch the token and construct headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || 'dev-mock-token';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Load cart on auth state changes
  useEffect(() => {
    async function loadCart() {
      setLoading(true);
      if (user) {
        try {
          // If there are guest cart items in local storage, sync them to backend first
          const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
          if (guestCart.length > 0) {
            const headers = await getAuthHeaders();
            for (const item of guestCart) {
              await fetch(`${API_BASE_URL}/api/cart`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  product_id: item.product_id,
                  quantity: item.quantity,
                })
              });
            }
            // Clear guest cart
            localStorage.removeItem('guest_cart');
          }

          // Fetch database synced cart
          const headers = await getAuthHeaders();
          const res = await fetch(`${API_BASE_URL}/api/cart`, {
            method: 'GET',
            headers
          });
          if (res.ok) {
            const summary = await res.json();
            setCartItems(summary.items || []);
          }
        } catch (error) {
          console.error('Error fetching user cart:', error);
        }
      } else {
        // Load guest cart from local storage
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        setCartItems(guestCart);
      }
      setLoading(false);
    }

    loadCart();
  }, [user]);

  /**
   * Add a product to the cart, incrementing the quantity if it already exists.
   */
  const addToCart = async (product, quantity = 1) => {
    if (user) {
      try {
        // Find existing item to calculate the new absolute quantity
        const existing = cartItems.find(
          (item) => item.product_id === product.id
        );
        const newQty = (existing?.quantity || 0) + quantity;

        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/api/cart`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            product_id: product.id,
            quantity: newQty,
          })
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const summary = await res.json();
        setCartItems(summary.items || []);
      } catch (error) {
        console.error('Error adding to database cart:', error);
        throw error;
      }
    } else {
      // Guest cart logic — increment quantity if existing
      setCartItems((prev) => {
        const existing = prev.find((item) => item.product_id === product.id);
        let updated;
        if (existing) {
          updated = prev.map((item) =>
            item.product_id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          updated = [...prev, {
            product_id: product.id,
            quantity,
            product,
            created_at: new Date().toISOString(),
          }];
        }
        localStorage.setItem('guest_cart', JSON.stringify(updated));
        return updated;
      });
    }
  };

  /**
   * Set the absolute quantity for a cart item.
   */
  const updateCartItemQty = async (product, absoluteQty) => {
    if (absoluteQty <= 0) {
      return removeFromCart(product.id);
    }

    if (user) {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/api/cart`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            product_id: product.id,
            quantity: absoluteQty,
          })
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const summary = await res.json();
        setCartItems(summary.items || []);
      } catch (error) {
        console.error('Error updating cart item quantity:', error);
        throw error;
      }
    } else {
      setCartItems((prev) => {
        const updated = prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: absoluteQty }
            : item
        );
        localStorage.setItem('guest_cart', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const removeFromCart = async (productId) => {
    if (user) {
      try {
        const headers = await getAuthHeaders();
        // Since DELETE endpoint is /api/cart/{productId} or /api/v1/cart/{productId}
        // Let's call /api/cart/{productId} (to be aligned with the /api prefix support)
        const res = await fetch(`${API_BASE_URL}/api/cart/${productId}`, {
          method: 'DELETE',
          headers
        });
        if (res.ok) {
          const summary = await res.json();
          setCartItems(summary?.items || []);
        }
      } catch (error) {
        console.error('Error removing from database cart:', error);
      }
    } else {
      setCartItems((prev) => {
        const updated = prev.filter((item) => item.product_id !== productId);
        localStorage.setItem('guest_cart', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/api/cart/clear`, {
          method: 'DELETE',
          headers
        });
        if (res.ok) {
          const summary = await res.json();
          setCartItems(summary?.items || []);
        }
      } catch (error) {
        console.error('Error clearing database cart:', error);
      }
    } else {
      setCartItems([]);
      localStorage.removeItem('guest_cart');
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.quantity * (item.product?.price || 0),
    0
  );

  const value = {
    cartItems,
    loading,
    totalItems,
    totalPrice,
    addToCart,
    updateCartItemQty,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
