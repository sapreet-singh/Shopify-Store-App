import { API } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Product {
    id: string;
    variantId: string;
    variantTitle: string;
    title: string;
    handle: string;
    price: string;
    availableForSale: boolean;
    quantityAvailable: number;
    description: string;
    featuredImage?: {
      url: string;
    };
    images: {
      url: string;
    }[];
  }
  
  export interface ProductCollection {
    categoryId: string;
    categoryTitle: string;
    categoryHandle: string;
    categoryImage?: {
      url: string;
    };
    products: Product[];
  }

  export interface CategorySummary {
    categoryId: string;
    categoryTitle: string;
    categoryHandle: string;
    categoryImage?: {
      url: string;
    };
  }

  export interface PredictiveSuggestion {
    type: "product" | "query";
    title: string;
    handle?: string;
    image?: { url: string };
    price?: string;
    product?: Product;
    query?: string;
  }
  
  export interface MenuItem {
    id: string;
    title: string;
    url?: string;
    collection?: {
      id?: string | null;
      handle?: string;
      title?: string;
      image?: { url?: string } | null;
    } | null;
    subItems: MenuItem[];
  }
  
  export interface MenuResponse {
    id: string;
    title: string;
    items: MenuItem[];
  }
  
  const normalizeUrl = (u?: string) => {
    if (!u) return undefined;
    return u.replace(/[`"' ]/g, "");
  };
  
  const mapIncomingProduct = (p: any): Product => {
    const featured = typeof p.featuredImage === "string" ? { url: normalizeUrl(p.featuredImage)! } : p.featuredImage;
    const imgs = Array.isArray(p.images)
      ? p.images.map((url: any) => {
          if (typeof url === "string") return { url: normalizeUrl(url)! };
          if (url && typeof url.url === "string") return { url: normalizeUrl(url.url)! };
          return { url: "" };
        }).filter((i: any) => i.url)
      : [];
    return {
      id: p.id,
      variantId: p.variantId,
      variantTitle: p.variantTitle,
      title: p.title,
      handle: p.handle,
      price: String(p.price),
      availableForSale: Boolean(p.availableForSale),
      quantityAvailable: Number(p.quantityAvailable ?? 0),
      description: p.description,
      featuredImage: featured,
      images: imgs
    };
  };
  
  
  export const getMenu = async (): Promise<MenuResponse | null> => {
    const res = await API.get("/api/products/menu");
    const data = res?.data;
    if (!data || typeof data !== "object") return null;
    const mapItem = (it: any): MenuItem => {
      const imgUrl =
        typeof it?.collection?.image === "string"
          ? { url: normalizeUrl(it.collection.image)! }
          : it?.collection?.image?.url
          ? { url: normalizeUrl(it.collection.image.url)! }
          : undefined;
      return {
        id: String(it.id || ""),
        title: String(it.title || ""),
        url: typeof it.url === "string" ? it.url : undefined,
        collection: it.collection
          ? {
              id: it.collection.id ?? null,
              handle: it.collection.handle,
              title: it.collection.title,
              image: imgUrl ? { url: imgUrl.url } : undefined,
            }
          : null,
        subItems: Array.isArray(it.subItems) ? it.subItems.map(mapItem) : [],
      };
    };
    return {
      id: String(data.id || ""),
      title: String(data.title || ""),
      items: Array.isArray(data.items) ? data.items.map(mapItem) : [],
    };
  };

  export const getCategories = async (): Promise<CategorySummary[]> => {
    const res = await API.get("/api/products/categories");
    const data = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.items)
      ? res.data.items
      : [];
    return data
      .map((c: any) => {
        const img =
          typeof c.categoryImage === "string"
            ? { url: normalizeUrl(c.categoryImage)! }
            : c.categoryImage && typeof c.categoryImage.url === "string"
            ? { url: normalizeUrl(c.categoryImage.url)! }
            : undefined;
        return {
          categoryId: String(c.categoryId || c.id || ""),
          categoryTitle: String(c.categoryTitle || c.title || ""),
          categoryHandle: String(c.categoryHandle || c.handle || ""),
          categoryImage: img,
        } as CategorySummary;
      })
      .filter((c: CategorySummary) => !!c.categoryHandle);
  };
  
  export const getCollectionByHandle = async (handle: string): Promise<ProductCollection | null> => {
    const res = await API.get("/api/products/collection/product", { params: { handle } });
    const d = res?.data;
    if (!d || typeof d !== "object") return null;
    const img =
      typeof d.image === "string"
        ? { url: normalizeUrl(d.image)! }
        : d.image && d.image.url
        ? { url: normalizeUrl(d.image.url)! }
        : undefined;
    const items = Array.isArray(d.products) ? d.products.map(mapIncomingProduct) : [];
    return {
      categoryId: String(d.id || handle || ""),
      categoryTitle: String(d.title || handle || ""),
      categoryHandle: String(d.handle || handle || ""),
      categoryImage: img,
      products: items,
    };
  };
  
  export const searchProducts = async (query: string): Promise<Product[]> => {
    const res = await API.get("/api/products/search", { params: { query } });
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(mapIncomingProduct);
  };
  
export const getProducts = async (): Promise<Product[]> => {
  const res = await API.get("/api/storefront/products/all");

  const data = Array.isArray(res.data)
    ? res.data
    : Array.isArray(res.data?.items)
    ? res.data.items
    : Array.isArray(res.data?.data)
    ? res.data.data
    : [];

  return data.map(mapIncomingProduct);
};

  export const predictiveSearch = async (query: string): Promise<PredictiveSuggestion[]> => {
    if (!query || !query.trim()) return [];
    try {
      const res = await API.get("/api/storefront/predictive", { params: { query } });
      const data = Array.isArray(res.data) ? res.data : [];
      return data.map((s: any) => {
        if (s.type === "product" && s.product) {
          const prod = mapIncomingProduct(s.product);
          return {
            type: "product",
            title: prod.title,
            handle: prod.handle,
            image: prod.featuredImage,
            price: prod.price,
            product: prod
          } as PredictiveSuggestion;
        }
        return {
          type: "query",
          title: String(s.title || s.query || query),
          query: String(s.query || s.title || query)
        } as PredictiveSuggestion;
      });
    } catch {
      try {
        const res2 = await API.get("/api/products/predictive", { params: { query } });
        const data2 = Array.isArray(res2.data) ? res2.data : [];
        return data2.map((p: any) => ({
          type: "product",
          title: p.title,
          handle: p.handle,
          image: typeof p.featuredImage === "string" ? { url: normalizeUrl(p.featuredImage)! } : p.featuredImage,
          price: String(p.price),
          product: mapIncomingProduct(p)
        }));
      } catch {
        const fallback = await searchProducts(query);
        return fallback.slice(0, 5).map((p) => ({
          type: "product",
          title: p.title,
          handle: p.handle,
          image: p.featuredImage,
          price: p.price,
          product: p
        }));
      }
    }
  };

  // Simple in-memory cache
  const cache: {
    bestSellers: Product[] | null;
    newArrivals: Product[] | null;
    timestamp: number;
  } = {
    bestSellers: null,
    newArrivals: null,
    timestamp: 0,
  };
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  export const getBestSellers = async (): Promise<Product[]> => {
    const now = Date.now();
    if (cache.bestSellers && (now - cache.timestamp < CACHE_DURATION)) {
      return cache.bestSellers;
    }
    try {
      const s = await AsyncStorage.getItem("cache:bestSellers:v1");
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed?.items) && typeof parsed?.ts === "number" && (now - parsed.ts < CACHE_DURATION)) {
          const items = parsed.items.map(mapIncomingProduct);
          cache.bestSellers = items;
          cache.timestamp = parsed.ts;
          return items;
        }
      }
    } catch {}

    try {
      const res = await API.get("/api/products/best-sellers");
      const data = Array.isArray(res.data) ? res.data : [];
      const mapped = data.map(mapIncomingProduct);
      
      // Update Cache
      cache.bestSellers = mapped;
      cache.timestamp = now;
      try { await AsyncStorage.setItem("cache:bestSellers:v1", JSON.stringify({ items: data, ts: now })); } catch {}
      
      return mapped;
    } catch {
      const all = await getProducts();
      const sorted = [...all].sort((a, b) => {
        const av = (a.images?.length || 0) + (a.availableForSale ? 1 : 0);
        const bv = (b.images?.length || 0) + (b.availableForSale ? 1 : 0);
        return bv - av;
      });
      const fallback = sorted.slice(0, 8);
      
      // Update Cache
      cache.bestSellers = fallback;
      cache.timestamp = now;
      try { await AsyncStorage.setItem("cache:bestSellers:v1", JSON.stringify({ items: fallback, ts: now })); } catch {}
      
      return fallback;
    }
  };

  export const getNewArrivals = async (): Promise<Product[]> => {
    const now = Date.now();
    if (cache.newArrivals && (now - cache.timestamp < CACHE_DURATION)) {
      return cache.newArrivals;
    }
    try {
      const s = await AsyncStorage.getItem("cache:newArrivals:v1");
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed?.items) && typeof parsed?.ts === "number" && (now - parsed.ts < CACHE_DURATION)) {
          const items = parsed.items.map(mapIncomingProduct);
          cache.newArrivals = items;
          cache.timestamp = parsed.ts;
          return items;
        }
      }
    } catch {}

    try {
      const res = await API.get("/api/products/new-arrivals");
      const data = Array.isArray(res.data) ? res.data : [];
      const mapped = data.map(mapIncomingProduct);

      // Update Cache
      cache.newArrivals = mapped;
      cache.timestamp = now;
      try { await AsyncStorage.setItem("cache:newArrivals:v1", JSON.stringify({ items: data, ts: now })); } catch {}

      return mapped;
    } catch {
      const all = await getProducts();
      const fallback = all.slice(0, 8);
      
      // Update Cache
      cache.newArrivals = fallback;
      cache.timestamp = now;
      try { await AsyncStorage.setItem("cache:newArrivals:v1", JSON.stringify({ items: fallback, ts: now })); } catch {}

      return fallback;
    }
  };

