import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { predictiveSearch, PredictiveSuggestion, getBestSellers, Product } from "../api/products";

interface SearchOverlayProps {
  visible: boolean;
  query: string;
  onClose: () => void;
  onPickSuggestion: (suggestion: PredictiveSuggestion) => void;
  onSubmitQuery: (query: string) => void;
}

const STORAGE_KEY = "pastSearches";

const SearchOverlay: React.FC<SearchOverlayProps> = ({
  visible,
  query,
  onClose,
  onPickSuggestion,
  onSubmitQuery,
}) => {
  const [suggestions, setSuggestions] = useState<PredictiveSuggestion[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [pastSearches, setPastSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      try {
        const arr = v ? JSON.parse(v) : [];
        setPastSearches(Array.isArray(arr) ? arr : []);
      } catch {
        setPastSearches([]);
      }
    });
    getBestSellers().then(setBestSellers).catch(() => {});
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (query && query.trim().length > 0) {
        setLoading(true);
        try {
          const res = await predictiveSearch(query.trim());
          setSuggestions(res);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible]);

  const addPastSearch = async (q: string) => {
    const next = [q, ...pastSearches.filter((x) => x !== q)].slice(0, 8);
    setPastSearches(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const clearPastSearches = async () => {
    setPastSearches([]);
    try { await AsyncStorage.removeItem(STORAGE_KEY); } catch {}
  };

  if (!visible) return null;

  const renderSuggestion = ({ item }: { item: PredictiveSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionRow}
      onPress={() => {
        if (item.type === "product") {
          if (item.product?.title) addPastSearch(item.product.title);
        } else if (item.query) {
          addPastSearch(item.query);
        }
        onPickSuggestion(item);
      }}
    >
      <MaterialIcons name="search" size={18} color="#6b7280" style={{ marginRight: 8 }} />
      <Text style={styles.suggestionText} numberOfLines={1}>{item.type === "product" ? item.title : item.query || item.title}</Text>
    </TouchableOpacity>
  );

  const renderBestSeller = ({ item }: { item: Product }) => {
    const img = item.featuredImage?.url;
    return (
      <View style={styles.productCard}>
        <View style={styles.productImageWrap}>
          {img ? <Image source={{ uri: img }} style={styles.productImage} /> : <View style={styles.productPlaceholder}><MaterialIcons name="image" size={22} color="#9ca3af" /></View>}
        </View>
        <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.productPrice}>₹{item.price}</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Past Searches</Text>
        {pastSearches.length > 0 && (
          <TouchableOpacity onPress={clearPastSearches}><Text style={styles.clearText}>Clear all</Text></TouchableOpacity>
        )}
      </View>
      <View style={styles.chipsWrap}>
        {pastSearches.map((p) => (
          <TouchableOpacity key={p} style={styles.chip} onPress={() => { addPastSearch(p); onSubmitQuery(p); }}>
            <MaterialIcons name="history" size={16} color="#374151" />
            <Text style={styles.chipText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Best Sellers</Text>
    </>
  );

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        {loading ? (
          <View style={styles.loadingWrap}><ActivityIndicator size="small" color="#2563eb" /></View>
        ) : suggestions.length > 0 ? (
          <FlatList
            data={suggestions}
            keyExtractor={(_, idx) => String(idx)}
            renderItem={renderSuggestion}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={<Text style={styles.sectionTitle}>Suggestions</Text>}
          />
        ) : (
          <FlatList
            data={bestSellers}
            ListHeaderComponent={renderHeader}
            keyExtractor={(item) => item.id}
            renderItem={renderBestSeller}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={
              <TouchableOpacity style={styles.viewAllBtn} onPress={() => onSubmitQuery(query || "")}>
                <Text style={styles.viewAllText}>VIEW ALL</Text>
              </TouchableOpacity>
            }
          />
        )}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <MaterialIcons name="close" size={22} color="#111827" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.05)",
    zIndex: 50,
  },
  panel: {
    marginTop: 110,
    marginHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  loadingWrap: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
    marginBottom: 8,
  },
  clearText: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "600",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  chipText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "500",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  suggestionText: {
    color: "#374151",
    fontSize: 14,
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    width: "48%",
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  productImageWrap: {
    height: 120,
    borderRadius: 8,
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
    fontSize: 14,
    color: "#111827",
    marginTop: 6,
    minHeight: 24,
    fontWeight: "600",
  },
  productPrice: {
    fontSize: 14,
    color: "#10b981",
    marginTop: 2,
    fontWeight: "600",
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  listContent: {
    paddingVertical: 8,
  },
  viewAllBtn: {
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  viewAllText: {
    color: "#111827",
    fontWeight: "600",
  },
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
});

export default SearchOverlay;
