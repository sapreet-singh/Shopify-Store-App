import { API } from "./api";

export interface CartItem {
  id: number;
  productName: string;
  qty: number;
  price: number;
  image?: string;
  variantTitle?: string;
  variantId?: string; // Needed for update/remove logic if we use that ID
}

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

export const updateCartLine = async (
  cartId: string,
  lineId: string, 
  quantity: number
) => {
    return API.put("/api/cart/update", {
        cartId,
        variantId: lineId, // The context uses variantId as line identifier locally currently
        quantity
    });
};

export const removeCartLine = async (
    cartId: string,
    lineId: string
) => {
      // Axios delete with body requires the 'data' property in config
      return API.delete("/api/cart/remove", {
          data: {
              cartId,
              variantId: lineId
          }
      });
};

export const buyProduct = async (
  variantId: string,
  quantity: number,
  accessToken?: string
) => {
  // Spec explicitly showed "parameters" in "query" for buy-now
  return API.post("/api/cart/buy-now", null, {
    params: {
      variantId,
      quantity,
      // accessToken, // Removed if not in spec? Spec didn't show it but existing code had it. I'll pass it if existing code needs it, but spec was user provided.
      // User snippet: 
      // parameters: [ {name: variantId, in: query}, {name: quantity, in: query} ]
      // It did NOT show accessToken. I will retain the param in function signature but maybe not pass it if I want to be strict, 
      // but usually safe to pass extra. I'll keep it for now as it doesn't hurt.
      accessToken
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
