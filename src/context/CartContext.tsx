import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart, getCurrentCartId, CartItem } from '../api/cart';

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  cartId: string | null;
  setCartId: (id: string | null) => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  cartCount: 0,
  isLoading: false,
  refreshCart: async () => {},
  cartId: null,
  setCartId: async () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartId, setCartIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load cartId from storage on mount
  useEffect(() => {
      const loadCartId = async () => {
          try {
              const storedId = await AsyncStorage.getItem('cartId');
              if (storedId) {
                  setCartIdState(storedId);
                  // also sync to api module if needed, although we are moving away from it
                  // setCurrentCartId(storedId); 
              }
          } catch (e) {
              console.error("Failed to load cartId", e);
          }
      };
      loadCartId();
  }, []);

  // Fetch cart whenever cartId changes
  useEffect(() => {
      if (cartId) {
          refreshCart(cartId);
      } else {
          setCart([]);
      }
  }, [cartId]);

  const updateCartId = async (id: string | null) => {
      setCartIdState(id);
      try {
          if (id) {
              await AsyncStorage.setItem('cartId', id);
          } else {
              await AsyncStorage.removeItem('cartId');
          }
      } catch (e) {
          console.error("Failed to save cartId", e);
      }
  };

  const refreshCart = async (specificId?: string) => {
    const idToFetch = specificId || cartId;
    if (!idToFetch) {
        setCart([]);
        return;
    }
    
    setIsLoading(true);
    try {
      const items = await getCart(idToFetch);
      // Ensure it's an array
      if (Array.isArray(items)) {
        setCart(items);
      } else {
        console.warn("getCart response invalid", items);
        setCart([]);
      }
    } catch (error) {
      console.error("Failed to refresh cart", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cartCount = cart.reduce((total, item) => total + item.qty, 0);

  return (
    <CartContext.Provider value={{ cart, cartCount, isLoading, refreshCart: () => refreshCart(), cartId, setCartId: updateCartId }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
