import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProductsScreen from "../screens/Products";
import ProductDetailsScreen from "../screens/ProductDetails";
import CheckoutWebview from "../screens/CheckoutWebview";

const Stack = createNativeStackNavigator();

export default function ProductsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProductsList" 
        component={ProductsScreen} 
        options={{ title: "Products" }}
      />
      <Stack.Screen 
        name="ProductDetails" 
        component={ProductDetailsScreen} 
        options={{ title: "Product Details" }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutWebview} 
        options={{ title: "Checkout" }}
      />
    </Stack.Navigator>
  );
}
