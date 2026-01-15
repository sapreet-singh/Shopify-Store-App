import React, { useCallback, useMemo, useState } from "react";
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FastImage from "react-native-fast-image";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "../context/AuthContext";
import { getProducts, Product } from "../api/products";
import { buildProductIdKeys, getWishlist, normalizeWishlistItems, removeFromWishlist, WishlistDto } from "../api/wishlist";

const optimizeShopifyUrl = (u?: string, w: number = 400) => {
  if (!u) return undefined;
  const url = String(u).trim();
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}width=${w}&format=webp`;
};

type WishlistRow = {
  dto: WishlistDto;
  product?: Product;
};

const normalizeUrl = (u?: string) => {
  if (!u) return undefined;
  return String(u).replace(/[`"' ]/g, "");
};

const coerceProduct = (p: any): Product => {
  const featured = typeof p?.featuredImage === "string" ? { url: normalizeUrl(p.featuredImage)! } : p?.featuredImage;
  const images = Array.isArray(p?.images)
    ? p.images
        .map((x: any) => {
          if (typeof x === "string") return { url: normalizeUrl(x)! };
          if (x && typeof x.url === "string") return { url: normalizeUrl(x.url)! };
          return { url: "" };
        })
        .filter((i: any) => i.url)
    : [];

  return {
    id: String(p?.id ?? ""),
    variantId: String(p?.variantId ?? ""),
    variantTitle: String(p?.variantTitle ?? ""),
    title: String(p?.title ?? ""),
    handle: String(p?.handle ?? ""),
    price: String(p?.price ?? ""),
    availableForSale: Boolean(p?.availableForSale),
    quantityAvailable: Number(p?.quantityAvailable ?? 0),
    description: String(p?.description ?? ""),
    featuredImage: featured,
    images,
  };
};

const coerceWishlistDto = (x: any, fallbackCustomerId: string): WishlistDto => {
  return {
    CustomerId: String(x?.CustomerId ?? x?.customerId ?? fallbackCustomerId ?? ""),
    ProductId: String(x?.ProductId ?? x?.productId ?? x?.productID ?? x?.id ?? ""),
    VariantId: String(x?.VariantId ?? x?.variantId ?? x?.variantID ?? x?.variantId ?? ""),
  };
};

export default function WishlistScreen({ navigation }: any) {
  const { isLoading: isAuthLoading, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<WishlistRow[]>([]);

  const customerId = user?.id || "";

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const r of rows) {
      if (!r.product?.id) continue;
      for (const k of buildProductIdKeys(r.product.id)) {
        map.set(k, r.product);
      }
      for (const k of buildProductIdKeys(r.dto.ProductId)) {
        map.set(k, r.product);
      }
    }
    return map;
  }, [rows]);

  const refresh = useCallback(async () => {
    if (isAuthLoading) return;
    if (!user?.id) {
      Alert.alert("Login Required", "You need to login to view wishlist.", [
        { text: "Cancel", style: "cancel", onPress: () => navigation.navigate("Home") },
        { text: "Login", onPress: () => navigation.navigate("Home", { screen: "Login" }) },
      ]);
      return;
    }

    setLoading(true);
    try {
      const cacheKey = `wishlist:${user.id}:v1`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.rows)) {
          setRows(parsed.rows);
        }
      }
      const wishlistRes = await getWishlist(user.id);
      const rawItems = normalizeWishlistItems(wishlistRes?.data);
      const looksLikeProducts = rawItems.some((x: any) => x && typeof x === "object" && (x.id || x.variantId || x.title));

      if (looksLikeProducts) {
        const productsInWishlist = rawItems.map(coerceProduct).filter((p: Product) => Boolean(p.id));
        const nextRows = 
          productsInWishlist.map((product) => ({
            dto: {
              CustomerId: user.id,
              ProductId: product.id,
              VariantId: product.variantId || "",
            },
            product,
          }))
        ;
        setRows(nextRows);
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ rows: nextRows, ts: Date.now() }));
        return;
      }

      const products = await getProducts();
      const wishlistItems = rawItems.map((x: any) => coerceWishlistDto(x, user.id));

      const wishlistKeySet = new Set<string>();
      for (const w of wishlistItems) {
        for (const k of buildProductIdKeys(w.ProductId)) {
          wishlistKeySet.add(k);
        }
      }

      const productsInWishlist = products.filter((p) => {
        const keys = buildProductIdKeys(p.id);
        for (const k of keys) {
          if (wishlistKeySet.has(k)) return true;
        }
        return false;
      });
      const productMap = new Map(productsInWishlist.map((p) => [p.id, p]));
      const nextRows = 
        wishlistItems
          .filter((x: WishlistDto) => x.ProductId)
          .map((dto: WishlistDto) => {
            const keys = buildProductIdKeys(dto.ProductId);
            let product: Product | undefined;
            for (const k of keys) {
              const found = productMap.get(k);
              if (found) {
                product = found;
                break;
              }
            }
            return { dto, product };
          })
      ;
      setRows(nextRows);
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ rows: nextRows, ts: Date.now() }));
    } catch {
      Alert.alert("Error", "Failed to load wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isAuthLoading, navigation, user?.id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleRemove = useCallback(async (dto: WishlistDto) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await removeFromWishlist(dto);
      await refresh();
    } catch {
      Alert.alert("Error", "Failed to remove item. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, refresh]);

  const handleOpen = useCallback((productId: string) => {
    const keys = buildProductIdKeys(productId);
    let product: Product | undefined;
    for (const k of keys) {
      const found = productById.get(k);
      if (found) {
        product = found;
        break;
      }
    }
    if (!product) {
      Alert.alert("Unavailable", "This product is not available right now.");
      return;
    }
    navigation.navigate("Home", { screen: "ProductDetails", params: { product } });
  }, [productById, navigation]);

  const renderItem = useCallback(({ item }: { item: WishlistRow }) => {
    const imageUrl = optimizeShopifyUrl(item.product?.featuredImage?.url);
    const title = item.product?.title || item.dto.ProductId;
    const price = item.product?.price;
    const dto: WishlistDto = {
      CustomerId: customerId,
      ProductId: item.dto.ProductId,
      VariantId: item.dto.VariantId || item.product?.variantId || "",
    };

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => handleOpen(item.dto.ProductId)}>
        <View style={styles.imageWrapper}>
          {imageUrl ? (
            <FastImage
              source={{
                uri: imageUrl,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.image}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={styles.placeholder}>
              <MaterialIcons name="image" size={24} color="#9ca3af" />
            </View>
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {price ? <Text style={styles.price}>₹{price}</Text> : null}
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(dto)}>
          <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [customerId, handleRemove, handleOpen]);

  React.useEffect(() => {
    const uris = rows
      .map((r) => r.product?.featuredImage?.url)
      .filter(Boolean)
      .map((u) => ({ uri: optimizeShopifyUrl(u as string) }));
    if (uris.length > 0) {
      FastImage.preload(uris as any);
    }
  }, [rows]);
  if (loading && rows.length === 0) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your wishlist...</Text>
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <View style={styles.emptyIconContainer}>
          <MaterialIcons name="favorite-border" size={80} color="#e5e7eb" />
        </View>
        <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
        <Text style={styles.emptySubtitle}>Tap the heart icon on products to save them here.</Text>
        <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.shopNowBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <Text style={styles.headerSubtitle}>{customerId ? `${rows.length} item(s)` : ""}</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.dto.ProductId}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 10,
  },
  imageWrapper: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  price: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "700",
    color: "#2563eb",
  },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  shopNowBtn: {
    marginTop: 18,
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopNowBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});

