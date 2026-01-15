import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import CustomHeader from "../components/CustomHeader";
import { useCart } from "../context/CartContext";
import SearchOverlay from "../components/SearchOverlay";
import { CategoryChipSkeleton } from "../components/Skeletons";
import {
  ProductCollection,
  searchProducts,
  getMenu,
  MenuResponse,
  MenuItem,
  getCollectionByHandle,
} from "../api/products";

export default function CollectionsScreen({ navigation }: any) {
  const { cartCount } = useCart();
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    getMenu()
      .then((data) => {
        if (!isActive) return;
        setMenu(data);
        setSelectedIndex(0);
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

  const openMenuItem = async (item: MenuItem) => {
    const handle = String(item?.collection?.handle || "").trim();
    const title = String(item?.collection?.title || item.title || "").trim();
    setLoading(true);
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
    } catch {
      Alert.alert("Error", "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const renderTopChip = ({ item, index }: { item: MenuItem; index: number }) => {
    return (
      <TouchableOpacity
        style={[styles.tabChip, selectedIndex === index ? styles.tabChipActive : null]}
        onPress={() => setSelectedIndex(index)}
      >
        <Text style={[styles.tabChipLabel, selectedIndex === index ? styles.tabChipLabelActive : null]} numberOfLines={1}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }: { item: MenuItem }) => {
    const hasChildren = Array.isArray(item.subItems) && item.subItems.length > 0;
    const key = String(item.id);
    const isExpanded = !!expanded[key];
    return (
      <View key={key}>
        <TouchableOpacity
          style={styles.listRow}
          onPress={() => {
            if (hasChildren) {
              setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
            } else {
              openMenuItem(item);
            }
          }}
        >
          <Text style={styles.listRowText}>{item.title}</Text>
          <MaterialIcons name={hasChildren ? (isExpanded ? "expand-less" : "chevron-right") : "chevron-right"} size={20} color="#111" />
        </TouchableOpacity>
        {hasChildren && isExpanded ? (
          <View style={styles.childList}>
            {item.subItems.map((child) => (
              <TouchableOpacity key={String(child.id)} style={styles.childRow} onPress={() => openMenuItem(child)}>
                <Text style={styles.childRowText}>{child.title}</Text>
                <MaterialIcons name="chevron-right" size={18} color="#111" />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title={"Collections"}
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
        {loading || !menu ? (
          <FlatList
            data={[1, 2, 3, 4]}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={() => <CategoryChipSkeleton />}
            keyExtractor={(item) => `skeleton-chip-${item}`}
            contentContainerStyle={styles.tabsRow}
          />
        ) : (
          <FlatList
            data={menu.items}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => renderTopChip({ item, index })}
            keyExtractor={(item, idx) => item.id + "_" + idx}
            contentContainerStyle={styles.tabsRow}
          />
        )}

        <View style={styles.gridContainer}>
          {loading || !menu
            ? null
            : (menu.items[selectedIndex]?.subItems || []).length > 0
            ? (
                <View key={`list-${selectedIndex}`}>
                  {menu.items[selectedIndex]?.subItems?.map((it) => renderListItem({ item: it }))}
                </View>
              )
            : (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="search-off" size={44} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No items found</Text>
                  <Text style={styles.emptySubtitle}>Try a different tab.</Text>
                </View>
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
  tabsRow: {
    paddingLeft: 12,
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
  listRow: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listRowText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  childList: {
    marginLeft: 8,
    marginBottom: 8,
  },
  childRow: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  childRowText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
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
