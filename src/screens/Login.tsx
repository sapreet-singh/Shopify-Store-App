import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { loginCustomer, getCustomerProfile, Customer, forgotPassword } from '../api/customer';
import { useAuth } from '../context/AuthContext';
import { addToCart, createCart, getUserCart } from '../api/cart';
import { useCart } from '../context/CartContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  
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
          const customer = data.customer || (data?.data && data?.data.customer) || data;
          customerData = {
            id: customer?.id || customerData.id,
            displayName: customer?.displayName || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || customerData.displayName,
            email: customer?.email || customerData.email,
            firstName: customer?.firstName,
            lastName: customer?.lastName
          };
        } catch {}
        await login(customerData as any, accessToken);

        // Fetch user's existing cart
        if (customerData.id && customerData.id !== 'unknown') {
          try {
             const userCart = await getUserCart(customerData.id, accessToken);
             if (userCart && userCart.cartID) {
                console.log("Restoring user cart:", userCart.cartID);
                await setCartId(userCart.cartID);
                await refreshCart(userCart.cartID);
             }
          } catch (e) {
             console.log("Failed to load user cart", e);
          }
        }
        
        if (pendingItem) {
           await handlePendingItem(accessToken);
        } else {
           navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
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
          navigation.navigate('Home');
      }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconCircle}>
               <MaterialIcons name="lock-outline" size={40} color="#2563eb" />
            </View>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity style={styles.forgotPassword} onPress={() => setForgotVisible(true)}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

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
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register', { pendingItem })}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <Modal
        visible={forgotVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setForgotVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setForgotVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#94a3b8"
                value={forgotEmail}
                onChangeText={setForgotEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => handleForgotSubmit(forgotEmail, setForgotLoading, setForgotVisible)}
              disabled={forgotLoading}
            >
              {forgotLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Email</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const handleForgotSubmit = async (
  emailValue: string,
  setLoadingFn: (v: boolean) => void,
  setVisibleFn: (v: boolean) => void
) => {
  if (!emailValue) {
    Alert.alert('Error', 'Please enter your email');
    return;
  }
  setLoadingFn(true);
  try {
    const res = await forgotPassword(emailValue);
    const ok = res?.data?.Success ?? true;
    if (ok) {
      Alert.alert('Success', 'Password reset email sent');
      setVisibleFn(false);
    } else {
      const err = res?.data?.Error || 'Failed to send reset';
      Alert.alert('Error', err);
    }
  } catch (e: any) {
    Alert.alert('Error', e?.response?.data?.error || e?.message || 'Failed to send reset');
  } finally {
    setLoadingFn(false);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    height: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2563eb',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#64748b',
    fontSize: 16,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
});
