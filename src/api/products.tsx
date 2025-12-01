import { API } from "./api";

export interface Product {
  id: number;
  title: string;
  variants: { price: string }[];
  image?: { src: string };
  images?: { src: string }[];
}

export const getProducts = async (): Promise<Product[]> => {
  const res = await API.get("/products");

  return res.data.map((p: any) => ({
    id: p.id,
    title: p.title,
    variants: p.variants,
    image: p.image,
    images: p.images
  }));
};
