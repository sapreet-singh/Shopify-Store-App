import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function ContactUs() {
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
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Support</Text>
          <View style={styles.row}>
            <MaterialIcons name="email" size={20} color="#2563eb" style={styles.rowIcon} />
            <Text style={styles.rowText}>sapreetsingh08@gmail.com</Text>
          </View>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => Linking.openURL('mailto:sapreetsingh08@gmail.com')}
          >
            <Text style={styles.primaryBtnText}>Contact Support</Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>Response time is typically within 24–48 hours.</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Address</Text>
          <View style={styles.row}>
            <MaterialIcons name="place" size={20} color="#10b981" style={styles.rowIcon} />
            <Text style={styles.rowText}>
              5 Phase 1 Mohali Village, near me road, Sahibzada Ajit Singh Nagar, PB, 160055, IN
            </Text>
          </View>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Need Help?</Text>
          <Text style={styles.paragraph}>
            Reach out to our support team for any questions about products, orders, or privacy practices.
          </Text>
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rowIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  primaryBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  helperText: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
  },
});
