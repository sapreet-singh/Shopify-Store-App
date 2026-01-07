import React, { useEffect, useState, useRef } from "react";
import { View, FlatList, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Dimensions, ScrollView, } from "react-native";

import { getProductCollections, ProductCollection, searchProducts, } from "../api/products";

import CustomHeader from "../components/CustomHeader";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import SearchOverlay from "../components/SearchOverlay";

const { width } = Dimensions.get("window");
const HERO_WIDTH = width - 24;

const heroImages = [
  require("../assets/hero/Hero 1.png"),
  require("../assets/hero/hero 2.png"),
  require("../assets/hero/hero 3.png"),
  require("../assets/hero/hero 4.png"),
];

export default function HomeScreen({ navigation }: any) {
  const [categories, setCategories] = useState<ProductCollection[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ProductCollection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

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
    setLoading(true);
    getProductCollections()
      .then((data) => {
        setCategories(data);
        setFilteredCategories(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      const filtered = categories.filter(
        (c) =>
          c.categoryTitle?.toLowerCase().includes(lower) ||
          c.categoryHandle?.toLowerCase().includes(lower)
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  const handleSubmitSearch = async (q: string) => {
    const query = q.trim();
    if (!query) return;

    setShowSearchOverlay(false);
    setLoading(true);

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
      setLoading(false);
    }
  };

  const renderCategory = ({ item }: { item: ProductCollection }) => {
    const img = item.categoryImage?.url;

    return (
      <TouchableOpacity
        style={{ width: "48%", marginBottom: 16 }}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("ProductList", { category: item, products: item.products || [] })
        }
      >
        <View style={styles.card}>
          <View style={styles.imageWrapper}>
            {img ? (
              <Image source={{ uri: img }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <MaterialIcons name="image" size={24} color="#9ca3af" />
              </View>
            )}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {item.categoryTitle || item.categoryHandle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryChip = ({ item }: { item: ProductCollection }) => {
    const img = item.categoryImage?.url;
    return (
      <TouchableOpacity
        style={styles.catChip}
        onPress={() =>
          navigation.navigate("ProductList", { category: item, products: item.products || [] })
        }
      >
        <View style={styles.catChipImageWrap}>
          {img ? (
            <Image source={{ uri: img }} style={styles.catChipImage} />
          ) : (
            <View style={styles.catChipPlaceholder}>
              <MaterialIcons name="image" size={18} color="#9ca3af" />
            </View>
          )}
        </View>
        <Text style={styles.catChipLabel} numberOfLines={1}>
          {item.categoryTitle || item.categoryHandle}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading collections...</Text>
      </View>
    );
  }

  
  const NUM_COLUMNS = 2;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Fixed Header */}
      <CustomHeader
        title="Home"
        value={searchQuery}
        searchEnabled
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
          setLoading(true);

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
            setLoading(false);
          }
        }}
        onSubmitQuery={handleSubmitSearch}
      />

      {/* MAIN SCROLL AREA */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Slider */}
        <View style={styles.hero}>
          <FlatList
            ref={flatListRef}
            data={heroImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => <Image source={item} style={styles.heroImage} />}
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

        {/* Category Chips */}
        <View style={styles.catChipsContainer}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.categoryId + "_chip"}
            contentContainerStyle={styles.catChipsRow}
          />
        </View>

        {/* Product Grid */}
        <View style={{ paddingHorizontal: 12 }}>
          <FlatList
            data={filteredCategories}
            numColumns={NUM_COLUMNS}
            key={`grid-${NUM_COLUMNS}`} // Force re-render when columns change
            renderItem={renderCategory}
            keyExtractor={(item) => item.categoryId}
            scrollEnabled={false}
            columnWrapperStyle={NUM_COLUMNS > 1 ? styles.columnWrapper : undefined}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: { 
    padding: 12,
  },
  columnWrapper: { 
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  imageWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
    height: 180,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },

  image: { width: "100%", height: "100%", resizeMode: "cover" },

  placeholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },

  title: { fontSize: 16, color: "#111", marginTop: 8, fontWeight: "600" },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: "#666" },

  hero: {
    height: 200,
    marginVertical: 16,
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: "hidden",
  },

  heroImage: { width: HERO_WIDTH, height: "100%", resizeMode: "cover" },

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

  catChipsContainer: {
    paddingVertical: 8,
  },

  catChipsRow: {
    paddingLeft: 12,
    paddingBottom: 4,
    gap: 12,
  },

  catChip: { alignItems: "center", width: 80 },

  catChipImageWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: "#eee",
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  catChipImage: { width: "100%", height: "100%" },
  catChipPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },

  catChipLabel: { marginTop: 6, fontSize: 12, fontWeight: "600", color: "#111" },
});
