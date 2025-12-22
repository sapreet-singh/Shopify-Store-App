import { API } from "./api";

export interface CartItem {
  id: number;
  productName: string;
  qty: number;
  price: number;
}

// Store cartId in memory for the session
let currentCartId: string | null = null;

export const createCart = async (
  variantId: string,
  quantity: number,
  accessToken?: string
) => {
  const res = await API.post("/api/cart/create", {
    variantId,
    quantity,
    accessToken,
  });
  // Assuming the response might contain the cartId or cart object
  // If the API returns the cart ID, we should capture it.
  // For now, let's assume the response data has an id.
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
  return API.post("/api/cart/add", {
    cartId,
    variantId,
    quantity,
    accessToken,
  });
};

export const buyProduct = async (
  variantId: string,
  quantity: number,
  accessToken?: string
) => {
  return API.post("/api/cart/buy-now", {
    variantId,
    quantity,
    accessToken,
  });
};

export const getCart = async (cartId: string): Promise<CartItem[]> => {
  // Attempt to fetch cart by ID.
  // Note: This endpoint is not explicitly in the provided snippet but inferred.
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
