import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, StyleSheet, Linking } from "react-native";
import { Product } from "../api/products";
import { addToCart, buyProduct, createCart, getCurrentCartId } from "../api/cart";

export default function ProductDetailsScreen({ route, navigation }: any) {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const increaseQty = () => setQuantity(q => q + 1);
  const decreaseQty = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const cartId = getCurrentCartId();
      if (!cartId) {
        await createCart(product.variantId, quantity);
        Alert.alert("Success", "Cart created and item added!");
      } else {
        await addToCart(cartId, product.variantId, quantity);
        Alert.alert("Success", "Item added to cart!");
      }
    } catch (error) {
      console.error("Add to cart failed", error);
      Alert.alert("Error", "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    setLoading(true);
    try {
      console.log("Buying item:", product.variantId);
      const response = await buyProduct(product.variantId, quantity);
      
      const checkoutUrl = response.data?.checkoutUrl;
      
      if (checkoutUrl) {
        Linking.openURL(checkoutUrl);
      } else {
        console.log("Full Response:", response.data);
        Alert.alert("Error", "No checkout URL returned from server.");
      }
    } catch (error) {
      console.error("Buy product failed", error);
      Alert.alert("Error", "Failed to buy product");
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = product.featuredImage?.url;
  const isOutOfStock = !product.availableForSale || product.quantityAvailable === 0;

  return (
    <ScrollView style={styles.container}>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      )}
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>₹{product.price}</Text>
        
        {isOutOfStock ? (
            <Text style={styles.outOfStockText}>Out of Stock</Text>
        ) : (
            <>
                {/* Quantity Selector */}
                <View style={styles.quantityContainer}>
                    <Text style={styles.qtyLabel}>Quantity:</Text>
                    <View style={styles.qtyControls}>
                        <TouchableOpacity onPress={decreaseQty} style={styles.qtyBtn}>
                            <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{quantity}</Text>
                        <TouchableOpacity onPress={increaseQty} style={styles.qtyBtn}>
                            <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Buttons */}
                <TouchableOpacity 
                    style={[styles.btn, styles.cartBtn]} 
                    onPress={handleAddToCart}
                    disabled={loading}
                >
                    <Text style={styles.btnText}>Add to Cart</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.btn, styles.buyBtn]} 
                    onPress={handleBuyNow}
                    disabled={loading}
                >
                    <Text style={styles.btnText}>{loading ? "Processing..." : "Buy Now"}</Text>
                </TouchableOpacity>
            </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
    backgroundColor: "#f9f9f9",
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  price: {
    fontSize: 20,
    color: "green",
    marginBottom: 20,
  },
  outOfStockText: {
      fontSize: 24,
      color: 'red',
      fontWeight: 'bold',
      marginTop: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  qtyLabel: {
    fontSize: 18,
    marginRight: 15,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  qtyBtn: {
    padding: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qtyText: {
    fontSize: 18,
    paddingHorizontal: 20,
  },
  btn: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  cartBtn: {
    backgroundColor: '#333',
  },
  buyBtn: {
    backgroundColor: '#ff9900',
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
