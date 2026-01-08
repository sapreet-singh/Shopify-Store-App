import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import 'react-native-gesture-handler';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { enableScreens } from "react-native-screens";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import { useAuth } from "./src/context/AuthContext";
import { useCart } from "./src/context/CartContext";

import ProductsStack from "./src/navigation/ProductsStack";
import CartScreen from "./src/screens/Cart";
import ProfileStack from "./src/navigation/ProfileStack";
import CustomHeader from "./src/components/CustomHeader";
import { StatusBar } from "react-native";

enableScreens();

const Tab = createBottomTabNavigator();

function AppTabs() {
  const { accessToken } = useAuth();
  const { cartCount } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#9ca3af",
        headerTitle: () => <CustomHeader title="Shopify Store" />,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = "home";
          if (route.name === "Shop") {
            iconName = "store";
          } else if (route.name === "Cart") {
            iconName = "shopping-cart";
          } else if (route.name === "Profile") {
            iconName = focused ? "account-circle" : "person-outline";
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Shop" component={ProductsStack} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ 
          headerShown: false,
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!accessToken) {
              e.preventDefault();
              navigation.navigate("Shop", { screen: "Login" });
            }
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <StatusBar backgroundColor="#f3f4f6" barStyle="dark-content" />
          <AppTabs />
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}
