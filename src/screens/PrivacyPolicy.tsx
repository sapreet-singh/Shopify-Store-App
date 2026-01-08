import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function PrivacyPolicy() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <Text style={styles.paragraph}>
            This Privacy Policy describes how Womilys ("we", "us", or "our") collects, uses, shares,
            and protects information obtained from visitors and users ("you" or "your") of the 
            website www.womilys.com ("Website"). By accessing or using our Website, you agree to 
            the terms of this Privacy Policy.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Information We Collect</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Personal Information:</Text> When you visit our Website or make 
            a purchase, we may collect personal information such as your name, email address, 
            shipping address, billing address, and payment details.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Automatically Collected Information:</Text> We may automatically 
            collect information such as your IP address, browser type, operating system, referring URLs, 
            and other technical details.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Cookies:</Text> We use cookies and tracking technologies to enhance 
            browsing experience, analyze trends, track movements, and gather demographic info.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>To Provide Products and Services:</Text> We use your information 
            to fulfill orders, process payments, communicate about orders, and provide customer support.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>To Improve Our Services:</Text> We analyze data to improve Website 
            performance and user experience.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Marketing Communications:</Text> With your consent, we may send 
            promotional emails, offers, and product updates.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Sharing of Information</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Third-Party Service Providers:</Text> We may share your data with 
            service providers who help operate our Website or business.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Legal Compliance:</Text> We may disclose your information if required 
            by law or public authorities.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Data Security</Text>
          <Text style={styles.paragraph}>
            We implement security measures to protect your data; however, no online transmission or 
            storage method is 100% secure.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Your Choices</Text>
          <Text style={styles.paragraph}>
            You can choose not to provide certain information, but this may limit your ability to 
            use some Website features or make purchases.
          </Text>
          <Text style={styles.paragraph}>
            You can opt out of promotional emails anytime by following the instructions in emails or 
            contacting us directly.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Changes to This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We reserve the right to update this Privacy Policy at any time. Changes take effect 
            immediately after being posted on the Website.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { paddingHorizontal: 16, paddingTop: 16 },
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
  bold: { fontWeight: '700' },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
});
