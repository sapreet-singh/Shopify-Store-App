import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function ShippingPolicy() {
  const navigation = useNavigation<any>();

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#f3f4f6');
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <Text style={styles.paragraph}>
            At Womilys, we strive to ensure timely delivery of your orders. However, please note the following shipping policy guidelines.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Shipping Carrier and Delivery Times</Text>
          <Text style={styles.paragraph}>• Orders are shipped via Indian courier service.</Text>
          <Text style={styles.paragraph}>• Shipping times are estimates and may be affected by weather, holidays, or customs delays.</Text>
          <Text style={styles.paragraph}>• Exact delivery times cannot be guaranteed.</Text>
          <Text style={styles.paragraph}>• For expedited shipping, please contact us for availability and pricing.</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Estimated Shipping Times Across India</Text>
          <Text style={styles.paragraph}>• North India: 3–4 Business Days</Text>
          <Text style={styles.paragraph}>• South India: 4–5 Business Days</Text>
          <Text style={styles.paragraph}>• North East: 5–6 Business Days</Text>
          <Text style={styles.paragraph}>• West India: 4–5 Business Days</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Shipping Costs</Text>
          <Text style={styles.paragraph}>• Free Shipping on All Orders.</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Order Processing</Text>
          <Text style={styles.paragraph}>• Please allow 1 day for order processing before shipping.</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Important Notices</Text>
          <Text style={styles.paragraph}>
            • We are not responsible for undeliverable packages due to missing, incomplete, or incorrect address information.
          </Text>
          <Text style={styles.paragraph}>
            • Shipping information is verified with customers during order confirmation to prevent errors.
          </Text>
          <Text style={styles.paragraph}>
            • Costs to reship undeliverable packages will be invoiced to the customer.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Refusal of Delivery</Text>
          <Text style={styles.paragraph}>
            If the order arrives in your city and the customer refuses to accept the package or makes no attempt to receive it, 
            Womilys reserves the right to abandon the package(s) without issuing a refund.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Need Help?</Text>
          <Text style={styles.paragraph}>
            For any assistance or questions regarding our Shipping Policy, feel free to reach out.
          </Text>
          <Text style={styles.paragraph}>Email: care@womilys.com</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
});
