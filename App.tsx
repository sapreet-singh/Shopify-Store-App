import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { enableScreens } from "react-native-screens";
import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";

enableScreens();

import ProductsStack from "./src/navigation/ProductsStack";
import CartScreen from "./src/screens/Cart";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: false, // Stack navigator has its own header
              tabBarActiveTintColor: "blue",
              tabBarInactiveTintColor: "gray",
            }}
          >
            <Tab.Screen name="Shop" component={ProductsStack} />
            <Tab.Screen 
              name="Cart" 
              component={CartScreen} 
              options={{ 
                headerShown: true,
                tabBarBadge: undefined
              }} 
            />
          </Tab.Navigator>
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}
