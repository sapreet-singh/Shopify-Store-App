import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, FlatList, Text, Image, TouchableOpacity, StyleSheet, Alert, Dimensions, ScrollView, } from "react-native";

import { getBestSellers, Product, ProductCollection, searchProducts, } from "../api/products";

import CustomHeader from "../components/CustomHeader";
import { ProductCardSkeleton } from "../components/Skeletons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import SearchOverlay from "../components/SearchOverlay";
import FastImage from "react-native-fast-image";
import { useCart } from "../context/CartContext";

const { width } = Dimensions.get("window");
const HERO_WIDTH = width - 24;

const optimizeShopifyUrl = (u?: string, w: number = 400) => {
  if (!u) return undefined;
  const url = String(u).trim();
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}width=${w}&format=webp`;
};

const heroImages = [
  require("../assets/hero/Hero 1.png"),
  require("../assets/hero/hero 2.png"),
  require("../assets/hero/hero 3.png"),
  require("../assets/hero/hero 4.png"),
];

export default function HomeScreen({ navigation }: any) {
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [_searchLoading, setSearchLoading] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loadingBestSellers, setLoadingBestSellers] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll hero images
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = currentIndex === heroImages.length - 1 ? 0 : currentIndex + 1;
      setCurrentIndex(nextIndex);

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  useEffect(() => {
    let isActive = true;
    setLoadingBestSellers(true);
    getBestSellers()
      .then((data) => {
        if (!isActive) return;
        setBestSellers(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!isActive) return;
        setLoadingBestSellers(false);
      });


    return () => {
      isActive = false;
    };
  }, []);

  const handleSubmitSearch = async (q: string) => {
    const query = q.trim();
    if (!query) return;

    setShowSearchOverlay(false);
    setSearchLoading(true);

    try {
      const results = await searchProducts(query);
      const cat: ProductCollection = {
        categoryId: "search",
        categoryTitle: `Results: ${query}`,
        categoryHandle: "search",
        categoryImage: undefined,
        products: results,
      };
      navigation.navigate("ProductList", { category: cat, products: results });
    } catch {
      Alert.alert("Error", "Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleViewAll = useCallback((title: string, products: Product[], id: string) => {
    if (!products || products.length === 0) return;
    const cat: ProductCollection = {
      categoryId: id,
      categoryTitle: title,
      categoryHandle: id,
      categoryImage: undefined,
      products: [],
    };
    navigation.navigate("ProductList", { category: cat, listType: id });
  }, [navigation]);

  const renderHomeProduct = useCallback(({ item }: { item: Product }) => {
    const imageUrl = optimizeShopifyUrl(item.featuredImage?.url);
    return (
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("ProductDetails", { product: item })}
      >
        <View style={styles.productImageWrap}>
          {imageUrl ? (
            <FastImage
              source={{
                uri: imageUrl,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.productImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={styles.productPlaceholder}>
              <MaterialIcons name="image" size={20} color="#9ca3af" />
            </View>
          )}
        </View>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.productPrice}>₹{item.price}</Text>
      </TouchableOpacity>
    );
  }, [navigation]);
  const keyExtractor = useCallback((item: Product) => item.id, []);

  useEffect(() => {
    const bsUris = bestSellers
      .map((p) => p.featuredImage?.url)
      .filter(Boolean)
      .map((u) => ({ uri: optimizeShopifyUrl(u as string) }));
    if (bsUris.length > 0) {
      FastImage.preload(bsUris as any);
    }
  }, [bestSellers]);

  

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <CustomHeader
        title="Home"
        value={searchQuery}
        searchEnabled
        showCart
        cartCount={cartCount}
        onCartPress={() => navigation.navigate("Cart")}
        onSearch={setSearchQuery}
        onFocus={() => setShowSearchOverlay(true)}
        onSubmit={handleSubmitSearch}
      />

      {/* Search Overlay */}
      <SearchOverlay
        visible={showSearchOverlay}
        query={searchQuery}
        onClose={() => setShowSearchOverlay(false)}
        onPickSuggestion={async (s) => {
          const q = s.type === "product" ? s.title : s.query || "";
          if (!q) return;

          setShowSearchOverlay(false);
          setSearchLoading(true);

          try {
            const results =
              s.type === "product" && s.product ? [s.product] : await searchProducts(q);

            const cat: ProductCollection = {
              categoryId: "search",
              categoryTitle: `Results: ${q}`,
              categoryHandle: "search",
              categoryImage: undefined,
              products: results,
            };

            navigation.navigate("ProductList", { category: cat, products: results });
          } catch {
            Alert.alert("Error", "Search failed.");
          } finally {
            setSearchLoading(false);
          }
        }}
        onSubmitQuery={handleSubmitSearch}
      />

      {/* MAIN SCROLL AREA */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Slider */}
        <View style={styles.hero}>
          <FlatList
            ref={flatListRef}
            data={heroImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.heroSlide}>
                <Image source={item} style={styles.heroImage} />
                <View style={styles.heroOverlay} />
                <View style={styles.heroTextWrap}>
                  <Text style={styles.heroKicker}>Trending</Text>
                  <Text style={styles.heroHeadline}>New styles for you</Text>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.heroCta}
                    onPress={() => scrollRef.current?.scrollTo({ y: 260, animated: true })}
                  >
                    <Text style={styles.heroCtaText}>Shop Now</Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            onScrollToIndexFailed={() => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: currentIndex, animated: true });
              }, 200);
            }}
            onMomentumScrollEnd={(event) => {
              const index = Math.floor(
                event.nativeEvent.contentOffset.x /
                  event.nativeEvent.layoutMeasurement.width
              );
              setCurrentIndex(index);
            }}
          />

          {/* Pagination */}
          <View style={styles.pagination}>
            {heroImages.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.paginationDot,
                  i === currentIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Collections</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Collections")}>
              <Text style={styles.sectionAction}>Browse</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.collectionsCtaCard}
            onPress={() => navigation.navigate("Collections")}
          >
            <View style={styles.collectionsCtaIcon}>
              <MaterialIcons name="grid-view" size={20} color="#2563eb" />
            </View>
            <View style={styles.collectionsCtaTextWrap}>
              <Text style={styles.collectionsCtaTitle}>Explore all collections</Text>
              <Text style={styles.collectionsCtaSubtitle}>Find categories and shop faster</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Best Sellers</Text>
            <TouchableOpacity
              disabled={bestSellers.length === 0}
              onPress={() => handleViewAll("Best Sellers", bestSellers, "best-sellers")}
            >
              <Text
                style={[
                  styles.sectionAction,
                  bestSellers.length === 0 && styles.sectionActionDisabled,
                ]}
              >
                See all
              </Text>
            </TouchableOpacity>
          </View>
          {loadingBestSellers ? (
            <FlatList
              data={[1, 2, 3]}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={() => <ProductCardSkeleton />}
              keyExtractor={(item) => `skeleton-${item}`}
              contentContainerStyle={styles.sectionList}
            />
          ) : (
            <FlatList
              data={bestSellers}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderHomeProduct}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.sectionList}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews
            />
          )}
        </View>

        

        <View style={styles.footerSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  footerSpacer: {
    height: 32,
  },

  hero: {
    height: 220,
    marginTop: 12,
    marginBottom: 14,
    marginHorizontal: 12,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },

  heroSlide: { width: HERO_WIDTH, height: "100%" },
  heroImage: { width: HERO_WIDTH, height: "100%", resizeMode: "cover" },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  heroTextWrap: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 18,
  },
  heroKicker: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroHeadline: {
    marginTop: 6,
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  heroCta: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#2563eb",
  },
  heroCtaText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },

  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
  },

  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
  },

  paginationDotActive: {
    backgroundColor: "#fff",
    width: 24,
  },

  sectionContainer: {
    marginTop: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563eb",
  },
  sectionActionDisabled: {
    color: "#94a3b8",
  },
  collectionsCtaCard: {
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  collectionsCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  collectionsCtaTextWrap: { flex: 1 },
  collectionsCtaTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  collectionsCtaSubtitle: { marginTop: 2, fontSize: 12, fontWeight: "600", color: "#64748b" },
  sectionList: {
    paddingHorizontal: 12,
    gap: 12,
  },
  sectionLoading: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  productCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  productImageWrap: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  productTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  productPrice: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },
});
