import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Image, Linking, Modal, Pressable } from 'react-native';
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
      <View style={styles.loadingContainer}>
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
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {orders.length === 0 ? (
           <View style={styles.emptyContainer}>
             <Text style={styles.emptyText}>No orders found.</Text>
           </View>
        ) : (
          orders.map((order) => {
            const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const statusColor = getStatusColor(order.deliveryStatus || order.fulfillmentStatus || order.financialStatus);
            const displayStatus = order.deliveryStatus || order.fulfillmentStatus || order.financialStatus;
            
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
                    borderColor: (displayStatus === 'CANCELLED' || !order.trackingUrl) ? '#e5e7eb' : statusColor,
                    backgroundColor: (displayStatus === 'CANCELLED' || !order.trackingUrl) ? '#f9fafb' : '#fff'
                  }]}
                  disabled={displayStatus === 'CANCELLED' || !order.trackingUrl}
                  onPress={() => {
                    setSelectedOrder(order);
                    setModalVisible(true);
                  }}
                >
                  <Text style={[styles.actionButtonText, { color: (displayStatus === 'CANCELLED' || !order.trackingUrl) ? '#9ca3af' : statusColor }]}>
                    {displayStatus === 'CANCELLED' ? 'Cancelled' : (order.trackingUrl ? 'Track Order' : 'Order Details')}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#1f2937" />
              </Pressable>
            </View>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Status</Text>
                  <View style={styles.statusRow}>
                     <Text style={styles.statusLabel}>Financial:</Text>
                     <View style={[styles.statusBadge, { backgroundColor: '#e0e7ff' }]}>
                        <Text style={[styles.statusText, { color: '#3730a3' }]}>{selectedOrder.financialStatus}</Text>
                     </View>
                  </View>
                  <View style={styles.statusRow}>
                     <Text style={styles.statusLabel}>Fulfillment:</Text>
                     <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                        <Text style={[styles.statusText, { color: '#166534' }]}>{selectedOrder.fulfillmentStatus}</Text>
                     </View>
                  </View>
                   <View style={styles.statusRow}>
                     <Text style={styles.statusLabel}>Delivery:</Text>
                     <View style={[styles.statusBadge, { backgroundColor: '#fef3c7' }]}>
                        <Text style={[styles.statusText, { color: '#92400e' }]}>{selectedOrder.deliveryStatus || 'N/A'}</Text>
                     </View>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Tracking Information</Text>
                  <Text style={styles.detailText}><Text style={styles.boldText}>Tracking Number:</Text> {selectedOrder.trackingNumber || 'N/A'}</Text>
                  <Text style={styles.detailText}><Text style={styles.boldText}>Company:</Text> {selectedOrder.trackingCompany || 'N/A'}</Text>
                  {selectedOrder.trackingUrl ? (
                      <TouchableOpacity onPress={() => {
                          const url = selectedOrder.trackingUrl?.replace(/`/g, "").trim();
                          if (url) Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
                      }}>
                          <Text style={[styles.detailText, styles.linkText]}>Open Tracking Link</Text>
                      </TouchableOpacity>
                  ) : null}
                </View>

                 <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Items</Text>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.modalItem}>
                       <Text style={styles.modalItemName}>{item.title}</Text>
                       <Text style={styles.modalItemQty}>x{item.quantity}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
            
             <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
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
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#6b7280',
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
  trackingInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    width: 100,
    fontSize: 14,
    color: '#6b7280',
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '600',
    color: '#1f2937',
  },
  linkText: {
    color: '#2563eb',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalItemName: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    marginRight: 10,
  },
  modalItemQty: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 10,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

// Component export is already at the top of the file
