import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, Alert, FlatList, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ToastAndroid, SafeAreaView, Dimensions, Modal, Image, StatusBar } from "react-native";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNavigation } from "@react-navigation/native";
import { getCustomerProfile, getCustomerAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, AddAddressRequest, UpdateAddressRequest } from "../api/customer";

const { width } = Dimensions.get('window');

const STATIC_ORDERS = [
    { id: '101', item: 'Nike Air Max', price: '$120.00', date: 'Jan 12, 2025', status: 'Delivered', color: '#10b981' },
    { id: '102', item: 'Leather Jacket', price: '$250.00', date: 'Dec 28, 2024', status: 'In Transit', color: '#f59e0b' },
    { id: '103', item: 'Smart Watch', price: '$199.00', date: 'Dec 15, 2024', status: 'Cancelled', color: '#ef4444' },
];

const MENU_ITEMS = [
    { id: 'payment', icon: 'credit-card', label: 'Payment Methods', subtitle: 'Visa **42' },
    { id: 'notif', icon: 'notifications', label: 'Notifications', subtitle: 'On' },
    { id: 'lang', icon: 'language', label: 'Language', subtitle: 'English' },
    { id: 'privacy', icon: 'lock', label: 'Privacy Policy', subtitle: '' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, accessToken, logout } = useAuth();
  const { setCartId } = useCart();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editMode, setEditMode] = useState<null | string>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'addresses'>('details'); // Tab state
  const [form, setForm] = useState<AddAddressRequest>({
    address1: "",
    address2: "",
    city: "",
    province: "",
    country: "",
    zip: "",
    phone: "",
  });

  const notify = (msg: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert("Success", msg);
    }
  };

  const extractId = (obj: any) => obj?.id || obj?.Id || obj?.addressId;
  const normalizeAddresses = (customer: any, list: any[], defIdOverride?: string) => {
    const defObj = customer?.defaultAddress || customer?.DefaultAddress;
    const defId = defIdOverride ?? extractId(defObj);
    return (Array.isArray(list) ? list : []).map((a) => {
      const aid = extractId(a);
      const existing = !!(a?.isDefault || a?.default || a?.isDefaultAddress);
      const computed = defId ? String(aid) === String(defId) : existing;
      return { ...a, isDefault: computed };
    });
  };

  const refreshAll = useCallback(async (token: string) => {
    const [profRes, addrRes] = await Promise.all([getCustomerProfile(token), getCustomerAddresses(token)]);
    const pData = profRes?.data || {};
    const customer = pData.customer || pData.data || pData;
    setProfile(customer);
    const aData = addrRes?.data || {};
    const defAObj = aData?.defaultAddress || aData?.DefaultAddress || aData?.data?.defaultAddress;
    const defAId = extractId(defAObj);
    const addrs = Array.isArray(aData)
      ? aData
      : (aData.addresses || aData.data?.addresses || customer?.addresses || []);
    const normalized = normalizeAddresses(customer, Array.isArray(addrs) ? addrs : [], defAId);
    setAddresses(normalized);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    refreshAll(accessToken)
      .catch(() => {
      })
      .finally(() => setLoading(false));
  }, [accessToken, refreshAll]);

  const handleLogout = async () => {
    Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Logout", 
                style: "destructive",
                onPress: async () => {
                    await logout();
                    await setCartId(null);
                    navigation.navigate("Shop");
                }
            }
        ]
    );
  };

  const openAddForm = () => {
    setEditMode(null);
    setForm({
      address1: "",
      address2: "",
      city: "",
      province: "",
      country: "",
      zip: "",
      phone: "",
    });
    setFormVisible(true);
  };

  const openEditForm = (addr: any) => {
    setEditMode(addr?.id || addr?.addressId || "edit");
    setForm({
      address1: addr?.address1 || "",
      address2: addr?.address2 || "",
      city: addr?.city || "",
      province: addr?.province || "",
      country: addr?.country || "",
      zip: addr?.zip || "",
      phone: addr?.phone || "",
    });
    setFormVisible(true);
  };

  const submitForm = async () => {
    if (!accessToken) return;
    if (!form.address1 || !form.city || !form.country || !form.zip) {
      Alert.alert("Error", "Please fill required fields");
      return;
    }
    try {
      setLoading(true);
      if (editMode) {
        const req: UpdateAddressRequest = { ...(form as UpdateAddressRequest), id: editMode };
        await updateAddress(req);
      } else {
        await addAddress(form);
      }
      await refreshAll(accessToken);
      setFormVisible(false);
      notify(editMode ? "Address updated" : "Address added");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || "Failed to save address";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const removeAddress = async (addr: any) => {
    if (!accessToken) return;
    const id = addr?.id || addr?.addressId;
    if (!id) return;
    Alert.alert(
        "Delete Address",
        "Are you sure?",
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: 'destructive',
                onPress: async () => {
                    try {
                        setLoading(true);
                        setAddresses((prev) => prev.filter((a) => String(a?.id || a?.addressId) !== String(id)));
                        await deleteAddress(String(id), accessToken);
                        await refreshAll(accessToken);
                        notify("Address deleted");
                    } catch (e) {
                        Alert.alert("Error", "Failed to delete address");
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]
    );
  };

  const makeDefault = async (addr: any) => {
    if (!accessToken) return;
    const id = addr?.id || addr?.addressId;
    if (!id) return;
    try {
      setLoading(true);
      setAddresses((prev) =>
        prev.map((a) => {
          const aid = String(a?.id || a?.addressId);
          const isDef = aid === String(id);
          return { ...a, isDefault: isDef };
        })
      );
      await setDefaultAddress({ id: String(id) });
      await refreshAll(accessToken);
      notify("Default address updated");
    } catch (e) {
      Alert.alert("Error", "Failed to set default");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.iconCircle}>
            <MaterialIcons name="person-outline" size={80} color="#9ca3af" />
        </View>
        <Text style={styles.title}>Not Logged In</Text>
        <Text style={styles.subtitle}>Login to view your profile and manage orders.</Text>
        
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("Shop", { screen: "Login" })}>
          <Text style={styles.primaryBtnText}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("Shop", { screen: "Register" })}>
          <Text style={styles.secondaryBtnText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = profile?.displayName || `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || user.email?.split('@')[0];
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : "U";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      {/* Top Banner Background */}
      <View style={styles.topBanner}>
          <View style={styles.topBannerContent}>
              <View style={styles.avatarRow}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{userInitial}</Text>
                    <View style={styles.editBadge}>
                        <MaterialIcons name="edit" size={12} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.userInfo}>
                      <Text style={styles.nameText}>{displayName}</Text>
                      <Text style={styles.emailText}>{profile?.email || user.email}</Text>
                      <View style={styles.memberBadge}>
                          <MaterialIcons name="stars" size={14} color="#fbbf24" />
                          <Text style={styles.memberText}>Gold Member</Text>
                      </View>
                  </View>
              </View>
          </View>
      </View>

      <View style={styles.contentContainer}>
          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
              <TouchableOpacity 
                  style={[styles.tab, activeTab === 'details' && styles.activeTab]} 
                  onPress={() => setActiveTab('details')}
              >
                  <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>My Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                  style={[styles.tab, activeTab === 'addresses' && styles.activeTab]} 
                  onPress={() => setActiveTab('addresses')}
              >
                  <Text style={[styles.tabText, activeTab === 'addresses' && styles.activeTabText]}>Address Book</Text>
              </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {activeTab === 'details' ? (
                <>
                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>12</Text>
                            <Text style={styles.statLabel}>Orders</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>04</Text>
                            <Text style={styles.statLabel}>Wishlist</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>250</Text>
                            <Text style={styles.statLabel}>Points</Text>
                        </View>
                    </View>

                    {/* Recent Orders (Static) */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Orders</Text>
                        <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ordersScroll} contentContainerStyle={{paddingHorizontal: 20}}>
                        {STATIC_ORDERS.map((order) => (
                            <View key={order.id} style={styles.orderCard}>
                                <View style={styles.orderIcon}>
                                    <MaterialIcons name="shopping-bag" size={24} color="#3b82f6" />
                                </View>
                                <View style={styles.orderInfo}>
                                    <Text style={styles.orderItem}>{order.item}</Text>
                                    <Text style={styles.orderPrice}>{order.price}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: order.color + '20' }]}>
                                        <Text style={[styles.statusText, { color: order.color }]}>{order.status}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Menu Options */}
                    <View style={styles.menuList}>
                        {MENU_ITEMS.map((item) => (
                            <TouchableOpacity key={item.id} style={styles.menuRow}>
                                <View style={[styles.menuIconContainer, { backgroundColor: '#f3f4f6' }]}>
                                    <MaterialIcons name={item.icon} size={20} color="#4b5563" />
                                </View>
                                <View style={styles.menuTextContainer}>
                                    <Text style={styles.menuRowLabel}>{item.label}</Text>
                                    {item.subtitle ? <Text style={styles.menuRowSubtitle}>{item.subtitle}</Text> : null}
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            ) : (
                /* Addresses Section */
                <View style={styles.addressSection}>
                    <TouchableOpacity style={styles.addNewBtn} onPress={openAddForm}>
                        <MaterialIcons name="add-circle" size={24} color="#2563eb" />
                        <Text style={styles.addNewText}>Add New Address</Text>
                    </TouchableOpacity>

                    {loading && addresses.length === 0 ? (
                        <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#2563eb" />
                    ) : addresses.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="location-off" size={48} color="#e5e7eb" />
                            <Text style={styles.emptyText}>No addresses saved.</Text>
                        </View>
                    ) : (
                        addresses.map((item, index) => {
                            const isDefault = !!(item?.isDefault || item?.default || item?.isDefaultAddress);
                            return (
                                <View key={String(item?.id || item?.addressId || index)} style={styles.addressCard}>
                                    <View style={styles.addressHeader}>
                                        <View style={styles.addressIcon}>
                                            <MaterialIcons name={isDefault ? "star" : "place"} size={20} color={isDefault ? "#d97706" : "#6b7280"} />
                                        </View>
                                        <View style={{flex: 1}}>
                                            <Text style={styles.addressType}>{item.city}</Text> 
                                        </View>
                                        {isDefault && (
                                            <View style={styles.defaultBadge}>
                                                <Text style={styles.defaultBadgeText}>Default</Text>
                                            </View>
                                        )}
                                    </View>
                                    
                                    <View style={styles.addressBody}>
                                        <Text style={styles.addrLine}>{item?.address1}{item?.address2 ? `, ${item?.address2}` : ""}</Text>
                                        <Text style={styles.addrLine}>{item?.city}{item?.province ? `, ${item?.province}` : ""}</Text>
                                        <Text style={styles.addrLine}>{item?.country} {item?.zip}</Text>
                                        {item.phone ? <Text style={styles.addrLine}>{item.phone}</Text> : null}
                                    </View>

                                    <View style={styles.divider} />

                                    <View style={styles.cardActions}>
                                        <TouchableOpacity onPress={() => openEditForm(item)} style={styles.actionBtn}>
                                            <Text style={styles.actionTextPrimary}>Edit</Text>
                                        </TouchableOpacity>
                                        <View style={styles.verticalDivider} />
                                        <TouchableOpacity onPress={() => removeAddress(item)} style={styles.actionBtn}>
                                            <Text style={styles.actionTextDanger}>Delete</Text>
                                        </TouchableOpacity>
                                        {!isDefault && (
                                            <>
                                            <View style={styles.verticalDivider} />
                                            <TouchableOpacity onPress={() => makeDefault(item)} style={styles.actionBtn}>
                                                <Text style={styles.actionTextSuccess}>Set Default</Text>
                                            </TouchableOpacity>
                                            </>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            )}

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Log Out</Text>
            </TouchableOpacity>
            
            <View style={{height: 40}} /> 
          </ScrollView>
      </View>

      {/* Address Form Modal */}
      <Modal
        visible={formVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFormVisible(false)}
      >
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
        >
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{editMode ? "Edit Address" : "Add New Address"}</Text>
                    <TouchableOpacity onPress={() => setFormVisible(false)}>
                        <MaterialIcons name="close" size={24} color="#6b7280" />
                    </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.formScroll}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address Line 1</Text>
                        <TextInput placeholder="Street Address" style={styles.input} value={form.address1} onChangeText={(t) => setForm((f) => ({ ...f, address1: t }))} />
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address Line 2 (Optional)</Text>
                        <TextInput placeholder="Apartment, Suite, etc." style={styles.input} value={form.address2 || ""} onChangeText={(t) => setForm((f) => ({ ...f, address2: t }))} />
                    </View>
                    
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>City</Text>
                            <TextInput placeholder="City" style={styles.input} value={form.city} onChangeText={(t) => setForm((f) => ({ ...f, city: t }))} />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>State/Province</Text>
                            <TextInput placeholder="State" style={styles.input} value={form.province || ""} onChangeText={(t) => setForm((f) => ({ ...f, province: t }))} />
                        </View>
                    </View>
                    
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Country</Text>
                            <TextInput placeholder="Country" style={styles.input} value={form.country} onChangeText={(t) => setForm((f) => ({ ...f, country: t }))} />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>ZIP Code</Text>
                            <TextInput placeholder="12345" style={styles.input} value={form.zip} onChangeText={(t) => setForm((f) => ({ ...f, zip: t }))} />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput placeholder="+1 234 567 8900" style={styles.input} value={form.phone || ""} onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))} keyboardType="phone-pad" />
                    </View>
                    
                    <TouchableOpacity style={styles.saveBtn} onPress={submitForm} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Address</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1e3a8a" }, // Dark blue background for top part
  
  // Auth Screen Styles
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: '#fff' },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "800", color: '#1f2937', marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#6b7280", textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  primaryBtn: { backgroundColor: "#2563eb", width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  secondaryBtn: { backgroundColor: "#fff", width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryBtnText: { color: "#374151", fontWeight: "600", fontSize: 16 },

  // Top Banner
  topBanner: { height: 220, justifyContent: 'center', paddingHorizontal: 20 },
  topBannerContent: { flexDirection: 'row', alignItems: 'center' },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative', width: 80, height: 80, borderRadius: 40, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#60a5fa' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2563eb', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  userInfo: { marginLeft: 16 },
  nameText: { fontSize: 24, fontWeight: "bold", color: '#fff' },
  emailText: { fontSize: 14, color: "#bfdbfe", marginBottom: 4 },
  memberBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  memberText: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

  // Content Container (White part)
  contentContainer: { flex: 1, backgroundColor: '#f3f4f6', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  scrollContent: { paddingBottom: 20 },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 4, paddingHorizontal: 4, marginHorizontal: 20, marginTop: 20, borderRadius: 12, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#eff6ff' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  activeTabText: { color: '#2563eb' },

  // Stats Row
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, padding: 20, marginBottom: 20, justifyContent: 'space-between', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#e5e7eb' },

  // Sections
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  seeAllText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },

  // Orders
  ordersScroll: { marginBottom: 24 },
  orderCard: { backgroundColor: '#fff', width: 200, padding: 12, borderRadius: 12, marginRight: 12, flexDirection: 'row', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  orderIcon: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  orderInfo: { flex: 1 },
  orderItem: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
  orderPrice: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '700' },

  // Menu List
  menuList: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, paddingVertical: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 20 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuIconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuTextContainer: { flex: 1 },
  menuRowLabel: { fontSize: 15, fontWeight: '500', color: '#1f2937' },
  menuRowSubtitle: { fontSize: 12, color: '#9ca3af' },

  // Address Section Styles
  addressSection: { paddingHorizontal: 20 },
  addNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', borderStyle: 'dashed', marginBottom: 20 },
  addNewText: { marginLeft: 8, color: '#2563eb', fontWeight: '600', fontSize: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, color: '#9ca3af', fontSize: 16 },
  addressCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  addressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addressIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  addressType: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  defaultBadge: { backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#fcd34d' },
  defaultBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#d97706' },
  addressBody: { marginBottom: 16 },
  addrLine: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 12 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  verticalDivider: { width: 1, height: 16, backgroundColor: '#e5e7eb' },
  actionText: { fontSize: 14, fontWeight: '500' },
  actionTextPrimary: { color: '#2563eb', fontWeight: '600' },
  actionTextDanger: { color: '#ef4444', fontWeight: '600' },
  actionTextSuccess: { color: '#059669', fontWeight: '600' },

  // Logout
  logoutBtn: { marginHorizontal: 20, backgroundColor: '#fee2e2', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  logoutBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  formScroll: { maxHeight: 500 },
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937' },
  saveBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
