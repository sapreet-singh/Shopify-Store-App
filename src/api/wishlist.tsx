import { API } from "./api";

export interface WishlistDto {
  CustomerId: string;
  ProductId: string;
  VariantId: string;
}

export const normalizeWishlistItems = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.wishlistItems)) return raw.wishlistItems;
  if (Array.isArray(raw?.wishlist)) return raw.wishlist;
  if (Array.isArray(raw?.wishlists)) return raw.wishlists;
  if (Array.isArray(raw?.result)) return raw.result;
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  if (Array.isArray(raw?.data?.data?.data)) return raw.data.data.data;
  return [];
};

export const buildProductIdKeys = (id: any): string[] => {
  const raw = String(id ?? "").trim();
  if (!raw) return [];
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();

  const keys: string[] = [];
  const push = (v: string) => {
    const s = String(v ?? "").trim();
    if (!s) return;
    if (!keys.includes(s)) keys.push(s);
  };

  push(raw);
  if (decoded !== raw) push(decoded);

  const lastSeg = decoded.split("/").filter(Boolean).pop();
  if (lastSeg) push(lastSeg);

  const digits = decoded.match(/\d+/g)?.join("") ?? "";
  if (digits) push(digits);

  return keys;
};

export const addToWishlist = async (dto: WishlistDto) => {
  return API.post("/api/wishlist/add", dto);
};

export const removeFromWishlist = async (dto: WishlistDto) => {
  return API.delete("/api/wishlist/remove", { data: dto });
};

export const getWishlist = async (customerId: string) => {
  return API.get("/api/wishlist", { params: { customerId } });
};
