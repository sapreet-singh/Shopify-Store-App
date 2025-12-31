import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { enableScreens } from "react-native-screens";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";

import ProductsStack from "./src/navigation/ProductsStack";
import CartScreen from "./src/screens/Cart";
import ProfileScreen from "./src/screens/Profile";

enableScreens();

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,

              tabBarActiveTintColor: "#2563eb",
              tabBarInactiveTintColor: "#9ca3af",

              tabBarLabelStyle: {
                fontSize: 12,
              },

              tabBarIcon: ({ focused, color, size }) => {
                let iconName: string = "home";
                if (route.name === "Shop") {
                  iconName = "store";
                } else if (route.name === "Cart") {
                  iconName = "shopping-cart";
                } else if (route.name === "Profile") {
                  iconName = focused
                    ? "account-circle"
                    : "person-outline";
                }

                return (
                  <MaterialIcons
                    name={iconName}
                    size={size}
                    color={color}
                  />
                );
              },
            })}
          >
            <Tab.Screen name="Shop" component={ProductsStack} />

            <Tab.Screen
              name="Cart"
              component={CartScreen}
              options={{ headerShown: true }}
            />

            <Tab.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ headerShown: true }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}
