import React, { useCallback, useState } from "react";
import { View, FlatList, Text, TouchableOpacity, Alert, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { updateCartLine, removeCartLine } from "../api/cart";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CartScreen({ navigation }: any) {
  const { cart, isLoading: ctxLoading, refreshCart, cartId, checkoutUrl } = useCart();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({});
  const insets=useSafeAreaInsets();
//   console.log(insets,"insets ");

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) {
        Alert.alert(
          "Login Required",
          "Cart dekhne ke liye pehle login karein.",
          [
            { 
              text: "Login", 
              onPress: () => navigation.navigate('Shop', { screen: 'Login' })
            },
            { 
              text: "Cancel", 
              style: "cancel",
              onPress: () => navigation.navigate('Shop')
            }
          ]
        );
        return;
      }
      refreshCart();
    }, [refreshCart, accessToken, navigation])
  );

  const handleUpdateQuantity = async (lineId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;

    setUpdatingItems(prev => ({ ...prev, [lineId]: true }));
    try {
        if (cartId) {
            await updateCartLine(cartId, lineId, newQty, accessToken || undefined);
            await refreshCart();
        }
    } catch (error) {
        console.error("Update quantity failed", error);
        Alert.alert("Error", "Failed to update quantity");
    } finally {
        setUpdatingItems(prev => ({ ...prev, [lineId]: false }));
    }
  };

  const handleRemoveItem = async (lineId: string) => {
    Alert.alert(
        "Remove Item",
        "Are you sure you want to remove this item?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Remove", 
                style: "destructive",
                onPress: async () => {
                    setLoading(true);
                    try {
                        if (cartId) {
                            await removeCartLine(cartId, lineId, accessToken || undefined);
                            await refreshCart();
                        }
                    } catch (error) {
                        console.error("Remove item failed", error);
                        Alert.alert("Error", "Failed to remove item");
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]
    );
  };

  const handleCheckout = () => {
      if (!checkoutUrl) {
          Alert.alert("Error", "Checkout URL not available. Please refresh the cart.");
          return;
      }
      navigation.navigate('Shop', { 
          screen: 'Checkout', 
          params: { url: checkoutUrl } 
      });
  };

  if (ctxLoading && cart.length === 0) {
      return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading your cart...</Text>
        </View>
      );
  }

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
            <MaterialIcons name="shopping-cart" size={80} color="#e5e7eb" />
        </View>
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>Looks like you haven't added anything to your cart yet.</Text>
        <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigation.navigate("Shop")}>
            <Text style={styles.shopNowBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shipping = 0; // Placeholder
  const total = subtotal + shipping;

  const renderHeader = () => (
      <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>My Cart</Text>
          <Text style={styles.headerSubtitle}>{cart.reduce((acc, item) => acc + item.qty, 0)} items</Text>
      </View>
  );

  return (
    <View style={[styles.container , {paddingTop: insets.top}]}>
        {renderHeader()}
        <FlatList
            data={cart}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
                const targetId = item.id.toString();
                const isUpdating = updatingItems[targetId];

                return (
                    <View style={styles.cartCard}>
                        <View style={styles.cardImageContainer}>
                             {item.image ? (
                                <Image source={{ uri: item.image }} style={styles.cardImage} />
                             ) : (
                                <View style={[styles.cardImage, styles.placeholderImage]}>
                                    <MaterialIcons name="image-not-supported" size={24} color="#9ca3af" />
                                </View>
                             )}
                        </View>
                        
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.productTitle} numberOfLines={2}>{item.productName}</Text>
                                <TouchableOpacity 
                                    onPress={() => handleRemoveItem(targetId)}
                                    style={styles.deleteBtn}
                                >
                                    <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                            
                            {item.variantTitle && item.variantTitle !== "Default Title" && (
                                <Text style={styles.variantText}>{item.variantTitle}</Text>
                            )}
                            
                            <View style={styles.cardFooter}>
                                <Text style={styles.priceText}>₹{item.price.toFixed(2)}</Text>
                                
                                <View style={styles.quantityControl}>
                                    <TouchableOpacity 
                                        onPress={() => handleUpdateQuantity(targetId, item.qty, -1)}
                                        disabled={isUpdating || item.qty <= 1}
                                        style={[styles.qtyBtn, item.qty <= 1 && styles.qtyBtnDisabled]}
                                    >
                                        <MaterialIcons name="remove" size={16} color={item.qty <= 1 ? "#d1d5db" : "#4b5563"} />
                                    </TouchableOpacity>
                                    
                                    <View style={styles.qtyValueContainer}>
                                        {isUpdating ? (
                                            <ActivityIndicator size="small" color="#2563eb" />
                                        ) : (
                                            <Text style={styles.qtyValue}>{item.qty}</Text>
                                        )}
                                    </View>
                                    
                                    <TouchableOpacity 
                                        onPress={() => handleUpdateQuantity(targetId, item.qty, 1)}
                                        disabled={isUpdating}
                                        style={styles.qtyBtn}
                                    >
                                        <MaterialIcons name="add" size={16} color="#4b5563" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                );
            }}
        />
        
        <View style={styles.checkoutFooter}>  
            <View style={[styles.summaryRow, { marginBottom: 20 }]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity 
                style={[styles.checkoutBtn, (!checkoutUrl || loading) && styles.checkoutBtnDisabled]}
                onPress={handleCheckout}
                disabled={loading || !checkoutUrl}
                activeOpacity={0.9}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <View style={styles.checkoutBtnContent}>
                        <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                        <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                    </View>
                )}
            </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f9fafb', 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
    },
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
    },
    emptyIconContainer: {
        width: 160,
        height: 160,
        backgroundColor: '#f3f4f6',
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    shopNowBtn: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: "#2563eb",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    shopNowBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Header
    headerContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    // List
    listContent: {
        padding: 16,
        paddingBottom: 100, 
    },
    // Cart Card
    cartCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    productTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1,
        marginRight: 8,
        lineHeight: 22,
    },
    deleteBtn: {
        padding: 4,
    },
    variantText: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2563eb',
    },
    // Quantity Control
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 2,
    },
    qtyBtn: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    qtyBtnDisabled: {
        opacity: 0.5,
        backgroundColor: '#f3f4f6',
        elevation: 0,
    },
    qtyValueContainer: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    // Footer
    checkoutFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 15,
        color: '#6b7280',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2563eb',
    },
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginVertical: 12,
    },
    checkoutBtn: {
        backgroundColor: '#2563eb', // Brand blue
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#2563eb",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    checkoutBtnDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    checkoutBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkoutBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginRight: 8,
    },
});
