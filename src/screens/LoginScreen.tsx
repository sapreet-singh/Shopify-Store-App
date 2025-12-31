import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { loginCustomer, getCustomerProfile, Customer } from '../api/customer';
import { useAuth } from '../context/AuthContext';
import { addToCart, createCart } from '../api/cart';
import { useCart } from '../context/CartContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { login } = useAuth();
  const { cartId, setCartId, refreshCart } = useCart();

  const pendingItem = route.params?.pendingItem;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await loginCustomer(email, password);
      const { accessToken } = res.data;
      
      if (accessToken) {
        let customerData: Customer = { email: email, displayName: email.split('@')[0], id: 'unknown' };
        try {
          const prof = await getCustomerProfile(accessToken);
          const data = prof?.data || {};
          const customer = data.customer || data.data || data;
          if (customer?.email) {
            customerData = {
              id: customer?.id || 'unknown',
              displayName: customer?.displayName || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || email.split('@')[0],
              email: customer?.email,
              firstName: customer?.firstName,
              lastName: customer?.lastName
            };
          }
        } catch {}
        await login(customerData as any, accessToken);
        
        if (pendingItem) {
           await handlePendingItem(accessToken);
        } else {
           navigation.reset({
              index: 0,
              routes: [{ name: 'ProductsList' }],
           });
        }
      } else {
        Alert.alert("Login Failed", "Invalid response from server");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Login Failed", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePendingItem = async (token: string) => {
      try {
          const { variantId, quantity } = pendingItem;
          if (!cartId) {
              const res = await createCart(variantId, quantity, token);
              if (res && res.id) {
                  await setCartId(res.id);
              }
          } else {
              await addToCart(cartId, variantId, quantity, token);
              await refreshCart();
          }
          
          Alert.alert("Success", "Logged in and item added to cart!");
          
          navigation.navigate('Cart'); 
          
      } catch (e) {
          console.error("Failed to add pending item", e);
          Alert.alert("Warning", "Logged in, but failed to add item to cart.");
          navigation.navigate('ProductsList');
      }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
            <ActivityIndicator color="#fff" />
        ) : (
            <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => navigation.navigate('Register', { pendingItem })}
        style={styles.linkContainer}
      >
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: 'blue',
    fontSize: 16,
  },
});
