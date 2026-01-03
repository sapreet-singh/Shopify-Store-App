import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { registerCustomer, loginCustomer } from '../api/customer';
import { useAuth } from '../context/AuthContext';
import { addToCart, createCart } from '../api/cart';
import { useCart } from '../context/CartContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { login } = useAuth();
  const { cartId, setCartId, refreshCart } = useCart();
  
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
        if (!cartId) {
            const res = await createCart(variantId, quantity, token);
            if (res && res.id) {
                await setCartId(res.id);
            }
        } else {
            await addToCart(cartId, variantId, quantity, token);
            await refreshCart();
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <View style={styles.iconCircle}>
               <MaterialIcons name="person-add" size={40} color="#2563eb" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfInput]}>
                <MaterialIcons name="person" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor="#94a3b8"
                    value={firstName}
                    onChangeText={setFirstName}
                />
                </View>

                <View style={[styles.inputContainer, styles.halfInput]}>
                <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor="#94a3b8"
                    value={lastName}
                    onChangeText={setLastName}
                />
                </View>
            </View>

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
            
            <TouchableOpacity 
              style={styles.button}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                  <ActivityIndicator color="#fff" />
              ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login', { pendingItem })}>
              <Text style={styles.linkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
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
    marginTop: 8,
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
});
