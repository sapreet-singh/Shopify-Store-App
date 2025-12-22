import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { registerCustomer, loginCustomer } from '../api/customer';
import { useAuth } from '../context/AuthContext';
import { addToCart, createCart, getCurrentCartId } from '../api/cart';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { login } = useAuth();
  
  const pendingItem = route.params?.pendingItem;

  const handleRegister = async () => {
    if (!email || !password || !firstName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await registerCustomer(email, password, firstName, lastName);  
      console.log("Registration Response:", res.data);

      try {
          const loginRes = await loginCustomer(email, password);
          const { accessToken } = loginRes.data;

          if (accessToken) {
              const customerData = { 
                  email, 
                  displayName: firstName, 
                  firstName, 
                  lastName, 
                  id: 'unknown' 
              };
              
              await login(customerData, accessToken);
              
              if (pendingItem) {
                  await handlePendingItem(accessToken);
              } else {
                  navigation.reset({
                      index: 0,
                      routes: [{ name: 'ProductsList' }],
                  });
              }
          } else {
               Alert.alert("Success", "Account created. Please login manually.");
               navigation.navigate('Login', { pendingItem });
          }

      } catch (loginErr) {
          console.error("Auto-login failed", loginErr);
          Alert.alert("Success", "Account created! Please login.");
          navigation.navigate('Login', { pendingItem });
      }

    } catch (error: any) {
      console.error(error);
      Alert.alert("Registration Failed", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePendingItem = async (token: string) => {
    try {
        const { variantId, quantity } = pendingItem;
        const cartId = getCurrentCartId();
        
        if (!cartId) {
            await createCart(variantId, quantity, token);
        } else {
            await addToCart(cartId, variantId, quantity, token);
        }
        
        Alert.alert("Success", "Registered and item added to cart!");
        navigation.navigate('Cart'); 
        
    } catch (e) {
        console.error("Failed to add pending item", e);
        Alert.alert("Warning", "Registered, but failed to add item to cart.");
        navigation.navigate('ProductsList');
    }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name (Optional)"
        value={lastName}
        onChangeText={setLastName}
      />
      
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
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
            <ActivityIndicator color="#fff" />
        ) : (
            <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => navigation.navigate('Login', { pendingItem })}
        style={styles.linkContainer}
      >
        <Text style={styles.linkText}>Already have an account? Login</Text>
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
