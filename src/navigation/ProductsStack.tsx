import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/Home";
import ProductsScreen from "../screens/Products";
import ProductDetailsScreen from "../screens/ProductDetails";
import CheckoutWebview from "../screens/CheckoutWebview";
import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";
import CustomHeader from "../components/CustomHeader";

const Stack = createNativeStackNavigator();

export default function ProductsStack() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ProductList" 
        component={ProductsScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ProductDetails" 
        component={ProductDetailsScreen} 
        options={{ headerTitle: () => <CustomHeader title="Product Details" /> }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutWebview} 
        options={{ headerTitle: () => <CustomHeader title="Checkout" /> }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
