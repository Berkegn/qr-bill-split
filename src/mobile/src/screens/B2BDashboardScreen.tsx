import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Vibration, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import ApiService from '../services/api';
import SocketService from '../services/SocketService';
import { TableSession, BillItem } from '../types';

interface Props {
  currencySymbol: string;
  onBack: () => void;
  onSettings: () => void;
}

export default function B2BDashboardScreen({ currencySymbol, onBack, onSettings }: Props) {
  const [tables, setTables] = useState<TableSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Table Details Modal State
  const [selectedTable, setSelectedTable] = useState<TableSession | null>(null);

  useEffect(() => {
    fetchTables();
    setupAdminSocket();

    return () => {
      SocketService.off('AdminTableUpdated');
      SocketService.off('WaiterCalled');
    };
  }, []);

  const fetchTables = async () => {
    try {
      const res = await ApiService.getAllTables();
      if (res.success) setTables(res.tables);
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupAdminSocket = async () => {
    await SocketService.connect();
    await SocketService.joinAdminGroup();
    await SocketService.joinStaffGroup();

    SocketService.on('WaiterCalled', (tId: string) => {
      Vibration.vibrate([1000, 500, 1000]);
      Alert.alert('Garson Çağrısı', `Masa ${tId.substring(0,4)} Garson Çağırıyor!`);
    });

    SocketService.on('AdminTableUpdated', (tableId: string) => {
      // Refresh tables when an update occurs anywhere
      fetchTables();
      // If we are viewing a specific table, we need to update it as well
      setSelectedTable(prev => {
        if (!prev) return null;
        // In a real app we'd fetch the single table or rely on the fetchTables array
        // Since we refresh all, the next fetchTables cycle will naturally update the array
        return prev; 
      });
    });
  };

  useEffect(() => {
    if (selectedTable) {
      const updated = tables.find(t => t.id === selectedTable.id);
      if (updated) setSelectedTable(updated);
    }
  }, [tables]);

  const getTableStatus = (items: BillItem[]) => {
    if (!items || items.length === 0) return 'empty';
    const paidCount = items.filter(i => i.isPaid).length;
    
    if (paidCount === 0) return 'unpaid';
    if (paidCount === items.length) return 'fully_paid';
    return 'partial';
  };

  const renderTableCard = (table: TableSession) => {
    const status = getTableStatus(table.billItems);
    
    let borderColor = '#3A3A3C';
    let bgColor = 'rgba(255,255,255,0.05)';
    let statusText = 'Empty';

    if (status === 'unpaid') {
      borderColor = '#FF453A';
      bgColor = 'rgba(255, 69, 58, 0.1)';
      statusText = 'Unpaid';
    } else if (status === 'partial') {
      borderColor = '#FF9F0A';
      bgColor = 'rgba(255, 159, 10, 0.1)';
      statusText = 'Paying...';
    } else if (status === 'fully_paid') {
      borderColor = '#32D74B';
      bgColor = 'rgba(50, 215, 75, 0.1)';
      statusText = 'Cleared';
    }

    return (
      <TouchableOpacity 
        key={table.id} 
        style={[styles.tableCard, { borderColor, backgroundColor: bgColor }]}
        onPress={() => setSelectedTable(table)}
      >
        <Text style={styles.tableName}>{table.tableName}</Text>
        <Text style={styles.tableTotal}>{currencySymbol}{table.totalAmount.toFixed(2)}</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: borderColor }]} />
          <Text style={[styles.statusText, { color: borderColor }]}>{statusText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack}>
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Live Floor</Text>
            <TouchableOpacity onPress={onSettings}>
              <Ionicons name="settings-outline" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.grid}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTables} tintColor="#FFF" />}
          >
            {tables.map(renderTableCard)}
            {tables.length === 0 && !loading && (
              <Text style={{color: '#8E8E93', textAlign: 'center', marginTop: 40}}>No active tables found.</Text>
            )}
          </ScrollView>

          {/* Table Details Modal */}
          {selectedTable && (
            <View style={StyleSheet.absoluteFill}>
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
              <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' }}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setSelectedTable(null)}>
                    <Ionicons name="close" size={28} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.title}>{selectedTable.tableName}</Text>
                  <View style={{width: 28}} />
                </View>
                
                <ScrollView contentContainerStyle={{ padding: 24 }}>
                  {selectedTable.billItems.map(item => (
                    <View key={item.id} style={styles.detailItemRow}>
                      <View>
                        <Text style={[styles.detailItemName, item.isPaid && { color: '#8E8E93' }]}>{item.name}</Text>
                        <Text style={styles.detailItemPrice}>{currencySymbol}{item.price.toFixed(2)}</Text>
                      </View>
                      {item.isPaid ? (
                        <View style={styles.badgePaid}>
                          <Text style={styles.badgeTextPaid}>Paid ({item.paidByUserId})</Text>
                        </View>
                      ) : item.lockedByUserId ? (
                        <View style={styles.badgeLocked}>
                          <Text style={styles.badgeTextLocked}>Pending ({item.lockedByUserId})</Text>
                        </View>
                      ) : (
                        <View style={styles.badgeUnpaid}>
                          <Text style={styles.badgeTextUnpaid}>Unpaid</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </SafeAreaView>
            </View>
          )}

        </SafeAreaView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  tableCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 2,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  tableTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5EA',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  detailItemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  detailItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5EA',
  },
  badgePaid: {
    backgroundColor: 'rgba(50, 215, 75, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#32D74B',
  },
  badgeTextPaid: { color: '#32D74B', fontSize: 12, fontWeight: '700' },
  badgeLocked: {
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9F0A',
  },
  badgeTextLocked: { color: '#FF9F0A', fontSize: 12, fontWeight: '700' },
  badgeUnpaid: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF453A',
  },
  badgeTextUnpaid: { color: '#FF453A', fontSize: 12, fontWeight: '700' },
});
