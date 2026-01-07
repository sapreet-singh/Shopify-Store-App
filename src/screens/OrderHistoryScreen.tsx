import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const ORDERS = [
  { 
    id: 'ORD-2023-001', 
    date: 'Oct 15, 2023', 
    status: 'Delivered', 
    statusColor: '#10b981',
    items: [
      { id: '1', name: 'Nike Air Max', price: 120.00, quantity: 1 },
      { id: '2', name: 'Cotton T-Shirt', price: 29.99, quantity: 2 },
    ],
    total: 179.98
  },
  { 
    id: 'ORD-2023-002', 
    date: 'Sep 28, 2023', 
    status: 'In Transit', 
    statusColor: '#f59e0b',
    items: [
      { id: '3', name: 'Smart Watch', price: 199.00, quantity: 1 },
    ],
    total: 199.00
  },
  { 
    id: 'ORD-2023-003', 
    date: 'Sep 10, 2023', 
    status: 'Cancelled', 
    statusColor: '#ef4444',
    items: [
      { id: '4', name: 'Wireless Earbuds', price: 49.99, quantity: 1 },
      { id: '5', name: 'Phone Case', price: 12.99, quantity: 2 },
    ],
    total: 75.97
  },
];

export default function OrderHistoryScreen() {
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#f3f4f6");
      return () => {
        StatusBar.setBarStyle("light-content");
        StatusBar.setBackgroundColor("#111827");
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {ORDERS.map((order) => {
          const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
          
          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{order.id}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${order.statusColor}20` }]}>
                  <Text style={[styles.statusText, { color: order.statusColor }]}>
                    {order.status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.orderItems}>
                {order.items.map((item, index) => (
                  <View key={`${order.id}-${item.id}`} style={styles.orderItem}>
                    <View style={styles.itemImagePlaceholder}>
                      <MaterialIcons name="image" size={24} color="#9ca3af" />
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemPrice}>${item.price.toFixed(2)} x {item.quantity}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.itemsCount}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</Text>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.actionButton, { 
                  borderColor: order.statusColor,
                  backgroundColor: order.status === 'Cancelled' ? '#fef2f2' : '#fff'
                }]}
                disabled={order.status === 'Cancelled'}
              >
                <Text style={[styles.actionButtonText, { color: order.statusColor }]}>
                  {order.status === 'Cancelled' ? 'Cancelled' : 'Track Order'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 13,
    color: '#6b7280',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 12,
  },
  itemsCount: {
    fontSize: 13,
    color: '#6b7280',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#4b5563',
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// Component export is already at the top of the file
