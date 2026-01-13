import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ToastAndroid, Modal, StatusBar, BackHandler } from "react-native";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getCustomerProfile, getCustomerAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, AddAddressRequest, UpdateAddressRequest, changePassword } from "../api/customer"; 
import CustomHeader from "../components/CustomHeader";

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
  
  const [pwdVisible, setPwdVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const notify = (msg: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert("Success", msg);
    }
  };

  const extractId = (obj: any) => obj?.id || obj?.Id || obj?.addressId;

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
    const normalized = (Array.isArray(addrs) ? addrs : []).map((a: any) => {
      const aid = extractId(a);
      const existing = !!(a?.isDefault || a?.default || a?.isDefaultAddress);
      const computed = defAId ? String(aid) === String(defAId) : existing;
      return { ...a, isDefault: computed };
    });
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

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#f3f4f6");
      }, [])
  );
  useEffect(() => {
    if (activeTab === 'addresses') {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#f3f4f6");
    } else {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#f3f4f6");
    }
  }, [activeTab]);
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (activeTab === 'addresses') {
          setActiveTab('details');
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [activeTab])
  );

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
                    } catch {
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
    } catch {
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
  const listItems = [
    { label: "Track Order", type: "navigate", route: "OrderHistory" },
    { label: "Privacy Policy", type: "navigate", route: "PrivacyPolicy" },
    { label: "Terms of Service", type: "navigate", route: "TermsOfService" },
    { label: "Shipping Policy", type: "navigate", route: "ShippingPolicy" },
    { label: "Contact Us", type: "navigate", route: "ContactUs" },
  ];
  const handleListItemPress = (item: any) => {
    if (item.type === "navigate" && item.route) {
      navigation.navigate(item.route, item.params || {});
      return;
    }
    Alert.alert(item.title, item.message);
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Account" showLogo />
      <View style={styles.contentContainer}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {activeTab === 'details' ? (
                <>
                    <View style={styles.accountHeader}>
                        <View style={styles.accountAvatar}>
                            <Text style={styles.accountAvatarText}>{userInitial}</Text>
                        </View>
                        <View>
                            <Text style={styles.welcomeText}>Welcome {displayName},</Text>
                            <Text style={styles.emailSubText}>{profile?.email || user.email}</Text>
                        </View>
                    </View>

                    <View style={styles.cardList}>
                        <TouchableOpacity style={styles.cardRow} onPress={() => setActiveTab('addresses')}>
                            <View style={styles.cardIcon}>
                                <MaterialIcons name="contact-page" size={20} color="#111827" />
                            </View>
                            <View style={styles.cardTextCol}>
                                <Text style={styles.cardTitle}>Address Book</Text>
                                <Text style={styles.cardSubtitle}>Manage your saved addresses</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={22} color="#9ca3af" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cardRow} onPress={() => navigation.navigate('OrderHistory')}>
                            <View style={styles.cardIcon}>
                                <MaterialIcons name="history" size={20} color="#111827" />
                            </View>
                            <View style={styles.cardTextCol}>
                                <Text style={styles.cardTitle}>Order History</Text>
                                <Text style={styles.cardSubtitle}>View your past orders</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={22} color="#9ca3af" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cardRow} onPress={() => setPwdVisible(true)}>
                            <View style={styles.cardIcon}>
                                <MaterialIcons name="lock" size={20} color="#111827" />
                            </View>
                            <View style={styles.cardTextCol}>
                                <Text style={styles.cardTitle}>Change Password</Text>
                                <Text style={styles.cardSubtitle}>Edit your password</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={22} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.listSection}>
                        {listItems.map((item, idx) => (
                          <View key={item.label}>
                            <TouchableOpacity style={styles.listRow} onPress={() => handleListItemPress(item)}>
                              <Text style={styles.listLabel}>{item.label}</Text>
                            </TouchableOpacity>
                            {idx < listItems.length - 1 && <View style={styles.listDivider} />}
                          </View>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.logoutOutlined} onPress={handleLogout}>
                        <MaterialIcons name="logout" size={18} color="#b91c1c" />
                        <Text style={styles.logoutOutlinedText}>Logout</Text>
                    </TouchableOpacity>
                </>
            ) : (
                /* Addresses Section */
                <View style={styles.addressSection}>
                    <View style={styles.addrHeader}>
                        <TouchableOpacity onPress={() => setActiveTab('details')} style={styles.backBtnSmall}>
                            <MaterialIcons name="arrow-back" size={22} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.addrHeaderTitle}>Manage delivery address</Text>
                    </View>
                    <TouchableOpacity style={styles.addNewBtn} onPress={openAddForm}>
                        <Text style={styles.addNewText}>Add a new address</Text>
                    </TouchableOpacity>

                    {loading && addresses.length === 0 ? (
                        <ActivityIndicator style={styles.loader} size="large" color="#2563eb" />
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
                                        <View style={styles.flex1}>
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

            <View style={styles.footerSpacer} /> 
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
                        <View style={styles.inputGroupHalf}>
                            <Text style={styles.label}>City</Text>
                            <TextInput placeholder="City" style={styles.input} value={form.city} onChangeText={(t) => setForm((f) => ({ ...f, city: t }))} />
                        </View>
                        <View style={styles.inputGroupFlex}>
                            <Text style={styles.label}>State/Province</Text>
                            <TextInput placeholder="State" style={styles.input} value={form.province || ""} onChangeText={(t) => setForm((f) => ({ ...f, province: t }))} />
                        </View>
                    </View>
                    
                    <View style={styles.row}>
                        <View style={styles.inputGroupHalf}>
                            <Text style={styles.label}>Country</Text>
                            <TextInput placeholder="Country" style={styles.input} value={form.country} onChangeText={(t) => setForm((f) => ({ ...f, country: t }))} />
                        </View>
                        <View style={styles.inputGroupFlex}>
                            <Text style={styles.label}>Zip/Postal Code</Text>
                            <TextInput placeholder="Zip Code" style={styles.input} value={form.zip} onChangeText={(t) => setForm((f) => ({ ...f, zip: t }))} />
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
      
      <Modal
        visible={pwdVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPwdVisible(false)}
      >
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
        >
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Change Password</Text>
                    <TouchableOpacity onPress={() => setPwdVisible(false)}>
                        <MaterialIcons name="close" size={24} color="#6b7280" />
                    </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput 
                    placeholder="Enter new password" 
                    style={styles.input} 
                    secureTextEntry 
                    value={newPassword} 
                    onChangeText={setNewPassword} 
                  />
                </View>
                <TouchableOpacity 
                  style={styles.saveBtn} 
                  onPress={async () => {
                    if (!accessToken) return;
                    if (!newPassword) {
                      Alert.alert("Error", "Please enter new password");
                      return;
                    }
                    try {
                      setPwdLoading(true);
                      const res = await changePassword(accessToken, newPassword);
                      const ok = res?.data?.Success ?? true;
                      if (ok) {
                        notify("Password changed successfully");
                        setPwdVisible(false);
                        setNewPassword("");
                      } else {
                        const err = res?.data?.Error || "Failed to change password";
                        Alert.alert("Error", err);
                      }
                    } catch (e: any) {
                      const msg = e?.response?.data?.error || e?.message || "Failed to change password";
                      Alert.alert("Error", msg);
                    } finally {
                      setPwdLoading(false);
                    }
                  }}
                  disabled={pwdLoading}
                >
                  {pwdLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  
  // Auth Screen Styles
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: '#fff' },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "800", color: '#1f2937', marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#6b7280", textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  primaryBtn: { backgroundColor: "#2563eb", width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  secondaryBtn: { backgroundColor: "#fff", width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryBtnText: { color: "#374151", fontWeight: "600", fontSize: 16 },
  
  // Content Container (White part)
  contentContainer: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { paddingBottom: 24 },

  accountHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16, marginTop: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  accountAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  accountAvatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  welcomeText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emailSubText: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  cardList: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  cardRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  cardIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTextCol: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  cardSubtitle: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  listSection: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 4, marginTop: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  listRow: { paddingVertical: 14 },
  listLabel: { fontSize: 15, color: '#1f2937', fontWeight: '500' },
  listDivider: { height: 1, backgroundColor: '#f3f4f6' },

  logoutOutlined: { marginHorizontal: 16, marginTop: 16, borderWidth: 1, borderColor: '#ef4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: '#fff' },
  logoutOutlinedText: { color: '#b91c1c', fontWeight: '700', fontSize: 16 },

  // Address Section Styles
  addressSection: { paddingHorizontal: 16 },
  addrHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  backBtnSmall: { paddingVertical: 6, paddingRight: 6 },
  backTextSmall: { fontSize: 14, color: '#111827', fontWeight: '600' },
  addrHeaderTitle: { fontSize: 16, color: '#111827', fontWeight: '700' },
  addNewBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1f2937', marginBottom: 16 },
  addNewText: { color: '#1f2937', fontWeight: '600', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, color: '#9ca3af', fontSize: 16 },
  addressCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  addressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addressIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  addressType: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  defaultBadge: { backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#fcd34d' },
  defaultBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#d97706' },
  addressBody: { marginBottom: 16 },
  addrLine: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 12 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1f2937', borderRadius: 6 },
  verticalDivider: { width: 1, height: 16, backgroundColor: '#e5e7eb' },
  actionText: { fontSize: 14, fontWeight: '500' },
  actionTextPrimary: { color: '#1f2937', fontWeight: '600' },
  actionTextDanger: { color: '#1f2937', fontWeight: '600' },
  actionTextSuccess: { color: '#059669', fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  formScroll: { maxHeight: 500 },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHalf: {
    marginBottom: 16,
    flex: 1,
    marginRight: 10,
  },
  inputGroupFlex: {
    marginBottom: 16,
    flex: 1,
  },
  row: { flexDirection: 'row' },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  loader: {
    marginTop: 20,
  },
  flex1: {
    flex: 1,
  },
  footerSpacer: {
    height: 40,
  },
  saveBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
