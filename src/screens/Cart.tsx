import React, { useEffect, useState } from "react";
import { View, FlatList, Text } from "react-native";
import { getCart, CartItem } from "../api/cart";

export default function CartScreen() {
  const userId = 1;

  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    getCart(userId).then(setCart);
  }, []);

  return (
    <FlatList
      data={cart}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={{ padding: 10 }}>
          <Text>{item.productName}</Text>
          <Text>Qty: {item.qty}</Text>
          <Text>₹{item.price}</Text>
        </View>
      )}
    />
  );
}
