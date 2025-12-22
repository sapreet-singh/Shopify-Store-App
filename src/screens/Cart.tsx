import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, Text, Button } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { getCart, CartItem, getCurrentCartId } from "../api/cart";

export default function CartScreen() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartId, setLocalCartId] = useState<string | null>(null);

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

  if (!cartId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Your cart is empty (No Cart ID)</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
        <FlatList
        data={cart}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No items in cart</Text>}
        renderItem={({ item }) => (
            <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.productName}</Text>
            <Text>Qty: {item.qty}</Text>
            <Text>₹{item.price}</Text>
            </View>
        )}
        />
    </View>
  );
}
