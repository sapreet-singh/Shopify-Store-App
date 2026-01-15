import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface CustomHeaderProps {
  title?: string;
  showLogo?: boolean;
  onSearch?: (query: string) => void;
  searchEnabled?: boolean;
  value?: string;
  onFocus?: () => void;
  onSubmit?: (query: string) => void;
  showCart?: boolean;
  cartCount?: number;
  onCartPress?: () => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ 
  title, 
  showLogo = true, 
  onSearch, 
  searchEnabled = false,
  value,
  onFocus,
  onSubmit,
  showCart = false,
  cartCount = 0,
  onCartPress
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleContainer}>
          {showLogo && (
            <MaterialIcons name="storefront" size={24} color="#2563eb" style={styles.icon} />
          )}
          <Text style={styles.title}>{title || "PEEPERLY"}</Text>
        </View>
        {showCart && (
          <TouchableOpacity style={styles.cartBtn} activeOpacity={0.8} onPress={onCartPress}>
            <MaterialIcons name="shopping-cart" size={22} color="#111827" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {searchEnabled && (
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            placeholder="What are you looking for?"
            style={styles.searchInput}
            onChangeText={onSearch}
            value={value}
            onFocus={onFocus}
            returnKeyType="search"
            onSubmitEditing={(e) => onSubmit?.(e.nativeEvent.text)}
            placeholderTextColor="#9ca3af"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '100%',
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 64,
    paddingHorizontal: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 43,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#1f2937',
    fontSize: 14,
    padding: 0,
  },
});

export default CustomHeader;
