import React, { useEffect, useState } from "react";
import { View, FlatList, Text, Image, TouchableOpacity } from "react-native";
import { getProducts, Product } from "../api/products";

export default function ProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts().then((data) => {
        setProducts(data);
    }).catch(err => console.error(err));
  }, []);

  const renderItem = ({ item }: { item: Product }) => {
    const imageUrl = item.featuredImage?.url;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("ProductDetails", { product: item })}
        activeOpacity={0.8}
      >
        <View
          style={{
            padding: 15,
            marginBottom: 20,
            backgroundColor: "#fff",
            borderRadius: 8,
          }}
        >
          {imageUrl && (
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

          <Text style={{ fontSize: 18, marginTop: 10 }}>
            {item.title}
          </Text>

          <Text style={{ fontSize: 16, color: "green" }}>
            ₹{item.price}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 20 }}
    />
  );
}
