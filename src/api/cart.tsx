import { API } from "./api";
import axios from "axios";

export interface CartItem {
  id: string;
  productName: string;
  qty: number;
  price: number;
  image?: string;
  variantTitle?: string;
  variantId?: string;
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

  const data = res?.data ?? {};
  const normalizedId =
    data?.id ||
    data?.cartId ||
    data?.cart?.id ||
    data?.data?.id ||
    data?.createdCartId;
  if (normalizedId) {
    currentCartId = normalizedId;
  }
  return { id: normalizedId, ...data };
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

export const updateCartLine = async ( cartId: string, lineId: string, quantity: number, accessToken?: string ) => {
    return API.put("/api/cart/update", {
        cartId,
        lineId: lineId,
        quantity
    }, {
        params: { accessToken }
    });
};

export const removeCartLine = async ( cartId: string, lineId: string, accessToken?: string ) => {
      return API.delete("/api/cart/remove", {
          data: {
              cartId,
              lineId: lineId
          },
          params: { accessToken }
      });
};

export const buyProduct = async ( variantId: string, quantity: number, accessToken?: string ) => {
  return API.post("/api/cart/buy-now", null, {
    params: {
      variantId,
      quantity,
      accessToken
    },
  });
};

export const checkoutCart = async (cartId: string) => {
  return API.get(`/api/cart/checkout/${encodeURIComponent(cartId)}`);
};

export const getCart = async (cartId: string, accessToken?: string): Promise<CartItem[]> => {
  try {
      const res = await API.get(`/api/cart/${encodeURIComponent(cartId)}`, {
        params: { accessToken }
      });
      const edges = res.data?.data?.cart?.lines?.edges || [];
      const items: CartItem[] = edges.map((edge: any) => {
        const node = edge?.node || {};
        const merch = node?.merchandise || {};
        const priceAmount = merch?.price?.amount ?? "0";
        return {
          id: node?.id || String(Math.random()),
          productName: merch?.title || "Item",
          qty: node?.quantity || 0,
          price: parseFloat(priceAmount),
          image: undefined,
          variantTitle: merch?.title,
          variantId: merch?.id
        };
      });
      return items;
  } catch (error: any) {
      if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400)) {
        throw new Error("CART_NOT_FOUND");
      }
      throw error;
  }
};

export const getCurrentCartId = () => currentCartId;
export const setCurrentCartId = (id: string) => { currentCartId = id; };
