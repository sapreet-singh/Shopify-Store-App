import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, Alert, FlatList, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { getCustomerProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress, AddAddressRequest, UpdateAddressRequest } from "../api/customer";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, accessToken, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editMode, setEditMode] = useState<null | string>(null);
  const [form, setForm] = useState<AddAddressRequest>({
    address1: "",
    address2: "",
    city: "",
    province: "",
    country: "",
    zip: "",
    phone: "",
  });

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getCustomerProfile(accessToken)
      .then((res) => {
        const data = res?.data || {};
        const customer = data.customer || data.data || data;
        setProfile(customer);
        const addrs = customer?.addresses || data?.addresses || [];
        setAddresses(Array.isArray(addrs) ? addrs : []);
      })
      .catch((e) => {
        Alert.alert("Error", "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleLogout = async () => {
    await logout();
    navigation.navigate("Shop");
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
      const res = await getCustomerProfile(accessToken);
      const data = res?.data || {};
      const customer = data.customer || data.data || data;
      const addrs = customer?.addresses || data?.addresses || [];
      setAddresses(Array.isArray(addrs) ? addrs : []);
      setFormVisible(false);
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
    try {
      setLoading(true);
      await deleteAddress(String(id), accessToken);
      const res = await getCustomerProfile(accessToken);
      const data = res?.data || {};
      const customer = data.customer || data.data || data;
      const addrs = customer?.addresses || data?.addresses || [];
      setAddresses(Array.isArray(addrs) ? addrs : []);
    } catch (e) {
      Alert.alert("Error", "Failed to delete address");
    } finally {
      setLoading(false);
    }
  };

  const makeDefault = async (addr: any) => {
    if (!accessToken) return;
    const id = addr?.id || addr?.addressId;
    if (!id) return;
    try {
      setLoading(true);
      await setDefaultAddress({ id: String(id) });
      const res = await getCustomerProfile(accessToken);
      const data = res?.data || {};
      const customer = data.customer || data.data || data;
      const addrs = customer?.addresses || data?.addresses || [];
      setAddresses(Array.isArray(addrs) ? addrs : []);
    } catch (e) {
      Alert.alert("Error", "Failed to set default");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>You are not logged in</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("Shop", { screen: "Login" })}>
          <Text style={styles.primaryBtnText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate("Shop", { screen: "Register" })}>
          <Text style={styles.linkText}>Create an account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
        <View style={styles.profileCard}>
          <Text style={styles.nameText}>{profile?.displayName || `${profile?.firstName || ""} ${profile?.lastName || ""}` || user.displayName}</Text>
          <Text style={styles.emailText}>{profile?.email || user.email}</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Addresses</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddForm}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {addresses.length === 0 ? (
          <Text style={styles.emptyText}>No addresses found</Text>
        ) : (
          <View>
            {addresses.map((item, index) => {
              const isDefault = !!(item?.isDefault || item?.default || item?.isDefaultAddress);
              return (
                <View key={String(item?.id || item?.addressId || index)} style={styles.addressCard}>
                  <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                    {isDefault && <Text style={styles.defaultBadge}>Default</Text>}
                  </View>
                  <Text style={styles.addrLine}>{item?.address1}{item?.address2 ? `, ${item?.address2}` : ""}</Text>
                  <Text style={styles.addrLine}>{item?.city}{item?.province ? `, ${item?.province}` : ""}</Text>
                  <Text style={styles.addrLine}>{item?.country} {item?.zip}</Text>
                  <View style={styles.addrActions}>
                    <TouchableOpacity onPress={() => openEditForm(item)} style={styles.smallBtn}>
                      <Text style={styles.smallBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeAddress(item)} style={styles.smallBtn}>
                      <Text style={styles.smallBtnText}>Delete</Text>
                    </TouchableOpacity>
                    {!isDefault && (
                      <TouchableOpacity onPress={() => makeDefault(item)} style={styles.smallBtn}>
                        <Text style={styles.smallBtnText}>Make Default</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {formVisible && (
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>{editMode ? "Edit Address" : "Add Address"}</Text>
            <TextInput placeholder="Address 1" style={styles.input} value={form.address1} onChangeText={(t) => setForm((f) => ({ ...f, address1: t }))} />
            <TextInput placeholder="Address 2" style={styles.input} value={form.address2 || ""} onChangeText={(t) => setForm((f) => ({ ...f, address2: t }))} />
            <TextInput placeholder="City" style={styles.input} value={form.city} onChangeText={(t) => setForm((f) => ({ ...f, city: t }))} />
            <TextInput placeholder="Province/State" style={styles.input} value={form.province || ""} onChangeText={(t) => setForm((f) => ({ ...f, province: t }))} />
            <TextInput placeholder="Country" style={styles.input} value={form.country} onChangeText={(t) => setForm((f) => ({ ...f, country: t }))} />
            <TextInput placeholder="ZIP/Postal Code" style={styles.input} value={form.zip} onChangeText={(t) => setForm((f) => ({ ...f, zip: t }))} />
            <TextInput placeholder="Phone" style={styles.input} value={form.phone || ""} onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))} />
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={submitForm}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkBtn} onPress={() => setFormVisible(false)}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  scrollContent: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 20, marginBottom: 12 },
  profileCard: { backgroundColor: "#f8f8f8", padding: 16, borderRadius: 8, marginBottom: 16 },
  nameText: { fontSize: 20, fontWeight: "bold" },
  emailText: { fontSize: 14, color: "#666", marginTop: 4 },
  logoutBtn: { marginTop: 10, alignSelf: "flex-start", backgroundColor: "#000", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6 },
  logoutBtnText: { color: "#fff", fontWeight: "bold" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "600" },
  addBtn: { backgroundColor: "#333", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  addBtnText: { color: "#fff" },
  emptyText: { color: "#666", marginVertical: 12 },
  addressCard: { backgroundColor: "#f7f7f7", padding: 14, borderRadius: 8, marginBottom: 10 },
  addrLine: { fontSize: 14, color: "#333" },
  addrActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 10 },
  defaultBadge: { backgroundColor: "#333", color: "#fff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#e0e0e0", borderRadius: 6, marginLeft: 8 },
  smallBtnText: { color: "#333" },
  formContainer: { marginTop: 10, padding: 14, borderTopWidth: 1, borderTopColor: "#eee" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  formActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  primaryBtn: { backgroundColor: "#000", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "bold" },
  linkBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  linkText: { color: "blue" },
});
