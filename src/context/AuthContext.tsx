import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer } from '../api/customer';

interface AuthContextType {
  user: Customer | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (user: Customer, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Customer | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('accessToken');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          setAccessToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Failed to load auth data", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const login = async (userData: Customer, token: string) => {
    try {
      setUser(userData);
      setAccessToken(token);
      await AsyncStorage.setItem('accessToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      console.error("Login persistence failed", e);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setAccessToken(null);
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
