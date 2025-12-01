import React, { useEffect, useState } from "react";
import { View, FlatList, Text, Image, TouchableOpacity } from "react-native";
import { getProducts, Product } from "../api/products";
import { addToCart } from "../api/cart";

export default function ProductsScreen() {
  const userId = 1;
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const handleAdd = async (productId: number) => {
    await addToCart(userId, productId, 1);
  };

  const renderItem = ({ item }: { item: Product }) => {
    const imageUrl = item?.image?.src || item?.images?.[0]?.src || "";

    return (
      <View style={{ padding: 15, marginBottom: 20, backgroundColor: "#fff", borderRadius: 8 }}>
        
        {/* IMAGE FIX */}
        {imageUrl !== "" && (
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: "100%",
              height: 200,
              resizeMode: "contain",
              backgroundColor: "#f3f3f3",
              borderRadius: 8,
            }}
          />
        )}

        <Text style={{ fontSize: 18, marginTop: 10 }}>{item.title}</Text>
        <Text style={{ fontSize: 16, color: "green" }}>
          ₹{item.variants?.[0]?.price || "0"}
        </Text>

        <TouchableOpacity
          onPress={() => handleAdd(item.id)}
          style={{
            marginTop: 10,
            backgroundColor: "black",
            padding: 10,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>Add to Cart</Text>
        </TouchableOpacity>

      </View>
    );
  };

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
    />
  );
}
