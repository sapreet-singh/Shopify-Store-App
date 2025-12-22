import { API } from "./api";

export interface Product {
  id: string;
  variantId: string;
  variantTitle: string;
  title: string;
  handle: string;
  price: string;
  availableForSale: boolean;
  quantityAvailable: number;
  featuredImage?: {
    url: string;
  };
}


export const getProducts = async (): Promise<Product[]> => {
  const res = await API.get("/api/storefront/products/all");

  return res.data.map((p: any) => ({
    id: p.id,
    variantId: p.variantId,
    variantTitle: p.variantTitle,
    title: p.title,
    handle: p.handle,
    price: p.price,
    availableForSale: p.availableForSale,
    quantityAvailable: p.quantityAvailable,
    featuredImage: p.featuredImage
  }));
};
