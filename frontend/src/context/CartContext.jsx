import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cart on auth state changes
  useEffect(() => {
    async function loadCart() {
      setLoading(true);
      if (user) {
        try {
          // If there are guest cart items in local storage, sync them to backend first
          const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
          if (guestCart.length > 0) {
            for (const item of guestCart) {
              await api.post('/cart', {
                product_id: item.product_id,
                quantity: item.quantity,
              });
            }
            // Clear guest cart
            localStorage.removeItem('guest_cart');
          }

          // Fetch database synced cart
          const summary = await api.get('/cart');
          setCartItems(summary.items || []);
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
   * Used by product cards' "Add to Cart" buttons.
   * The backend expects an absolute quantity (upsert), so we calculate:
   *   newAbsoluteQty = existingQty + addedQty
   */
  const addToCart = async (product, quantity = 1) => {
    if (user) {
      try {
        // Find existing item to calculate the new absolute quantity
        const existing = cartItems.find(
          (item) => item.product_id === product.id
        );
        const newQty = (existing?.quantity || 0) + quantity;

        const summary = await api.post('/cart', {
          product_id: product.id,
          quantity: newQty,
        });
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
   * Used by CartDrawer's +/- quantity buttons where the caller
   * already computed the desired absolute quantity.
   */
  const updateCartItemQty = async (product, absoluteQty) => {
    if (absoluteQty <= 0) {
      return removeFromCart(product.id);
    }

    if (user) {
      try {
        const summary = await api.post('/cart', {
          product_id: product.id,
          quantity: absoluteQty,
        });
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
        const summary = await api.delete(`/cart/${productId}`);
        setCartItems(summary?.items || []);
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
        const summary = await api.delete('/cart/clear');
        setCartItems(summary?.items || []);
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
