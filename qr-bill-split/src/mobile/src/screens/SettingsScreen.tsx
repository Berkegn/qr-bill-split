import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  currentCurrency: string;
  onCurrencyChange: (currency: string) => void;
  onBack: () => void;
}

export default function SettingsScreen({ currentCurrency, onCurrencyChange, onBack }: Props) {
  const currencies = [
    { label: 'US Dollar', symbol: '$' },
    { label: 'Euro', symbol: '€' },
    { label: 'British Pound', symbol: '£' },
    { label: 'Turkish Lira', symbol: '₺' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Settings</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Base Currency</Text>
          <Text style={styles.cardSubtitle}>Select the default currency for all active table sessions and your merchant dashboard.</Text>

          <View style={styles.currencyList}>
            {currencies.map((curr) => (
              <TouchableOpacity 
                key={curr.symbol}
                style={[
                  styles.currencyRow, 
                  currentCurrency === curr.symbol && styles.currencyRowActive
                ]}
                onPress={() => onCurrencyChange(curr.symbol)}
              >
                <Text style={[
                  styles.currencyLabel, 
                  currentCurrency === curr.symbol && styles.currencyLabelActive
                ]}>
                  {curr.label} ({curr.symbol})
                </Text>
                {currentCurrency === curr.symbol && (
                  <Ionicons name="checkmark" size={20} color="#0A84FF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Merchant Info</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Restaurant Name</Text>
            <Text style={styles.infoValue}>The Artisan Cafe</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Branch Location</Text>
            <Text style={styles.infoValue}>Downtown 5th Ave</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out (Manager)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
    lineHeight: 20,
  },
  currencyList: {
    gap: 8,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  currencyRowActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3A3A3C',
  },
  currencyLabelActive: {
    color: '#0A84FF',
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#3A3A3C',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 4,
  },
  logoutButton: {
    marginTop: 40,
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  }
});
