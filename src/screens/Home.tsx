import React, { useEffect, useState, useRef } from "react";
import { View, FlatList, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Dimensions } from "react-native";
import { getProductCollections, ProductCollection, searchProducts } from "../api/products";
import CustomHeader from "../components/CustomHeader";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import SearchOverlay from "../components/SearchOverlay";

const { width } = Dimensions.get("window");
const HERO_WIDTH = width - 24; // padding 12 * 2

const heroImages = [
  require("../assets/hero/Hero 1.png"),
  require("../assets/hero/hero 2.png"),
  require("../assets/hero/hero 3.png"),
  require("../assets/hero/hero 4.png"),
];

export default function HomeScreen({ navigation }: any) {
  const NUM_COLUMNS = 2;
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
      setCurrentIndex((prevIndex) => 
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
      flatListRef.current?.scrollToIndex({
        index: currentIndex,
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
      const filtered = categories.filter(c =>
        c.categoryTitle?.toLowerCase().includes(lower) ||
        c.categoryHandle?.toLowerCase().includes(lower)
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  const handleSubmitSearch = async (q: string) => {
    const query = q?.trim() || "";
    if (!query) return;
    setShowSearchOverlay(false);
    setLoading(true);
    try {
      const results = await searchProducts(query);
      const cat = {
        categoryId: "search",
        categoryTitle: `Results: ${query}`,
        categoryHandle: "search",
        categoryImage: undefined,
        products: results,
      } as ProductCollection;
      navigation.navigate("ProductList", { category: cat, products: results });
    } catch {
      Alert.alert("Error", "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }: { item: ProductCollection }) => {
    const imageUrl = item.categoryImage?.url;
    return (
      <TouchableOpacity
        style={{ width: "48%" }}
        onPress={() => {
          const prods = item.products || [];
          navigation.navigate("ProductList", { category: item, products: prods });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.card}>
          <View style={styles.imageWrapper}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} />
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
    const imageUrl = item.categoryImage?.url;
    return (
      <TouchableOpacity
        style={styles.catChip}
        onPress={() => {
          const prods = item.products || [];
          navigation.navigate("ProductList", { category: item, products: prods });
        }}
      >
        <View style={styles.catChipImageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.catChipImage} />
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

  return (
    <View style={{ flex: 1 }}>
      <CustomHeader
        title={"Home"}
        searchEnabled={true}
        onSearch={setSearchQuery}
        value={searchQuery}
        onFocus={() => setShowSearchOverlay(true)}
        onSubmit={handleSubmitSearch}
      />
      <SearchOverlay
        visible={showSearchOverlay}
        query={searchQuery}
        onClose={() => setShowSearchOverlay(false)}
        onPickSuggestion={async (s) => {
          const q = s.type === "product" ? s.title : (s.query || "");
          if (!q) return;
          setShowSearchOverlay(false);
          setLoading(true);
          try {
            const results = s.type === "product" && s.product
              ? [s.product]
              : await searchProducts(q);
            const cat = {
              categoryId: "search",
              categoryTitle: `Results: ${q}`,
              categoryHandle: "search",
              categoryImage: undefined,
              products: results,
            } as ProductCollection;
            navigation.navigate("ProductList", { category: cat, products: results });
          } catch {
            Alert.alert("Error", "Search failed. Please try again.");
          } finally {
            setLoading(false);
          }
        }}
        onSubmitQuery={async (q) => {
          const query = q?.trim() || searchQuery.trim();
          if (!query) return;
          setShowSearchOverlay(false);
          setLoading(true);
          try {
            const results = await searchProducts(query);
            const cat = {
              categoryId: "search",
              categoryTitle: `Results: ${query}`,
              categoryHandle: "search",
              categoryImage: undefined,
              products: results,
            } as ProductCollection;
            navigation.navigate("ProductList", { category: cat, products: results });
          } catch {
            Alert.alert("Error", "Search failed. Please try again.");
          } finally {
            setLoading(false);
          }
        }}
      />
      
      {/* Hero Carousel */}
      <View style={styles.hero}>
        <FlatList
          ref={flatListRef}
          data={heroImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <Image source={item} style={styles.heroImage} />
          )}
          onMomentumScrollEnd={(event) => {
            const contentOffset = event.nativeEvent.contentOffset;
            const viewSize = event.nativeEvent.layoutMeasurement;
            const index = Math.floor(contentOffset.x / viewSize.width);
            setCurrentIndex(index);
          }}
        />
        <View style={styles.pagination}>
          {heroImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Category Chips */}
      <View style={styles.catChipsContainer}>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.categoryId + "_chip"}
          renderItem={renderCategoryChip}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catChipsRow}
        />
      </View>

      {/* Products Grid */}
      {filteredCategories.length > 0 ? (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.categoryId}
          renderItem={renderCategory}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={NUM_COLUMNS > 1 ? styles.column : undefined}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={<View style={{ height: 16 }} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No collections found</Text>
          <Text style={styles.emptySubtitle}>Try a different search.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 12,
  },
  column: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  imageWrapper: {
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
  title: {
    fontSize: 16,
    color: "#111827",
    marginTop: 8,
    minHeight: 28,
    fontWeight: "600",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#6b7280",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 80,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
  catChipsContainer: {
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  hero: {
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  heroImage: {
    width: HERO_WIDTH,
    height: "100%",
    resizeMode: "cover",
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.65)",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  catChipsRow: {
    paddingVertical: 8,
    gap: 12,
    paddingHorizontal: 4,
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
});
