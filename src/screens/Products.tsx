import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, FlatList, Text, Image, TouchableOpacity } from "react-native";
import { getProducts, Product } from "../api/products";
import CustomHeader from "../components/CustomHeader";

export default function ProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getProducts().then((data) => {
        setProducts(data);
        setFilteredProducts(data);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        const filtered = products.filter(p => p.title.toLowerCase().includes(lower));
        setFilteredProducts(filtered);
    } else {
        setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  useLayoutEffect(() => {
    navigation.setOptions({
        headerTitle: () => (
            <CustomHeader 
                title="Shopify Store" 
                searchEnabled={true} 
                onSearch={setSearchQuery} 
            />
        ),
        headerStyle: {
            height: 120, // Make sure there is enough space
        }
    });
  }, [navigation]);

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
      data={filteredProducts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 20 }}
    />
  );
}
