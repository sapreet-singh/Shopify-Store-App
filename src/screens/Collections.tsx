import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import CustomHeader from "../components/CustomHeader";
import SearchOverlay from "../components/SearchOverlay";
import { CategoryCardSkeleton, CategoryChipSkeleton } from "../components/Skeletons";
import {
  getProductCollections,
  ProductCollection,
  searchProducts,
} from "../api/products";

export default function CollectionsScreen({ navigation }: any) {
  const [categories, setCategories] = useState<ProductCollection[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ProductCollection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    getProductCollections()
      .then((data) => {
        if (!isActive) return;
        setCategories(data);
        setFilteredCategories(data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });
    return () => {
      isActive = false;
    };
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

  const renderCategoryCard = ({ item }: { item: ProductCollection }) => {
    const img = item.categoryImage?.url;
    return (
      <TouchableOpacity
        style={styles.categoryCardWrapper}
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

  const NUM_COLUMNS = 2;

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Collections"
        value={searchQuery}
        searchEnabled
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
        </View>

        {loading ? (
          <FlatList
            data={[1, 2, 3, 4, 5]}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={() => <CategoryChipSkeleton />}
            keyExtractor={(item) => `skeleton-chip-${item}`}
            contentContainerStyle={styles.catChipsRow}
          />
        ) : (
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.categoryId + "_chip"}
            contentContainerStyle={styles.catChipsRow}
          />
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Collections (${filteredCategories.length})` : "All Collections"}
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {loading ? (
            <FlatList
              data={[1, 2, 3, 4, 5, 6]}
              numColumns={NUM_COLUMNS}
              key={`grid-skeleton-${NUM_COLUMNS}`}
              renderItem={() => <CategoryCardSkeleton />}
              keyExtractor={(item) => `skeleton-grid-${item}`}
              scrollEnabled={false}
              columnWrapperStyle={NUM_COLUMNS > 1 ? styles.columnWrapper : undefined}
            />
          ) : (
            <FlatList
              data={filteredCategories}
              numColumns={NUM_COLUMNS}
              key={`grid-${NUM_COLUMNS}`}
              renderItem={renderCategoryCard}
              keyExtractor={(item) => item.categoryId}
              scrollEnabled={false}
              columnWrapperStyle={NUM_COLUMNS > 1 ? styles.columnWrapper : undefined}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="search-off" size={44} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No collections found</Text>
                  <Text style={styles.emptySubtitle}>Try a different search.</Text>
                </View>
              }
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
  gridContainer: {
    paddingHorizontal: 12,
  },
  footerSpacer: {
    height: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
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
    backgroundColor: "#fff",
  },
  catChipImage: { width: "100%", height: "100%" },
  catChipPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  catChipLabel: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#111" },
  categoryCardWrapper: {
    width: "48%",
    marginBottom: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  imageWrapper: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "100%",
    height: 170,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, color: "#111", marginTop: 8, fontWeight: "700" },
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
