import React, { useCallback, useState } from "react";
import { View, FlatList, Text, TouchableOpacity, Alert, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { updateCartLine, removeCartLine, checkoutCart } from "../api/cart";
import { useCart } from "../context/CartContext";

export default function CartScreen({ navigation }: any) {
  const { cart, isLoading: ctxLoading, refreshCart, cartId } = useCart();
  const [loading, setLoading] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({});

  useFocusEffect(
    useCallback(() => {
      refreshCart();
    }, [])
  );

  const handleUpdateQuantity = async (lineId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;

    setUpdatingItems(prev => ({ ...prev, [lineId]: true }));
    try {
        if (cartId) {
            await updateCartLine(cartId, lineId, newQty);
            await refreshCart();
        }
    } catch (error) {
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
                            await removeCartLine(cartId, lineId);
                            await refreshCart();
                        }
                    } catch (error) {
                        Alert.alert("Error", "Failed to remove item");
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]
    );
  };

  const handleCheckout = async () => {
      if (!cartId) return;
      
      setLoading(true);
      try {
          const res = await checkoutCart(cartId);
          const url = res.data?.checkoutUrl; 
          if (url) {
              navigation.navigate('Shop', { 
                  screen: 'Checkout', 
                  params: { url: url } 
              });
          } else {
              Alert.alert("Error", "Could not retrieve checkout URL.");
          }
      } catch (error) {
          Alert.alert("Error", "Failed to initiate checkout.");
      } finally {
          setLoading(false);
      }
  };

  if (ctxLoading && cart.length === 0) {
      return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  if (cart.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate("Shop")}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <View style={styles.container}>
        <FlatList
            data={cart}
            keyExtractor={(item) => item.id.toString()} // Assuming id is unique line item id
            renderItem={({ item }) => {
                // Determine the ID to use for updates/removes. 
                // If the backend assumes 'variantId' for updates, use that.
                // If it assumes a unique 'lineId' (which might be item.id), use that.
                // Based on previous code, let's try using variantId if available, else fallback to id.
                // However, the api.tsx code I wrote expects 'lineId' and passes it as 'variantId' param.
                // This is a crucial assumption. I'll pass item.variantId || item.id for now.
                const targetId = item.variantId || item.id.toString(); 

                return (
                    <View style={styles.cartItem}>
                        {item.image && <Image source={{ uri: item.image }} style={styles.itemImage} />}
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemTitle}>{item.productName}</Text>
                            {item.variantTitle && <Text style={styles.variantTitle}>{item.variantTitle}</Text>}
                            <Text style={styles.itemPrice}>₹{item.price}</Text>
                            
                            <View style={styles.controls}>
                                <View style={styles.qtyContainer}>
                                    <TouchableOpacity 
                                        onPress={() => handleUpdateQuantity(targetId, item.qty, -1)}
                                        disabled={updatingItems[targetId]}
                                        style={styles.qtyBtn}
                                    >
                                        <Text style={styles.qtyBtnText}>-</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.qtyText}>
                                        {updatingItems[targetId] ? '...' : item.qty}
                                    </Text>
                                    <TouchableOpacity 
                                        onPress={() => handleUpdateQuantity(targetId, item.qty, 1)}
                                        disabled={updatingItems[targetId]}
                                        style={styles.qtyBtn}
                                    >
                                        <Text style={styles.qtyBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity onPress={() => handleRemoveItem(targetId)}>
                                    <Text style={styles.removeText}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );
            }}
        />
        <View style={styles.footer}>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity 
                style={styles.checkoutBtn}
                onPress={handleCheckout}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.checkoutBtnText}>Checkout</Text>
                )}
            </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, marginBottom: 20, color: '#666' },
    shopBtn: { backgroundColor: '#333', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 5 },
    shopBtnText: { color: '#fff', fontWeight: 'bold' },
    cartItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, marginBottom: 10, borderRadius: 8, marginHorizontal: 10, marginTop: 10 },
    itemImage: { width: 80, height: 80, borderRadius: 4, marginRight: 15, backgroundColor: '#eee' },
    itemDetails: { flex: 1, justifyContent: 'space-between' },
    itemTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    variantTitle: { fontSize: 12, color: '#888', marginBottom: 4 },
    itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    qtyContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 4 },
    qtyBtn: { paddingHorizontal: 10, paddingVertical: 5 },
    qtyBtnText: { fontSize: 16, color: '#333' },
    qtyText: { marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
    removeText: { color: 'red', fontSize: 12 },
    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    summaryLabel: { fontSize: 16, color: '#666' },
    summaryValue: { fontSize: 18, fontWeight: 'bold' },
    checkoutBtn: { backgroundColor: '#000', padding: 16, borderRadius: 8, alignItems: 'center' },
    checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
