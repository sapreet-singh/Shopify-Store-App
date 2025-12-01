import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { enableScreens } from "react-native-screens";
enableScreens();

import ProductsScreen from "./src/screens/Products";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: "blue",
          tabBarInactiveTintColor: "gray",
        }}
      >
        <Tab.Screen name="Products" component={ProductsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
