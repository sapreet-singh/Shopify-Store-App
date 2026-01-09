import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/Home";
import CollectionsScreen from "../screens/Collections";
import ProductsScreen from "../screens/Products";
import ProductDetailsScreen from "../screens/ProductDetails";
import CheckoutWebview from "../screens/CheckoutWebview";
import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";
import CustomHeader from "../components/CustomHeader";

const Stack = createNativeStackNavigator();

const ProductDetailsHeader = () => <CustomHeader title="Product Details" />;
const CheckoutHeader = () => <CustomHeader title="Checkout" />;

export default function ProductsStack({ route }: any) {
  const initialRouteName = route?.params?.initialRouteName || "Home";
  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Collections"
        component={CollectionsScreen}
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
        options={{ headerTitle: ProductDetailsHeader }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutWebview} 
        options={{ headerTitle: CheckoutHeader }}
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
