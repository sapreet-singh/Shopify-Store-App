import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProductsScreen from "../screens/Products";
import ProductDetailsScreen from "../screens/ProductDetails";
import CheckoutWebview from "../screens/CheckoutWebview";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

const Stack = createNativeStackNavigator();

export default function ProductsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProductsList" 
        component={ProductsScreen} 
        options={{ 
          title: "Products",
          gestureEnabled: false 
        }}
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
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: "Login" }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: "Register" }}
      />
    </Stack.Navigator>
  );
}
