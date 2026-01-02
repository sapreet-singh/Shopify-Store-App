import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, StyleSheet, FlatList, Dimensions } from "react-native";
import { addToCart, buyProduct, createCart } from "../api/cart";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");
  
  export default function ProductDetailsScreen({ route, navigation }: any) {
    const { product } = route.params;
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isFav, setIsFav] = useState(false);
    const { accessToken } = useAuth();
    const { refreshCart, cartId, setCartId } = useCart();
  
    const increaseQty = () => setQuantity(q => q + 1);
    const decreaseQty = () => setQuantity(q => (q > 1 ? q - 1 : 1));
  
    const handleAddToCart = async () => {
      if (!accessToken) {
          Alert.alert(
              "Login Required",
              "You need to login to add items to cart.",
              [
                  { text: "Cancel", style: "cancel" },
                  { 
                      text: "Login", 
                      onPress: () => navigation.navigate("Login", { 
                          pendingItem: { 
                              variantId: product.variantId, 
                              quantity: quantity 
                          }
                      }) 
                  }
              ]
          );
          return;
      }
  
      setLoading(true);
      try {
        const token = accessToken || undefined;
        
        if (!cartId) {
          const res = await createCart(product.variantId, quantity, token);
          if (res && res.id) {
              await setCartId(res.id);
              await refreshCart();
              Alert.alert("Success", "Cart created and item added!");
              navigation.navigate("Cart");
          } else {
              Alert.alert("Error", "Could not create cart. Please try again.");
              return;
          }
        } else {
          await addToCart(cartId, product.variantId, quantity, token);
          await refreshCart();
          Alert.alert("Success", "Item added to cart!");
          navigation.navigate("Cart");
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
          navigation.navigate("Checkout", { url: checkoutUrl });
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
  
    const images = product?.images?.length ? product.images : (product.featuredImage ? [product.featuredImage] : []);
    const isOutOfStock = !product.availableForSale || product.quantityAvailable === 0;
  
    const renderImageItem = ({ item }: { item: { url: string } }) => (
      <View style={{ width: width, height: 300, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' }}>
         <Image source={{ uri: item.url }} style={styles.image} />
      </View>
    );
  
    return (
      <ScrollView style={styles.container}>
        {/* Image Carousel */}
        {images.length > 0 && (
          <View>
              <FlatList
                data={images}
                renderItem={renderImageItem}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={{ height: 300 }}
              />
              {/* Top actions over image area */}
              <View style={styles.imageTopBar}>
                <View style={[styles.stockPill, { backgroundColor: isOutOfStock ? "#ef4444" : "#10b981" }]}>
                  <Text style={styles.stockPillText}>{isOutOfStock ? "Out of stock" : "In stock"}</Text>
                </View>
                <View style={{ flexDirection: "row" }}>
                  <TouchableOpacity style={styles.roundIcon} onPress={() => setIsFav(!isFav)}>
                    <MaterialIcons name={isFav ? "favorite" : "favorite-outline"} size={20} color={isFav ? "#ef4444" : "#111827"} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.roundIcon} onPress={() => {}}>
                    <MaterialIcons name="share" size={20} color="#111827" />
                  </TouchableOpacity>
                </View>
              </View>
            {images.length > 1 && (
               <View style={styles.paginationHint}>
                   <Text style={styles.paginationText}>{images.length} images</Text>
               </View>
            )}
          </View>
        )}
        
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{product.title}</Text>
          <View style={styles.metaRow}>
            {product.variantTitle ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{product.variantTitle}</Text>
              </View>
            ) : null}
            {typeof product.quantityAvailable === "number" ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{product.quantityAvailable} left</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.price}>₹{product.price}</Text>

          {/* Benefits */}
          <View style={styles.benefitsRow}>
            <View style={styles.benefitItem}>
              <MaterialIcons name="local-shipping" size={18} color="#2563eb" />
              <Text style={styles.benefitText}>Free delivery</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="event-available" size={18} color="#2563eb" />
              <Text style={styles.benefitText}>7-day return</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="verified-user" size={18} color="#2563eb" />
              <Text style={styles.benefitText}>Secure checkout</Text>
            </View>
          </View>

          {/* Expandable Description */}
          {product.description ? (
            <View style={styles.descriptionContainer}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text 
                    style={styles.descriptionText}
                    numberOfLines={isDescriptionExpanded ? undefined : 4}
                >
                    {product.description}
                </Text>
                <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                    <Text style={styles.readMoreText}>
                        {isDescriptionExpanded ? "Show Less" : "Read More"}
                    </Text>
                </TouchableOpacity>
            </View>
          ) : null}
          
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
      width: width, // Use full width
      height: 300,
      resizeMode: "contain",
    },
    imageTopBar: {
      position: "absolute",
      top: 10,
      left: 10,
      right: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    roundIcon: {
      backgroundColor: "rgba(255,255,255,0.9)",
      borderRadius: 16,
      padding: 6,
      marginLeft: 8,
    },
    stockPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
    },
    stockPillText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },
    paginationHint: {
       position: 'absolute',
       top: 10,
       right: 10,
       backgroundColor: 'rgba(0,0,0,0.6)',
       paddingHorizontal: 8,
       paddingVertical: 4,
       borderRadius: 12,
    },
    paginationText: {
        color: '#fff',
        fontSize: 12,
    },
    detailsContainer: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 10,
    },
    metaRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 8,
      flexWrap: "wrap",
    },
    chip: {
      backgroundColor: "#f3f4f6",
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    chipText: {
      color: "#374151",
      fontSize: 12,
      fontWeight: "500",
    },
    price: {
      fontSize: 20,
      color: "green",
      marginBottom: 20,
    },
    benefitsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    benefitItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    benefitText: {
      color: "#374151",
      fontSize: 12,
      fontWeight: "500",
    },
    descriptionContainer: {
        marginBottom: 25,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    descriptionText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    readMoreText: {
        color: 'blue',
        marginTop: 5,
        fontWeight: '500',
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
