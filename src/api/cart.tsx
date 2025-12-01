import { API } from "./api";

export interface CartItem {
  id: number;
  productName: string;
  qty: number;
  price: number;
}

export const addToCart = async (userId: number, productId: number, qty: number) => {
  const res = await API.post("/cart/add", {
    userId,
    productId,
    qty
  });
  return res.data;
};

export const getCart = async (userId: number): Promise<CartItem[]> => {
  const res = await API.get(`/cart/${userId}`);
  return res.data;
};
