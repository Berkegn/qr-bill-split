import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Platform, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import SocketService from '../services/SocketService';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5079/api' : 'http://localhost:5079/api';

type BillItemType = {
  uniqueId: string;
  id: number;
  name: string;
  price: number;
  qty: number;
};

interface Props {
  tableId: string;
  userId: string;
  currencySymbol: string;
  onBack: () => void;
  onCheckoutSuccess?: (receipt: any) => void;
  navigation?: any;
}

// Mock items removed

type SplitMode = 'equal' | 'itemized';

export default function BillSplitScreen({ tableId, currencySymbol, onBack, onCheckoutSuccess, navigation }: Props) {
  const [splitMode, setSplitMode] = useState<SplitMode>('itemized');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [items, setItems] = useState<BillItemType[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  // Menu State
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [menuProducts, setMenuProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        setIsLoadingItems(true);
        // Using tableId or a fallback GUID if undefined to prevent errors during testing
        const currentTableId = tableId || '00000000-0000-0000-0000-000000000000';
        const response = await axios.get(`${BASE_URL}/tables/${currentTableId}`);
        
        if (response.data && response.data.billItems) {
          const fetchedItems = response.data.billItems;
          const unrolled = fetchedItems.flatMap((item: any) => 
            Array.from({ length: item.quantity || 1 }).map((_, idx) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              qty: 1,
              uniqueId: `${item.id}-${idx}`
            }))
          );
          setItems(unrolled);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Failed to fetch table data", error);
        // Silently handle error or show alert, for now let's just leave it empty if failed
        setItems([]);
      } finally {
        setIsLoadingItems(false);
      }
    };
    
    const fetchMenu = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/products`);
        setMenuProducts(res.data);
      } catch (e) {
        console.warn("Failed to fetch menu products", e);
      }
    };

    if (tableId) {
      fetchTableData();
      fetchMenu();
      
      SocketService.connect();
      SocketService.joinTable(tableId);
      
      SocketService.on('OrderUpdated', fetchTableData);
    }

    return () => {
      SocketService.off('OrderUpdated');
    };
  }, [tableId]);
  
  // Roulette State
  const [rouletteModalVisible, setRouletteModalVisible] = useState(false);
  const [rouletteCurrentName, setRouletteCurrentName] = useState("");
  const [rouletteLoser, setRouletteLoser] = useState<{name: string, itemName: string, amount: number} | null>(null);
  
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  
  const myShare = splitMode === 'equal' 
    ? totalAmount / 2 // Mocking 2 people
    : items.filter(i => selectedItemIds.includes(i.uniqueId)).reduce((sum, item) => sum + item.price, 0);

  const toggleItemSelection = (uniqueId: string) => {
    if (splitMode === 'equal') return;
    setSelectedItemIds(prev => 
      prev.includes(uniqueId) ? prev.filter(i => i !== uniqueId) : [...prev, uniqueId]
    );
  };

  const handleCheckout = async () => {
    if (myShare === 0 || isCheckingOut) return;
    
    setIsCheckingOut(true);
    try {
      const selectedItems = items.filter(i => splitMode === 'equal' || selectedItemIds.includes(i.uniqueId));
      const orderItemsPayload = selectedItems.map(item => ({
        productName: item.name,
        price: item.price,
        quantity: 1
      }));
      
      const payload = {
        tableId: tableId || '00000000-0000-0000-0000-000000000000',
        totalAmount: myShare,
        paymentMethod: splitMode === 'equal' ? 'EQUAL_SPLIT' : 'ITEMIZED_SPLIT',
        isSplitPayment: true,
        orderItems: orderItemsPayload
      };

      const response = await axios.post(`${BASE_URL}/receipts/checkout`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200 && response.data.success) {
        Alert.alert("Success", "Payment processed successfully!", [
          { 
            text: "OK", 
            onPress: () => {
               if (onCheckoutSuccess) {
                 onCheckoutSuccess(response.data);
               } else {
                 onBack();
               }
            } 
          }
        ]);
      } else {
         throw new Error(response.data.message || "Checkout failed");
      }
    } catch (error: any) {
      console.error("Checkout error", error);
      Alert.alert("Network Error", error?.message || "Please try again later.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleRoulette = () => {
    setRouletteLoser(null);
    setRouletteModalVisible(true);

    const mockUsers = ["Ahmet", "Ayşe", "Can", "Berke", "Elif"];
    
    // Start rapid cycling animation
    const interval = setInterval(() => {
      setRouletteCurrentName(mockUsers[Math.floor(Math.random() * mockUsers.length)]);
    }, 100);

    // Simulate backend response after 2.5s
    setTimeout(() => {
      clearInterval(interval);
      setRouletteLoser({ name: mockUsers[Math.floor(Math.random() * mockUsers.length)], itemName: "Cheesecake", amount: 210 });
    }, 2500);
  };

  const handleCallWaiter = async () => {
    if (tableId) {
      await SocketService.callWaiter(tableId);
      Alert.alert('Garson Çağrıldı', 'Garsona bildirim gönderildi.');
    }
  };

  const handleOrder = async (itemName: string, price: number) => {
    if (!tableId || isOrdering) return;
    setIsOrdering(true);
    try {
      await axios.post(`${BASE_URL}/receipts/order`, {
        tableId,
        productName: itemName,
        price,
        quantity: 1
      });
      setMenuModalVisible(false);
    } catch (e) {
      console.warn('Failed to place order:', e);
      Alert.alert('Hata', 'Sipariş verilemedi.');
    } finally {
      setIsOrdering(false);
    }
  };

  const renderItem = ({ item }: { item: BillItemType }) => {
    const isSelected = splitMode === 'equal' || selectedItemIds.includes(item.uniqueId);
    
    return (
      <TouchableOpacity 
        style={[styles.itemCard, isSelected && styles.itemCardSelected]} 
        onPress={() => toggleItemSelection(item.uniqueId)}
        activeOpacity={0.8}
        disabled={splitMode === 'equal'}
      >
        <View style={styles.itemLeft}>
          <View style={[styles.qtyBadge, isSelected && styles.qtyBadgeSelected]}>
            <Text style={[styles.qtyText, isSelected && styles.qtyTextSelected]}>{item.qty}x</Text>
          </View>
          <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>{item.name}</Text>
        </View>
        <Text style={[styles.itemPrice, isSelected && styles.itemPriceSelected]}>
          {currencySymbol}{item.price.toFixed(2)}
        </Text>
        
        {splitMode === 'itemized' && (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const groupedProducts = menuProducts.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <View style={styles.container}>
      {/* Sticky Blurry Header */}
      <View style={styles.headerContainer}>
        <BlurView intensity={80} tint="light" style={styles.headerBlur}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => navigation ? navigation.goBack() : onBack()} style={styles.backBtn} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
                <Ionicons name="chevron-back" size={28} color="#1C1C1E" />
              </TouchableOpacity>
              <View style={styles.headerTitles}>
                <Text style={styles.restaurantName}>Starbucks</Text>
                <Text style={styles.tableText}>Table {tableId || '5'}</Text>
              </View>
              <TouchableOpacity style={styles.backBtn} onPress={handleRoulette}>
                <Ionicons name="dice" size={28} color="#FF9500" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </BlurView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Receipt View */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>Your Order</Text>
            <Text style={styles.receiptTotal}>{currencySymbol}{totalAmount.toFixed(2)}</Text>
          </View>
          
          {isLoadingItems ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0A84FF" />
              <Text style={{ marginTop: 10, color: '#8E8E93', fontWeight: '500' }}>Loading bill...</Text>
            </View>
          ) : (
            <FlatList 
              data={items}
              keyExtractor={i => i.uniqueId}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          )}
        </View>

      </ScrollView>

      {/* Floating Action Area */}
      <View style={{ position: 'absolute', bottom: 220, right: 20, zIndex: 100, gap: 12 }}>
        <TouchableOpacity style={styles.fabBtn} onPress={() => setMenuModalVisible(true)}>
          <Ionicons name="fast-food" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fabBtn, { backgroundColor: '#FF3B30' }]} onPress={handleCallWaiter}>
          <Ionicons name="notifications" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.footerContainer}>
        <BlurView intensity={100} tint="light" style={styles.footerBlur}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.footerContent}>
              
              {/* Split Mode Toggles */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, splitMode === 'equal' && styles.toggleBtnActive]}
                  onPress={() => setSplitMode('equal')}
                >
                  <Ionicons name="pie-chart-outline" size={20} color={splitMode === 'equal' ? '#FFF' : '#8E8E93'} />
                  <Text style={[styles.toggleText, splitMode === 'equal' && styles.toggleTextActive]}>Eşit Böl</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.toggleBtn, splitMode === 'itemized' && styles.toggleBtnActive]}
                  onPress={() => setSplitMode('itemized')}
                >
                  <Ionicons name="list-outline" size={20} color={splitMode === 'itemized' ? '#FFF' : '#8E8E93'} />
                  <Text style={[styles.toggleText, splitMode === 'itemized' && styles.toggleTextActive]}>Ürün Seç</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.checkoutRow}>
                <View>
                  <Text style={styles.payLabel}>You're paying</Text>
                  <Text style={styles.payAmount}>{currencySymbol}{myShare.toFixed(2)}</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.checkoutBtn, (myShare === 0 || isCheckingOut) && styles.checkoutBtnDisabled]} 
                  onPress={handleCheckout}
                  disabled={myShare === 0 || isCheckingOut}
                >
                  <LinearGradient
                    colors={myShare > 0 ? ['#0A84FF', '#0055FF'] : ['#E5E5EA', '#E5E5EA']}
                    style={styles.checkoutGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    {isCheckingOut ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Text style={[styles.checkoutBtnText, myShare === 0 ? { color: '#8E8E93' } : {}]}>Pay Now</Text>
                        <Ionicons name="arrow-forward" size={20} color={myShare > 0 ? '#FFF' : '#8E8E93'} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
            </View>
          </SafeAreaView>
        </BlurView>
      </View>

      {/* Roulette Modal */}
      <Modal visible={rouletteModalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          
          <View style={styles.modalContent}>
            {!rouletteLoser ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="dice" size={64} color="#FF9500" style={{ marginBottom: 20 }} />
                <Text style={{ fontSize: 24, color: '#FFF', fontWeight: '800', marginBottom: 12 }}>Rolling the dice...</Text>
                <Text style={{ fontSize: 48, color: '#0A84FF', fontWeight: '900' }}>{rouletteCurrentName}</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ fontSize: 64 }}>🎯</Text>
                <Text style={{ fontSize: 28, color: '#FFF', fontWeight: '900', marginTop: 16, textAlign: 'center' }}>{rouletteLoser.name} is paying!</Text>
                <Text style={{ fontSize: 16, color: '#A0A0A5', textAlign: 'center', marginTop: 8 }}>
                  They just got locked into paying for the <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{rouletteLoser.itemName}</Text> ({currencySymbol}{rouletteLoser.amount.toFixed(2)})
                </Text>
                
                <TouchableOpacity 
                  style={[styles.modalPrimaryButton, { marginTop: 32 }]} 
                  onPress={() => setRouletteModalVisible(false)}
                >
                  <Text style={styles.modalPrimaryText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Menu Modal */}
      <Modal
        visible={menuModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Menü</Text>
            <TouchableOpacity onPress={() => setMenuModalVisible(false)}>
              <Text style={styles.closeButton}>Kapat</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.menuList}>
            {Object.entries(groupedProducts).map(([category, products]: [string, any]) => (
              <View key={category} style={{ marginBottom: 24 }}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {products.map((menuItem: any, idx: number) => (
                  <View key={idx} style={styles.menuItemCard}>
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemName}>{menuItem.name}</Text>
                      <Text style={styles.menuItemDesc}>{menuItem.description}</Text>
                    </View>
                    <View style={styles.menuItemAction}>
                      <Text style={styles.menuItemPrice}>{currencySymbol}{menuItem.price.toFixed(2)}</Text>
                      <TouchableOpacity
                        style={styles.menuAddButton}
                        onPress={() => handleOrder(menuItem.name, menuItem.price)}
                      >
                        <Text style={styles.menuAddButtonText}>Ekle</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ))}
            
            {Object.keys(groupedProducts).length === 0 && (
              <ActivityIndicator size="large" color="#0A84FF" style={{ marginTop: 40 }} />
            )}
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 50,
  },
  headerBlur: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitles: {
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  tableText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 2,
  },
  scrollContent: {
    paddingTop: 120,
    paddingBottom: 240,
    paddingHorizontal: 20,
  },
  receiptCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#F2F2F7',
    borderStyle: 'dashed',
  },
  receiptTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  receiptTotal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 18,
    color: '#0A84FF',
    fontWeight: '600',
  },
  menuList: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9FB',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  menuItemDesc: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  menuItemAction: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 16,
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  menuAddButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  menuAddButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9FB',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemCardSelected: {
    backgroundColor: 'rgba(10, 132, 255, 0.05)',
    borderColor: 'rgba(10, 132, 255, 0.2)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qtyBadge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 12,
  },
  qtyBadgeSelected: {
    backgroundColor: '#0A84FF',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
  },
  qtyTextSelected: {
    color: '#FFF',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  itemNameSelected: {
    color: '#0A84FF',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginRight: 16,
  },
  itemPriceSelected: {
    color: '#0A84FF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 8,
  },
  footerBlur: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  footerContent: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 12 : 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#0A84FF',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8E8E93',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  checkoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  payAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  checkoutBtn: {
    width: 160,
    borderRadius: 20,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  checkoutBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 8,
  },
  checkoutBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    width: '100%',
    borderRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
  modalPrimaryButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  modalPrimaryText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fabBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});
