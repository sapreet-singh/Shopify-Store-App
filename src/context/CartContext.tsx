import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart, CartItem, CartFetchResult } from '../api/cart';
import { useAuth } from './AuthContext';

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  isLoading: boolean;
  refreshCart: (specificId?: string) => Promise<void>;
  cartId: string | null;
  setCartId: (id: string | null) => Promise<void>;
  checkoutUrl: string | null;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  cartCount: 0,
  isLoading: false,
  refreshCart: async () => {},
  cartId: null,
  setCartId: async () => {},
  checkoutUrl: null,
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartId, setCartIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
      const loadCartId = async () => {
          try {
              const storedId = await AsyncStorage.getItem('cartId');
              if (storedId) {
                  setCartIdState(storedId);
              }
          } catch (e) {
              console.error("Failed to load cartId", e);
          }
      };
      loadCartId();
  }, []);

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

  const refreshCart = useCallback(async (specificId?: string) => {
    const idToFetch = specificId || cartId;
    if (!idToFetch) {
        setCart([]);
        setCheckoutUrl(null);
        return;
    }
    
    setIsLoading(true);
    try {
      const result: CartFetchResult = await getCart(idToFetch, accessToken || undefined);
      if (Array.isArray(result?.items)) {
        setCart(result.items);
        setCheckoutUrl(result.checkoutUrl ?? null);
      } else {
        console.warn("getCart response invalid", result);
        setCart([]);
        setCheckoutUrl(null);
      }
    } catch (error: any) {
      if (error?.message === "CART_NOT_FOUND") {
        await updateCartId(null);
        setCart([]);
        setCheckoutUrl(null);
      } else {
        console.error("Failed to refresh cart", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cartId, accessToken]);

  const cartCount = cart.reduce((total, item) => total + item.qty, 0);

  return (
    <CartContext.Provider value={{ cart, cartCount, isLoading, refreshCart, cartId, setCartId: updateCartId, checkoutUrl }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
