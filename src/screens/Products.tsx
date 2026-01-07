import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, FlatList, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { getProducts, Product, getProductCollections, ProductCollection } from "../api/products";
import CustomHeader from "../components/CustomHeader";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { addToCart, createCart } from "../api/cart";

export default function ProductsScreen({ navigation }: any) {
  const NUM_COLUMNS = 1;
  const [categories, setCategories] = useState<ProductCollection[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ProductCollection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCollection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});
  const { accessToken } = useAuth();
  const { cartId, setCartId, refreshCart } = useCart();

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
    if (!selectedCategory) {
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
    } else {
      if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        const filtered = products.filter(p => p.title.toLowerCase().includes(lower));
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts(products);
      }
    }
  }, [searchQuery, categories, selectedCategory, products]);

  useLayoutEffect(() => {
    navigation.setOptions({
        headerTitle: () => (
            <CustomHeader 
                title={selectedCategory ? selectedCategory.categoryTitle : "Collections"} 
                searchEnabled={true} 
                onSearch={setSearchQuery} 
            />
        ),
        headerStyle: {
            height: 120,
        }
    });
  }, [navigation, selectedCategory]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickAddToCart = async (item: Product) => {
    if (addingToCartId) return;
    setAddingToCartId(item.id);
    const token = accessToken || undefined;
    try {
      if (!cartId) {
        const res = await createCart(item.variantId, 1, token);
        if (res && res.id) {
          await setCartId(res.id);
          await refreshCart(res.id);
          showSuccessAlert();
        } else {
            throw new Error("Failed to create cart");
        }
      } else {
        await addToCart(cartId, item.variantId, 1, token);
        await refreshCart(cartId);
        showSuccessAlert();
      }
      setAddedToCart((prev) => ({ ...prev, [item.id]: true }));
    } catch (e) {
      console.error("Quick add to cart failed", e);
      Alert.alert("Error", "Failed to add item to cart. Please try again.");
    } finally {
      setAddingToCartId(null);
    }
  };

  const showSuccessAlert = () => {
    Alert.alert(
      "Success",
      "Item added to cart",
      [
        {
          text: "Continue Shopping",
          style: "cancel"
        },
        {
          text: "Go to Cart",
          onPress: () => navigation.navigate("Cart")
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Product }) => {
    const imageUrl = item.featuredImage?.url;
    const isOut = !item.availableForSale || item.quantityAvailable === 0;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("ProductDetails", { product: item })}
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
            <View style={styles.topActions}>
              <TouchableOpacity
                onPress={() => toggleFavorite(item.id)}
                style={[styles.iconBtn, favorites[item.id] ? styles.iconBtnHighlight : null]}
              >
                <MaterialIcons
                  name={favorites[item.id] ? "favorite" : "favorite-outline"}
                  size={18}
                  color={favorites[item.id] ? "#ef4444" : "#111827"}
                />
              </TouchableOpacity>
              {!isOut && (
                <TouchableOpacity
                  onPress={() => handleQuickAddToCart(item)}
                  style={[styles.iconBtn, (addingToCartId === item.id || addedToCart[item.id]) ? styles.iconBtnHighlight : null]}
                >
                  <MaterialIcons name="add-shopping-cart" size={18} color={(addingToCartId === item.id || addedToCart[item.id]) ? "#25ebbaff" : "#111827"} />
                </TouchableOpacity>
              )}
            </View>
            {isOut && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Out of stock</Text>
              </View>
            )}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {item.variantTitle ? (
            <Text style={styles.variant} numberOfLines={1}>{item.variantTitle}</Text>
          ) : null}

          <Text style={styles.price}>₹{item.price}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderCategory = ({ item }: { item: ProductCollection }) => {
    const imageUrl = item.categoryImage?.url;
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedCategory(item);
          const prods = item.products || [];
          setProducts(prods);
          setFilteredProducts(prods);
          setSearchQuery("");
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>{selectedCategory ? "Loading products..." : "Loading collections..."}</Text>
      </View>
    );
  }

  if (!selectedCategory) {
    return (
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.categoryId}
        renderItem={renderCategory}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={NUM_COLUMNS > 1 ? styles.column : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No collections found</Text>
            <Text style={styles.emptySubtitle}>Try a different search.</Text>
          </View>
        }
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.categoryHeader}>
        <TouchableOpacity onPress={() => { setSelectedCategory(null); setSearchQuery(""); }} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={20} color="#111827" />
          <Text style={styles.backText}>Collections</Text>
        </TouchableOpacity>
        <Text style={styles.categoryTitle}>{selectedCategory.categoryTitle}</Text>
      </View>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={NUM_COLUMNS > 1 ? styles.column : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try a different search.</Text>
          </View>
        }
      />
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
    marginBottom: 12,
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
  iconBtnHighlight: {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
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
  topActions: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  badge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 16,
    color: "#111827",
    marginTop: 8,
    minHeight: 28,
    fontWeight: "600",
    lineHeight: 20,
  },
  variant: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
    lineHeight: 16,
  },
  price: {
    fontSize: 17,
    color: "#10b981",
    marginTop: 4,
    fontWeight: "600",
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
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  categoryTitle: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
});
