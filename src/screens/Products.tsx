import React, { useEffect, useState } from "react";
import { View, FlatList, Text, Image, TouchableOpacity, Alert } from "react-native";
import { getProducts, Product } from "../api/products";
import { addToCart, createCart, buyProduct, getCurrentCartId } from "../api/cart";

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts().then((data) => {
        setProducts(data);
        if (data.length === 0) {
            // Check if we can infer it was an auth error (optional, but helpful)
            // Ideally we'd pass the error state up, but for now let's just warn if empty.
            // console.warn("No products loaded. Check API authentication.");
        }
    }).catch(err => console.error(err));
  }, []);

  const handleAdd = async (variantId: string) => {
    try {
      const cartId = getCurrentCartId();
      if (!cartId) {
        // Create cart with first item
        console.log("Creating cart with item:", variantId);
        await createCart(variantId, 1);
        Alert.alert("Success", "Cart created and item added!");
      } else {
        // Add to existing cart
        console.log("Adding to cart:", cartId, variantId);
        await addToCart(cartId, variantId, 1);
        Alert.alert("Success", "Item added to cart!");
      }
    } catch (error) {
      console.error("Add to cart failed", error);
      Alert.alert("Error", "Failed to add to cart");
    }
  };

  const handleBuy = async (variantId: string) => {
    try {
      console.log("Buying item:", variantId);
      await buyProduct(variantId, 1);
      Alert.alert("Success", "Purchase successful!");
    } catch (error) {
      console.error("Buy product failed", error);
      Alert.alert("Error", "Failed to buy product");
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    const imageUrl = item.featuredImage?.url;

    return (
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

        {!item.availableForSale || item.quantityAvailable === 0 ? (
           <Text style={{ color: 'red', marginTop: 5, fontWeight: 'bold' }}>Out of Stock</Text>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => handleAdd(item.variantId)}
                style={{
                  flex: 1,
                  backgroundColor: "black",
                  padding: 10,
                  borderRadius: 6,
                  marginRight: 5,
                }}
              >
                <Text style={{ color: "white", textAlign: "center" }}>
                  Add to Cart
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleBuy(item.variantId)}
                style={{
                  flex: 1,
                  backgroundColor: "orange",
                  padding: 10,
                  borderRadius: 6,
                  marginLeft: 5,
                }}
              >
                <Text style={{ color: "white", textAlign: "center" }}>
                  Buy Now
                </Text>
              </TouchableOpacity>
          </View>
        )}
      </View>
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
