import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, Text, Button, Alert, Linking, TouchableOpacity } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { getCart, CartItem, getCurrentCartId, checkoutCart } from "../api/cart";

export default function CartScreen() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartId, setLocalCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    const id = getCurrentCartId();
    setLocalCartId(id);
    if (id) {
      const items = await getCart(id);
      setCart(items);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  const handleCheckout = async () => {
      if (!cartId) return;
      setLoading(true);
      try {
          const res = await checkoutCart(cartId);
          const url = res.data?.checkoutUrl; 
          if (url) {
              Linking.openURL(url);
          } else {
              console.log("Checkout response:", res.data);
              Alert.alert("Error", "Could not retrieve checkout URL.");
          }
      } catch (error) {
          console.error("Checkout error", error);
          Alert.alert("Error", "Failed to initiate checkout.");
      } finally {
          setLoading(false);
      }
  };

  if (!cartId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <FlatList
        data={cart}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No items in cart</Text>}
        renderItem={({ item }) => (
            <View style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.productName}</Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 5}}>
                <Text>Qty: {item.qty}</Text>
                <Text style={{color: 'green', fontWeight: 'bold'}}>₹{item.price}</Text>
            </View>
            </View>
        )}
        />
        <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#eee' }}>
            <TouchableOpacity 
                style={{ backgroundColor: 'black', padding: 15, borderRadius: 8, alignItems: 'center' }}
                onPress={handleCheckout}
                disabled={loading}
            >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                    {loading ? "Processing..." : "Checkout"}
                </Text>
            </TouchableOpacity>
        </View>
    </View>
  );
}
