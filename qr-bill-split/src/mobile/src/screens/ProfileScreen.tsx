import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

interface Props {
  onBack: () => void;
  currencySymbol: string;
}

export default function ProfileScreen({ onBack, currencySymbol }: Props) {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await ApiService.getHistory();
      if (res.success && res.history) {
        setHistory(res.history);
      }
      
      const methodsRes = await ApiService.getPaymentMethods();
      if (methodsRes.success && methodsRes.methods) {
        setPaymentMethods(methodsRes.methods);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = history.reduce((sum, item) => sum + item.price, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={28} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Total Spent</Text>
          <Text style={styles.statsValue}>{currencySymbol}{totalSpent.toFixed(2)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
        {paymentMethods.length === 0 ? (
          <Text style={styles.emptyTextSub}>No saved cards.</Text>
        ) : (
          paymentMethods.map((method, idx) => (
            <View key={method.id} style={styles.historyItem}>
              <View style={styles.historyItemLeft}>
                <View style={styles.historyIcon}>
                  <Ionicons name="card" size={20} color="#0A84FF" />
                </View>
                <View>
                  <Text style={styles.historyItemName}>{method.cardBrand}</Text>
                  <Text style={styles.historyItemTable}>**** **** **** {method.cardLastFour}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Order History</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#0A84FF" style={{marginTop: 40}} />
        ) : history.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>No past receipts found.</Text>
          </View>
        ) : (
          history.map((item, idx) => (
            <View key={item.id + '-' + idx} style={styles.historyItem}>
              <View style={styles.historyItemLeft}>
                <View style={styles.historyIcon}>
                  <Ionicons name="restaurant" size={20} color="#0A84FF" />
                </View>
                <View>
                  <Text style={styles.historyItemName}>{item.name}</Text>
                  <Text style={styles.historyItemTable}>{item.tableName}</Text>
                </View>
              </View>
              <Text style={styles.historyItemPrice}>{currencySymbol}{item.price.toFixed(2)}</Text>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { padding: 8 },
  logoutButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  content: { padding: 20 },
  profileCard: { alignItems: 'center', marginBottom: 32 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0A84FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  userName: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
  userEmail: { fontSize: 15, color: '#8E8E93' },
  statsCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 20, alignItems: 'center', marginBottom: 32, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statsLabel: { fontSize: 14, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  statsValue: { fontSize: 36, fontWeight: '900', color: '#32D74B' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 16 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 16 },
  emptyTextSub: { fontSize: 14, color: '#8E8E93', marginBottom: 16 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  historyItemLeft: { flexDirection: 'row', alignItems: 'center' },
  historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5F1FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  historyItemName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  historyItemTable: { fontSize: 13, color: '#8E8E93' },
  historyItemPrice: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' }
});
