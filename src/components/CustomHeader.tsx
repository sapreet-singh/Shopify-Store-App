import React from 'react';
import { View, Text, StyleSheet, TextInput, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface CustomHeaderProps {
  title?: string;
  showLogo?: boolean;
  onSearch?: (query: string) => void;
  searchEnabled?: boolean;
  value?: string;
  onFocus?: () => void;
  onSubmit?: (query: string) => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ 
  title, 
  showLogo = true, 
  onSearch, 
  searchEnabled = false,
  value,
  onFocus,
  onSubmit
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        {showLogo && (
          <MaterialIcons name="storefront" size={24} color="#2563eb" style={styles.icon} />
        )}
        <Text style={styles.title}>{title || "Shopify Store"}</Text>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    width: '100%',
    height: 64,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
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
