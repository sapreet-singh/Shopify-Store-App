import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import 'react-native-gesture-handler';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { enableScreens } from "react-native-screens";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";

import ProductsStack from "./src/navigation/ProductsStack";
import ProfileStack from "./src/navigation/ProfileStack";
import WishlistScreen from "./src/screens/Wishlist";
import CustomHeader from "./src/components/CustomHeader";
import { StatusBar } from "react-native";

enableScreens();

const Tab = createBottomTabNavigator();

const HeaderTitle = () => <CustomHeader title="Shopify Store" />;

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#9ca3af",
        headerTitle: HeaderTitle,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = "home";
          if (route.name === "Shop") {
            iconName = "store";
          } else if (route.name === "New Arrivals") {
            iconName = "new-releases";
          } else if (route.name === "Collections") {
            iconName = "grid-view";
          } else if (route.name === "Wishlist") {
            iconName = focused ? "favorite" : "favorite-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "account-circle" : "person-outline";
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Shop" component={ProductsStack} />
      <Tab.Screen
        name="New Arrivals"
        component={ProductsStack}
        initialParams={{
          initialRouteName: "ProductList",
          category: {
            categoryId: "new-arrivals",
            categoryTitle: "New Arrivals",
            categoryHandle: "new-arrivals",
            products: [],
          },
          listType: "new-arrivals",
        }}
      />
      <Tab.Screen
        name="Collections"
        component={ProductsStack}
        initialParams={{ initialRouteName: "CollectionsScreen" }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{ headerShown: false }}
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
