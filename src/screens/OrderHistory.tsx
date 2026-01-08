import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCustomerOrders, Order } from '../api/orders';

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'FULFILLED':
    case 'DELIVERED':
      return '#10b981'; // Green
    case 'IN_PROGRESS':
    case 'OPEN':
      return '#f59e0b'; // Amber
    case 'CANCELLED':
      return '#ef4444'; // Red
    case 'PAID':
      return '#3b82f6'; // Blue
    default:
      return '#6b7280'; // Gray
  }
};

export default function OrderHistoryScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        const response = await getCustomerOrders(token);
        if (response.data) {
          setOrders(response.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#f3f4f6");
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1f2937" />
      </View>
    );
  }

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
        {orders.length === 0 ? (
           <View style={{ alignItems: 'center', marginTop: 40 }}>
             <Text style={{ color: '#6b7280' }}>No orders found.</Text>
           </View>
        ) : (
          orders.map((order) => {
            const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const statusColor = getStatusColor(order.fulfillmentStatus || order.financialStatus);
            const displayStatus = order.fulfillmentStatus || order.financialStatus;
            
            return (
              <View key={order.orderId} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Order {order.orderName}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.processedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {displayStatus}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.orderItems}>
                  {order.items.map((item, index) => {
                    const imageSrc = String(item?.imageUrl || "").replace(/`/g, "").trim();
                    return (
                      <View key={`${order.orderId}-${index}`} style={styles.orderItem}>
                        {imageSrc ? (
                          <Image source={{ uri: imageSrc }} style={styles.itemImage} />
                        ) : (
                          <View style={styles.itemImagePlaceholder}>
                            <MaterialIcons name="image" size={24} color="#9ca3af" />
                          </View>
                        )}
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemName} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.itemPrice}>Qty: {item.quantity}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.itemsCount}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</Text>
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>
                      {order.currency} {order.totalAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.actionButton, { 
                    borderColor: statusColor,
                    backgroundColor: displayStatus === 'CANCELLED' ? '#fef2f2' : '#fff'
                  }]}
                  disabled={displayStatus === 'CANCELLED'}
                >
                  <Text style={[styles.actionButtonText, { color: statusColor }]}>
                    {displayStatus === 'CANCELLED' ? 'Cancelled' : 'Track Order'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
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
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
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
