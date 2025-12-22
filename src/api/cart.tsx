import { API } from "./api";

export interface CartItem {
  id: number;
  productName: string;
  qty: number;
  price: number;
}

let currentCartId: string | null = null;

export const createCart = async (
  variantId: string,
  quantity: number,
  accessToken?: string
) => {
  const res = await API.post("/api/cart/create", null, {
    params: {
      variantId,
      quantity,
      accessToken,
    },
  });

  if (res.data && res.data.id) {
    currentCartId = res.data.id;
  }
  return res.data;
};

export const addToCart = async (
  cartId: string,
  variantId: string,
  quantity: number,
  accessToken?: string
) => {
  return API.post("/api/cart/add", null, {
    params: {
      cartId,
      variantId,
      quantity,
      accessToken,
    },
  });
};

export const buyProduct = async (
  variantId: string,
  quantity: number,
  accessToken?: string
) => {
  return API.post("/api/cart/buy-now", null, {
    params: {
      variantId,
      quantity,
      accessToken,
    },
  });
};

export const checkoutCart = async (cartId: string) => {
  return API.get(`/api/cart/checkout/${cartId}`);
};

export const getCart = async (cartId: string): Promise<CartItem[]> => {
  try {
      const res = await API.get(`/api/cart/${cartId}`);
      return res.data;
  } catch (error) {
      console.warn("getCart failed", error);
      return [];
  }
};

export const getCurrentCartId = () => currentCartId;
export const setCurrentCartId = (id: string) => { currentCartId = id; };
