import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, FlatList, Text, Image, TouchableOpacity, StyleSheet, Alert, Dimensions, ScrollView, } from "react-native";

import { Product, ProductCollection, searchProducts, getMenu, MenuResponse, MenuItem, getCollectionByHandle, getNewArrivals, CategorySummary, getCategories } from "../api/products";

import CustomHeader from "../components/CustomHeader";
import { CategoryChipSkeleton } from "../components/Skeletons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import SearchOverlay from "../components/SearchOverlay";
import FastImage from "react-native-fast-image";
import { useCart } from "../context/CartContext";

const { width } = Dimensions.get("window");
const HERO_WIDTH = width - 24;

const formatPrice = (v: number | string) => {
  const n = Number(v);
  if (isNaN(n)) return `₹${String(v)}`;
  const hasDecimals = Math.round(n) !== n;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(n);
  } catch {
    const amount = hasDecimals ? n.toFixed(2) : String(Math.round(n));
    return `₹${amount}`;
  }
};

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
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [seriesItems, setSeriesItems] = useState<MenuItem[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [tabItems, setTabItems] = useState<Product[]>([]);
  const [loadingTabs, setLoadingTabs] = useState(false);
  const [sunglassesTabIndex, setSunglassesTabIndex] = useState(0);
  const [sunglassesItems, setSunglassesItems] = useState<Product[]>([]);
  const [loadingSunglasses, setLoadingSunglasses] = useState(false);
  const [lifestyleTabIndex, setLifestyleTabIndex] = useState(0);
  const [lifestyleItems, setLifestyleItems] = useState<Product[]>([]);
  const [loadingLifestyle, setLoadingLifestyle] = useState(false);
  const [stylesTabIndex, setStylesTabIndex] = useState(0);
  const [stylesItems, setStylesItems] = useState<Product[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(false);

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
    getMenu()
      .then((m) => {
        if (!isActive) return;
        setMenu(m);
        const collected: MenuItem[] = [];
        for (const it of m?.items || []) {
          for (const s of it.subItems || []) {
            collected.push(s);
            if (collected.length >= 4) break;
          }
          if (collected.length >= 4) break;
        }
        setSeriesItems(collected);
        const accIdx = Math.max(0, (m?.items || []).findIndex((x) => /accessor/i.test(x.title)));
        const base = (m?.items || [])[accIdx];
        if (base && base.subItems && base.subItems.length > 0) {
          setTabIndex(0);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!isActive) return;
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    setLoadingCategories(true);
    getCategories()
      .then((items) => {
        if (!isActive) return;
        setCategories(items);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!isActive) return;
        setLoadingCategories(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    getNewArrivals()
      .then((items) => {
        if (!isActive) return;
        setNewArrivals(items);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!isActive) return;
      });
    return () => {
      isActive = false;
    };
  }, []);

  const openMenuItem = useCallback(async (item: MenuItem) => {
    const handle = String(item?.collection?.handle || "").trim();
    const title = String(item?.collection?.title || item.title || "").trim();
    try {
      let category: ProductCollection | null = null;
      if (handle) {
        category = await getCollectionByHandle(handle);
      }
      if (!category) {
        const results = await searchProducts(title || handle || item.title);
        category = {
          categoryId: String(item.id),
          categoryTitle: title || item.title,
          categoryHandle: handle || title || item.title,
          categoryImage:
            item?.collection?.image && (item.collection.image as any)?.url
              ? { url: String((item.collection.image as any).url) }
              : undefined,
          products: results,
        };
      }
      navigation.navigate("ProductList", { category, products: category.products });
    } catch {}
  }, [navigation]);

  const openCategory = useCallback(async (category: CategorySummary) => {
    const handle = String(category.categoryHandle || "").trim();
    const title = String(category.categoryTitle || "").trim();
    try {
      let collection: ProductCollection | null = null;
      if (handle) {
        collection = await getCollectionByHandle(handle);
      }
      if (!collection) {
        const results = await searchProducts(title || handle);
        collection = {
          categoryId: category.categoryId || handle || title,
          categoryTitle: title || handle || "",
          categoryHandle: handle || title || "",
          categoryImage: category.categoryImage,
          products: results,
        };
      }
      navigation.navigate("ProductList", { category: collection, products: collection.products });
    } catch {
      Alert.alert("Error", "Failed to load products.");
    }
  }, [navigation]);

  const loadTabItems = useCallback(async () => {
    const accBase = menu?.items?.find((x) => /accessor/i.test(x.title)) || menu?.items?.[0];
    const child = accBase?.subItems?.[tabIndex];
    if (!child) {
      setTabItems([]);
      return;
    }
    setLoadingTabs(true);
    try {
      const handle = String(child?.collection?.handle || "").trim();
      const title = String(child?.collection?.title || child.title || "").trim();
      let cat: ProductCollection | null = null;
      if (handle) cat = await getCollectionByHandle(handle);
      if (!cat) {
        const res = await searchProducts(title || handle || child.title);
        cat = {
          categoryId: String(child.id),
          categoryTitle: title || child.title,
          categoryHandle: handle || title || child.title,
          categoryImage: child?.collection?.image && (child.collection.image as any)?.url
            ? { url: String((child.collection.image as any).url) }
            : undefined,
          products: res,
        };
      }
      setTabItems(cat.products.slice(0, 4));
    } catch {
      setTabItems([]);
    } finally {
      setLoadingTabs(false);
    }
  }, [menu?.items, tabIndex]);

  const loadSunglassesTabItems = useCallback(async () => {
    const base =
      menu?.items?.find((x) => /sunglass/i.test(x.title)) || menu?.items?.[0];
    const child = base?.subItems?.[sunglassesTabIndex];
    if (!child) {
      setSunglassesItems([]);
      return;
    }
    setLoadingSunglasses(true);
    try {
      const handle = String(child?.collection?.handle || "").trim();
      const title = String(child?.collection?.title || child.title || "").trim();
      let cat: ProductCollection | null = null;
      if (handle) cat = await getCollectionByHandle(handle);
      if (!cat) {
        const res = await searchProducts(title || handle || child.title);
        cat = {
          categoryId: String(child.id),
          categoryTitle: title || child.title,
          categoryHandle: handle || title || child.title,
          categoryImage:
            child?.collection?.image && (child.collection.image as any)?.url
              ? { url: String((child.collection.image as any).url) }
              : undefined,
          products: res,
        };
      }
      setSunglassesItems(cat.products.slice(0, 4));
    } catch {
      setSunglassesItems([]);
    } finally {
      setLoadingSunglasses(false);
    }
  }, [menu?.items, sunglassesTabIndex]);

  const loadLifestyleTabItems = useCallback(async () => {
    const base =
      menu?.items?.find((x) => /lifestyle/i.test(x.title)) || menu?.items?.[0];
    const child = base?.subItems?.[lifestyleTabIndex];
    if (!child) {
      setLifestyleItems([]);
      return;
    }
    setLoadingLifestyle(true);
    try {
      const handle = String(child?.collection?.handle || "").trim();
      const title = String(child?.collection?.title || child.title || "").trim();
      let cat: ProductCollection | null = null;
      if (handle) cat = await getCollectionByHandle(handle);
      if (!cat) {
        const res = await searchProducts(title || handle || child.title);
        cat = {
          categoryId: String(child.id),
          categoryTitle: title || child.title,
          categoryHandle: handle || title || child.title,
          categoryImage:
            child?.collection?.image && (child.collection.image as any)?.url
              ? { url: String((child.collection.image as any).url) }
              : undefined,
          products: res,
        };
      }
      setLifestyleItems(cat.products.slice(0, 4));
    } catch {
      setLifestyleItems([]);
    } finally {
      setLoadingLifestyle(false);
    }
  }, [menu?.items, lifestyleTabIndex]);

  const loadStylesTabItems = useCallback(async () => {
    const base =
      menu?.items?.find((x) => /\bstyle/i.test(x.title)) || menu?.items?.[0];
    const child = base?.subItems?.[stylesTabIndex];
    if (!child) {
      setStylesItems([]);
      return;
    }
    setLoadingStyles(true);
    try {
      const handle = String(child?.collection?.handle || "").trim();
      const title = String(child?.collection?.title || child.title || "").trim();
      let cat: ProductCollection | null = null;
      if (handle) cat = await getCollectionByHandle(handle);
      if (!cat) {
        const res = await searchProducts(title || handle || child.title);
        cat = {
          categoryId: String(child.id),
          categoryTitle: title || child.title,
          categoryHandle: handle || title || child.title,
          categoryImage:
            child?.collection?.image && (child.collection.image as any)?.url
              ? { url: String((child.collection.image as any).url) }
              : undefined,
          products: res,
        };
      }
      setStylesItems(cat.products.slice(0, 4));
    } catch {
      setStylesItems([]);
    } finally {
      setLoadingStyles(false);
    }
  }, [menu?.items, stylesTabIndex]);

  useEffect(() => {
    loadTabItems();
  }, [loadTabItems]);

  useEffect(() => {
    if (!menu?.items || menu.items.length === 0) return;
    loadSunglassesTabItems();
  }, [menu, loadSunglassesTabItems]);

  useEffect(() => {
    if (!menu?.items || menu.items.length === 0) return;
    loadLifestyleTabItems();
  }, [menu, loadLifestyleTabItems]);

  useEffect(() => {
    if (!menu?.items || menu.items.length === 0) return;
    loadStylesTabItems();
  }, [menu, loadStylesTabItems]);

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

  const renderHomeProductBase = useCallback((item: Product, inline: boolean) => {
    const imageUrl = optimizeShopifyUrl(item.featuredImage?.url);
    return (
      <TouchableOpacity
        style={[styles.productCard, inline ? styles.productCardInline : styles.productCardFull]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("ProductDetails", { product: item })}
      >
        <View style={[styles.productImageWrap, inline ? styles.productImageWrapInline : styles.productImageWrapFull]}>
          {imageUrl ? (
            <FastImage
              source={{
                uri: imageUrl,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.productImage}
              resizeMode={inline ? FastImage.resizeMode.cover : FastImage.resizeMode.contain}
            />
          ) : (
            <View style={styles.productPlaceholder}>
              <MaterialIcons name="image" size={20} color="#9ca3af" />
            </View>
          )}
        </View>
        <Text style={styles.productTitle} numberOfLines={inline ? 2 : 3}>
          {item.title}
        </Text>
        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
      </TouchableOpacity>
    );
  }, [navigation]);
  const renderGridProduct = useCallback(
    ({ item }: { item: Product }) => renderHomeProductBase(item, false),
    [renderHomeProductBase]
  );
  useEffect(() => {
    const naUris = newArrivals
      .map((p) => p.featuredImage?.url)
      .filter(Boolean)
      .map((u) => ({ uri: optimizeShopifyUrl(u as string) }));
    if (naUris.length > 0) {
      FastImage.preload(naUris as any);
    }
  }, [newArrivals]);

  return (
    <View style={styles.container}>
      <CustomHeader
        title={undefined}
        value={searchQuery}
        searchEnabled
        showCart
        cartCount={cartCount}
        onCartPress={() => navigation.navigate("Cart")}
        onSearch={setSearchQuery}
        onFocus={() => setShowSearchOverlay(true)}
        onSubmit={handleSubmitSearch}
      />

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

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Collections")}>
              <Text style={styles.sectionAction}>View all</Text>
            </TouchableOpacity>
          </View>
          {loadingCategories || categories.length === 0 ? (
            <FlatList
              data={[1, 2, 3, 4, 5]}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={() => <CategoryChipSkeleton />}
              keyExtractor={(item) => `chip-${item}`}
              contentContainerStyle={styles.catChipsRow}
            />
          ) : (
            <FlatList
              data={categories.slice(0, 6)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, idx) => item.categoryId + "_" + idx}
              renderItem={({ item }) => {
                const img = item.categoryImage?.url || "";
                const uri = img ? optimizeShopifyUrl(img) : undefined;
                return (
                  <TouchableOpacity style={styles.catChip} activeOpacity={0.8} onPress={() => openCategory(item)}>
                    <View style={styles.catChipImageWrap}>
                      {uri ? (
                        <FastImage
                          source={{ uri, priority: FastImage.priority.normal, cache: FastImage.cacheControl.immutable }}
                          style={styles.catChipImage}
                          resizeMode={FastImage.resizeMode.cover}
                        />
                      ) : (
                        <View style={styles.catChipPlaceholder}><MaterialIcons name="image" size={20} color="#9ca3af" /></View>
                      )}
                    </View>
                    <Text style={styles.catChipLabel} numberOfLines={1}>{item.categoryTitle}</Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.catChipsRow}
            />
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Series</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Collections")}>
              <Text style={styles.sectionAction}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.seriesGrid}>
            {(seriesItems || []).map((s, idx) => {
              const imgSource = s?.collection?.image as any;
              const img =
                typeof imgSource === "string"
                  ? String(imgSource)
                  : imgSource && imgSource.url
                  ? String(imgSource.url)
                  : "";
              const uri = img ? optimizeShopifyUrl(img) : undefined;
              return (
                <TouchableOpacity key={String(s.id) + "_" + idx} style={styles.seriesCard} activeOpacity={0.9} onPress={() => openMenuItem(s)}>
                  <View style={styles.seriesImageWrap}>
                    {uri ? (
                      <FastImage
                        source={{ uri, priority: FastImage.priority.normal, cache: FastImage.cacheControl.immutable }}
                        style={styles.seriesImage}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                    ) : (
                      <View style={styles.seriesPlaceholder}><MaterialIcons name="image" size={22} color="#9ca3af" /></View>
                    )}
                  </View>
                  <View style={styles.seriesTextWrap}>
                    <Text style={styles.seriesTitle} numberOfLines={1}>{s.title}</Text>
                    <TouchableOpacity style={styles.seriesCta} onPress={() => openMenuItem(s)}>
                      <Text style={styles.seriesCtaText}>VIEW ALL</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRowCenter}>
            <Text style={styles.sectionTitleCenter}>
              {(menu?.items?.find((x) => /accessor/i.test(x.title))?.title) || "Accessories"}
            </Text>
          </View>
          <FlatList
            data={(menu?.items?.find((x) => /accessor/i.test(x.title))?.subItems) || (menu?.items?.[0]?.subItems || [])}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, idx) => item.id + "_" + idx}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.tabChip, tabIndex === index ? styles.tabChipActive : null]}
                onPress={() => setTabIndex(index)}
              >
                <Text style={[styles.tabChipLabel, tabIndex === index ? styles.tabChipLabelActive : null]} numberOfLines={1}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tabsRow}
          />
          {loadingTabs ? null : (
            <View style={styles.innerlist}>
              {tabItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="search-off" size={44} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No products found</Text>
                  <Text style={styles.emptySubtitle}>Try another tab.</Text>
                </View>
              ) : (
                (() => {
                  const rows: Product[][] = [];
                  for (let i = 0; i < tabItems.length; i += 2) {
                    rows.push(tabItems.slice(i, i + 2));
                  }
                  return rows.map((row, idx) => (
                    <View key={`row-${idx}`} style={styles.column}>
                      {row.map((p) => (
                        <View key={p.id} style={styles.gridHalf}>
                          {renderGridProduct({ item: p })}
                        </View>
                      ))}
                    </View>
                  ));
                })()
              )}
            </View>
          )}
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => {
              const accBase = menu?.items?.find((x) => /accessor/i.test(x.title)) || menu?.items?.[0];
              const child = accBase?.subItems?.[tabIndex];
              if (child) openMenuItem(child);
            }}
          >
            <Text style={styles.viewAllText}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRowCenter}>
              <Text style={styles.sectionTitleCenter}>Sunglasses</Text>
            </View>
            <FlatList
              data={
                (menu?.items?.find((x) => /sunglass/i.test(x.title))?.subItems) ||
                (menu?.items?.[0]?.subItems || [])
              }
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, idx) => item.id + "_" + idx}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.tabChip,
                    sunglassesTabIndex === index ? styles.tabChipActive : null,
                  ]}
                  onPress={() => setSunglassesTabIndex(index)}
                >
                  <Text
                    style={[
                      styles.tabChipLabel,
                      sunglassesTabIndex === index
                        ? styles.tabChipLabelActive
                        : null,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.tabsRow}
            />
            {loadingSunglasses ? (
              <View style={styles.innerlist}>
                <View style={styles.loadingRow}>
                  <View style={styles.loadingBox} />
                  <View style={styles.loadingBox} />
                </View>
              </View>
            ) : (
              <View style={styles.innerlist}>
                {sunglassesItems.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="search-off" size={44} color="#9ca3af" />
                    <Text style={styles.emptyTitle}>No products found</Text>
                    <Text style={styles.emptySubtitle}>Try another tab.</Text>
                  </View>
                ) : (
                  (() => {
                    const rows: Product[][] = [];
                    for (let i = 0; i < sunglassesItems.length; i += 2) {
                      rows.push(sunglassesItems.slice(i, i + 2));
                    }
                    return rows.map((row, idx) => (
                      <View key={`sunglasses-row-${idx}`} style={styles.column}>
                        {row.map((p) => (
                          <View key={p.id} style={styles.gridHalf}>
                            {renderGridProduct({ item: p })}
                          </View>
                        ))}
                      </View>
                    ));
                  })()
                )}
              </View>
            )}
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => {
                const base =
                  menu?.items?.find((x) => /sunglass/i.test(x.title)) ||
                  menu?.items?.[0];
                const child = base?.subItems?.[sunglassesTabIndex];
                if (child) openMenuItem(child);
              }}
            >
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRowCenter}>
            <Text style={styles.sectionTitleCenter}>Lifestyle</Text>
          </View>
          <FlatList
            data={
              (menu?.items?.find((x) => /lifestyle/i.test(x.title))?.subItems) ||
              (menu?.items?.[0]?.subItems || [])
            }
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, idx) => item.id + "_" + idx}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.tabChip,
                  lifestyleTabIndex === index ? styles.tabChipActive : null,
                ]}
                onPress={() => setLifestyleTabIndex(index)}
              >
                <Text
                  style={[
                    styles.tabChipLabel,
                    lifestyleTabIndex === index
                      ? styles.tabChipLabelActive
                      : null,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tabsRow}
          />
          {loadingLifestyle ? (
            <View style={styles.innerlist}>
              <View style={styles.loadingRow}>
                <View style={styles.loadingBox} />
                <View style={styles.loadingBox} />
              </View>
            </View>
          ) : (
            <View style={styles.innerlist}>
              {lifestyleItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="search-off" size={44} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No products found</Text>
                  <Text style={styles.emptySubtitle}>Try another tab.</Text>
                </View>
              ) : (
                (() => {
                  const rows: Product[][] = [];
                  for (let i = 0; i < lifestyleItems.length; i += 2) {
                    rows.push(lifestyleItems.slice(i, i + 2));
                  }
                  return rows.map((row, idx) => (
                    <View key={`lifestyle-row-${idx}`} style={styles.column}>
                      {row.map((p) => (
                        <View key={p.id} style={styles.gridHalf}>
                          {renderGridProduct({ item: p })}
                        </View>
                      ))}
                    </View>
                  ));
                })()
              )}
            </View>
          )}
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => {
              const base =
                menu?.items?.find((x) => /lifestyle/i.test(x.title)) ||
                menu?.items?.[0];
              const child = base?.subItems?.[lifestyleTabIndex];
              if (child) openMenuItem(child);
            }}
          >
            <Text style={styles.viewAllText}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRowCenter}>
            <Text style={styles.sectionTitleCenter}>Styles</Text>
          </View>
          <FlatList
            data={
              (menu?.items?.find((x) => /\bstyle/i.test(x.title))?.subItems) ||
              (menu?.items?.[0]?.subItems || [])
            }
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, idx) => item.id + "_" + idx}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.tabChip,
                  stylesTabIndex === index ? styles.tabChipActive : null,
                ]}
                onPress={() => setStylesTabIndex(index)}
              >
                <Text
                  style={[
                    styles.tabChipLabel,
                    stylesTabIndex === index
                      ? styles.tabChipLabelActive
                      : null,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tabsRow}
          />
          {loadingStyles ? (
            <View style={styles.innerlist}>
              <View style={styles.loadingRow}>
                <View style={styles.loadingBox} />
                <View style={styles.loadingBox} />
              </View>
            </View>
          ) : (
            <View style={styles.innerlist}>
              {stylesItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="search-off" size={44} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No products found</Text>
                  <Text style={styles.emptySubtitle}>Try another tab.</Text>
                </View>
              ) : (
                (() => {
                  const rows: Product[][] = [];
                  for (let i = 0; i < stylesItems.length; i += 2) {
                    rows.push(stylesItems.slice(i, i + 2));
                  }
                  return rows.map((row, idx) => (
                    <View key={`styles-row-${idx}`} style={styles.column}>
                      {row.map((p) => (
                        <View key={p.id} style={styles.gridHalf}>
                          {renderGridProduct({ item: p })}
                        </View>
                      ))}
                    </View>
                  ));
                })()
              )}
            </View>
          )}
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => {
              const base =
                menu?.items?.find((x) => /\bstyle/i.test(x.title)) ||
                menu?.items?.[0];
              const child = base?.subItems?.[stylesTabIndex];
              if (child) openMenuItem(child);
            }}
          >
            <Text style={styles.viewAllText}>VIEW ALL</Text>
          </TouchableOpacity>
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
    marginHorizontal: 16,
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
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeaderRowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  sectionTitleCenter: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563eb",
  },
  sectionActionDisabled: {
    color: "#94a3b8",
  },
  catChipsRow: {
    paddingLeft: 16,
    paddingBottom: 8,
  },
  catChip: {
    alignItems: "center",
    marginRight: 12,
    width: 80,
  },
  catChipImageWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  catChipImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  catChipPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  catChipLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
  seriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  seriesCard: {
    width: "48%",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  seriesImageWrap: {
    height: 160,
    backgroundColor: "#fff",
  },
  seriesImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  seriesPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  seriesTextWrap: {
    padding: 12,
  },
  seriesTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  seriesCta: {
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  seriesCtaText: {
    color: "#111827",
    fontWeight: "700",
  },
  viewAllBtn: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 6,
    backgroundColor: "#fff",
  },
  viewAllText: {
    color: "#111827",
    fontWeight: "700",
  },
  sectionList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionLoading: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  productCardInline: {
    width: 140,
  },
  productCardFull: {
    width: "100%",
  },
  productImageWrap: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  productImageWrapInline: {
    height: 120,
  },
  productImageWrapFull: {
    height: 160,
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
  tabsRow: {
    paddingLeft: 16,
    paddingBottom: 8,
  },
  tabChip: {
    borderColor: "#e5e7eb",
    borderWidth: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  tabChipActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  tabChipLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },
  tabChipLabelActive: {
    color: "#fff",
  },
  column: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  innerlist: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  gridHalf: {
    width: "48%",
  },
  loadingBox: {
    width: "48%",
    height: 180,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
  },
  emptyContainer: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
});
