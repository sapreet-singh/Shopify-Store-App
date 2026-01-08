import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function TermsOfService() {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <Text style={styles.paragraph}>
            These Terms of Service ("Terms") govern your access to and use of the website 
            www.womilys.com ("Website") operated by Womilys ("we", "us", or "our"). By accessing or 
            using the Website, you agree to be bound by these Terms. If you disagree with any part 
            of the Terms, you may not access the Website.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Use of Website</Text>
          <Text style={styles.paragraph}>
            You must be at least 18 years old to use this Website. By using this Website and agreeing 
            to these Terms, you represent that you are at least 18 years of age.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Intellectual Property</Text>
          <Text style={styles.paragraph}>
            The Website and its original content, features, and functionality are owned by Womilys 
            and are protected by international copyright, trademark, patent, trade secret, and 
            other intellectual property laws.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Prohibited Activities</Text>
          <Text style={styles.paragraph}>
            You agree not to engage in activities including but not limited to:
          </Text>
          <Text style={styles.paragraph}>• Violating any applicable laws or regulations.</Text>
          <Text style={styles.paragraph}>• Impersonating any person or entity.</Text>
          <Text style={styles.paragraph}>• Interfering with the Website or related servers.</Text>
          <Text style={styles.paragraph}>• Using bots, scrapers, or automated systems.</Text>
          <Text style={styles.paragraph}>• Uploading viruses or malicious code.</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            In no event shall Womilys or its affiliates be liable for any indirect, incidental, 
            special, consequential, or punitive damages, including loss of profits, data, or goodwill, 
            resulting from your use of or inability to use the Website.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Indemnification</Text>
          <Text style={styles.paragraph}>
            You agree to indemnify Womilys and its affiliates against any claims, damages, or losses 
            arising from your use of the Website or breach of these Terms.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Termination</Text>
          <Text style={styles.paragraph}>
            We may terminate or suspend access to the Website immediately, without prior notice or 
            liability, for any reason including breach of these Terms.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms are governed by the laws of India, without regard to conflict of law rules.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.cardTitle}>Changes</Text>
          <Text style={styles.paragraph}>
            We may modify or replace these Terms at any time. If changes are material, we will try 
            to provide at least 30 days’ notice prior to the new terms taking effect.
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
  headerSpacer: {
    width: 24,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
});
