import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getCart, CartItem, CartFetchResult, getUserCart } from '../api/cart';
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
  
  // New optimistic methods
  updateLineItemOptimistic: (lineId: string, quantity: number) => void;
  removeLineItemOptimistic: (lineId: string) => void;
  addItemOptimistic: (item: Partial<CartItem>) => void;
  revertOptimisticUpdate: (prevCart: CartItem[]) => void;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  cartCount: 0,
  isLoading: false,
  refreshCart: async () => {},
  cartId: null,
  setCartId: async () => {},
  checkoutUrl: null,
  updateLineItemOptimistic: () => {},
  removeLineItemOptimistic: () => {},
  addItemOptimistic: () => {},
  revertOptimisticUpdate: () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartId, setCartIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const { accessToken, user } = useAuth();
  const initializedRef = useRef(false);
  const lastRefreshRef = useRef(0);

  const updateLineItemOptimistic = (lineId: string, quantity: number) => {
      setCart(prev => prev.map(item => 
          item.id === lineId ? { ...item, qty: quantity } : item
      ));
  };

  const removeLineItemOptimistic = (lineId: string) => {
      setCart(prev => prev.filter(item => item.id !== lineId));
  };

  const addItemOptimistic = (item: Partial<CartItem>) => {
      setCart(prev => {
          // Check if item already exists to increment quantity
          const existing = prev.find(p => p.variantId === item.variantId);
          if (existing) {
             return prev.map(p => p.variantId === item.variantId ? { ...p, qty: (p.qty || 0) + (item.qty || 1) } : p);
          }
          // Add new item
          return [...prev, { 
              id: item.id || `temp-${Date.now()}`, 
              productName: item.productName || 'Loading...',
              qty: item.qty || 1,
              price: item.price || 0,
              image: item.image,
              variantId: item.variantId,
              variantTitle: item.variantTitle
           } as CartItem];
      });
  };

  const revertOptimisticUpdate = (prevCart: CartItem[]) => {
      setCart(prevCart);
  };


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
    
    // Only set global loading if we are doing a full refresh, not during optimistic background sync
    // But since this function is generic, we keep it as is. 
    // The consumer (Cart Screen) will decide whether to show a spinner or not.
    // However, if we are calling this frequently, we might want to avoid full screen loading.
    
    // For now, we keep the original logic but we will NOT call this function 
    // immediately after optimistic updates in the screen component if we want to avoid flicker.
    // OR we call it but ensure the loading state doesn't block interaction.
    
    const now = Date.now();
    if (now - lastRefreshRef.current < 400) return;
    lastRefreshRef.current = now;
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
          initializedRef.current = true;
      };
      loadCartId();
  }, []);

  useEffect(() => {
      if (!initializedRef.current) return;
      if (cartId) {
          refreshCart(cartId);
      } else {
          setCart([]);
      }
  }, [cartId, refreshCart]);

  useEffect(() => {
      const restoreUserCart = async () => {
          if (!accessToken || !user?.id) return;
          try {
              const uid = String(user.id).trim().replace(/[`"]/g, "");
              const data = await getUserCart(uid, accessToken || undefined);
              const cid = data?.cartID;
              const del = data?.isDelete;
              if (cid && !del) {
                  const current = cartId;
                  if (current !== cid) {
                      await updateCartId(cid);
                      await refreshCart(cid);
                  }
              }
          } catch (e) { console.error("Failed to restore user cart", e); }
      };
      restoreUserCart();
  }, [accessToken, user?.id, refreshCart, cartId]);

  const cartCount = cart.reduce((acc, item) => acc + (item.qty || 0), 0);

  return (
    <CartContext.Provider value={{ 
        cart, 
        cartCount, 
        isLoading, 
        refreshCart, 
        cartId, 
        setCartId: updateCartId, 
        checkoutUrl,
        updateLineItemOptimistic,
        removeLineItemOptimistic,
        addItemOptimistic,
        revertOptimisticUpdate
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
