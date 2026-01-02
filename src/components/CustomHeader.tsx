import React from 'react';
import { View, Text, StyleSheet, TextInput, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface CustomHeaderProps {
  title?: string;
  showLogo?: boolean;
  onSearch?: (query: string) => void;
  searchEnabled?: boolean;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ 
  title, 
  showLogo = true, 
  onSearch, 
  searchEnabled = false 
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
            placeholder="Search products..."
            style={styles.searchInput}
            onChangeText={onSearch}
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
    justifyContent: 'center', // Center the title
    marginBottom: 8,
    width: '100%',
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
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    width: '100%', // Ensure it takes full width
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#1f2937',
    fontSize: 14,
    padding: 0, // Reset default padding
  },
});

export default CustomHeader;
