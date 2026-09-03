import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useMenu } from '../hooks/useMenu';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiAgent } from '../../data/agent/apiAgent';
import { useCart, CartItemOption } from '../../contexts/CartContext';

interface Props {
  tableId?: string;
  onBack?: () => void;
}

interface ProductOption {
  id: string;
  label: string;
  choices: string[];
  isRequired: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  options?: ProductOption[];
}

export default function MenuScreen({ tableId, onBack }: Props) {
  const { menuItems, isLoading, error, refreshMenu } = useMenu();
  const { cartItems, addToCart, removeFromCart, totalItems, totalPrice } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  // Modifier modal state
  const [modifierProduct, setModifierProduct] = useState<MenuItem | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});

  const getCartQuantity = useCallback(
    (productId: string) => {
      return cartItems
        .filter(c => c.productId === productId)
        .reduce((sum, c) => sum + c.quantity, 0);
    },
    [cartItems]
  );

  const handleProductPress = useCallback((product: MenuItem) => {
    if (product.options && product.options.length > 0) {
      // Open modifier modal
      const defaults: Record<string, string> = {};
      product.options.forEach(opt => {
        defaults[opt.label] = opt.choices[0] ?? '';
      });
      setSelectedChoices(defaults);
      setModifierProduct(product);
    } else {
      // Add directly to cart
      addToCart({
        productId: String(product.id),
        name: product.name,
        price: product.price,
        category: product.category,
        selectedOptions: [],
      });
    }
  }, [addToCart]);

  const handleConfirmModifiers = () => {
    if (!modifierProduct) return;
    // Check all required options are selected
    const missing = modifierProduct.options?.filter(
      opt => opt.isRequired && !selectedChoices[opt.label]
    );
    if (missing && missing.length > 0) {
      Alert.alert('Seçim Gerekli', `Lütfen "${missing[0].label}" seçeneğini seçin.`);
      return;
    }
    const optionsList: CartItemOption[] = Object.entries(selectedChoices).map(
      ([label, choice]) => ({ label, choice })
    );
    addToCart({
      productId: String(modifierProduct.id),
      name: modifierProduct.name,
      price: modifierProduct.price,
      category: modifierProduct.category,
      selectedOptions: optionsList,
    });
    setModifierProduct(null);
  };

  const handleConfirmOrder = async () => {
    if (!tableId || cartItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        items: cartItems.map(c => ({
          name: c.name + (c.selectedOptions.length > 0
            ? ` (${c.selectedOptions.map(o => o.choice).join(', ')})`
            : ''),
          price: c.price,
          quantity: c.quantity,
        })),
      };
      await apiAgent.post(`/tables/${tableId}/orders`, payload);
      Alert.alert(
        'Sipariş Gönderildi ✅',
        `${totalItems} ürün — ₺${totalPrice.toFixed(2)}\n\nSiparişiniz mutfağa iletildi!`,
        [{ text: 'Tamam' }]
      );
      // Don't clear cart here — BillSplitScreen will manage that after checkout
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Sipariş gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group items by category
  const groupedData = (menuItems as MenuItem[]).reduce(
    (acc: { title: string; data: MenuItem[] }[], item: MenuItem) => {
      const section = acc.find(s => s.title === item.category);
      if (section) section.data.push(item);
      else acc.push({ title: item.category, data: [item] });
      return acc;
    },
    []
  );

  const flatData: any[] = [];
  groupedData.forEach(section => {
    flatData.push({ type: 'header', title: section.title, id: `header-${section.title}` });
    section.data.forEach(item => flatData.push({ type: 'item', ...item }));
  });

  const renderFlatItem = ({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      );
    }

    const qty = getCartQuantity(String(item.id));
    const hasOptions = item.options && item.options.length > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={hasOptions ? 0.7 : 1}
        onPress={hasOptions ? () => handleProductPress(item) : undefined}
      >
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.productName}>{item.name}</Text>
            {hasOptions && (
              <View style={styles.optionsBadge}>
                <Text style={styles.optionsBadgeText}>Seçenekli</Text>
              </View>
            )}
          </View>
          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          ) : null}
          <Text style={styles.price}>₺{item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.quantityControls}>
          {qty > 0 ? (
            <>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => {
                  // Remove first cart entry for this product
                  const entry = cartItems.find(c => c.productId === String(item.id));
                  if (entry) removeFromCart(entry.cartId);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color="#FF3B30" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
            </>
          ) : null}
          <TouchableOpacity
            style={[styles.qtyButton, styles.addButton]}
            onPress={() => handleProductPress(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color="#0A84FF" />
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Menü</Text>
        {totalItems > 0 ? (
          <View style={styles.cartBadge}>
            <Ionicons name="cart" size={20} color="#0A84FF" />
            <View style={styles.badgeCount}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          </View>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Menu List */}
      <FlatList
        data={flatData}
        keyExtractor={item => item.id?.toString() ?? item.title}
        renderItem={renderFlatItem}
        contentContainerStyle={[styles.listContent, totalItems > 0 && { paddingBottom: 120 }]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshMenu} tintColor="#0A84FF" />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>Henüz menüye ürün eklenmemiş.</Text>
            </View>
          ) : null
        }
      />

      {/* Sticky Cart Footer */}
      {totalItems > 0 && (
        <View style={[styles.cartFooter, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.cartSummary}>
            <View>
              <Text style={styles.cartItemCount}>{totalItems} ürün seçildi</Text>
              <Text style={styles.cartTotal}>₺{totalPrice.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.confirmButton, isSubmitting && { opacity: 0.6 }]}
              onPress={handleConfirmOrder}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={['#34C759', '#30B350']}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.confirmText}>{isSubmitting ? 'Gönderiliyor...' : 'Siparişi Onayla'}</Text>
                {!isSubmitting && <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Product Modifier Modal */}
      <Modal
        visible={!!modifierProduct}
        transparent
        animationType="slide"
        onRequestClose={() => setModifierProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>{modifierProduct?.name}</Text>
            <Text style={styles.modalPrice}>₺{modifierProduct?.price.toFixed(2)}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {modifierProduct?.options?.map(option => (
                <View key={option.label} style={styles.optionGroup}>
                  <Text style={styles.optionLabel}>
                    {option.label}
                    {option.isRequired && <Text style={styles.requiredBadge}> *Zorunlu</Text>}
                  </Text>
                  <View style={styles.choicesRow}>
                    {option.choices.map(choice => {
                      const isSelected = selectedChoices[option.label] === choice;
                      return (
                        <TouchableOpacity
                          key={choice}
                          style={[styles.choiceChip, isSelected && styles.choiceChipSelected]}
                          onPress={() =>
                            setSelectedChoices(prev => ({ ...prev, [option.label]: choice }))
                          }
                        >
                          <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>
                            {choice}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModifierProduct(null)}>
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addToCartBtn} onPress={handleConfirmModifiers}>
                <LinearGradient
                  colors={['#0A84FF', '#0055FF']}
                  style={styles.addToCartGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="cart" size={18} color="#FFF" />
                  <Text style={styles.addToCartText}>Sepete Ekle</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D1D1D6',
  },
  backButton: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: { color: '#0A84FF', fontSize: 16, fontWeight: '600', marginLeft: 2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  cartBadge: { flexDirection: 'row', alignItems: 'center', width: 44, justifyContent: 'flex-end' },
  badgeCount: {
    backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center', marginLeft: -6, marginTop: -10, paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  sectionHeader: { paddingHorizontal: 4, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardInfo: { flex: 1, marginRight: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  productName: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  optionsBadge: { backgroundColor: '#EEF4FF', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  optionsBadgeText: { fontSize: 11, color: '#0A84FF', fontWeight: '600' },
  description: { fontSize: 13, color: '#8E8E93', marginBottom: 6, lineHeight: 18 },
  price: { fontSize: 16, fontWeight: '700', color: '#0A84FF' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyButton: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFE5E5',
    justifyContent: 'center', alignItems: 'center',
  },
  addButton: { backgroundColor: '#0A84FF' },
  qtyText: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', minWidth: 24, textAlign: 'center' },
  errorContainer: { backgroundColor: '#FFE5E5', padding: 12, marginHorizontal: 16, borderRadius: 8, marginTop: 8 },
  errorText: { color: '#FF3B30', fontSize: 15, textAlign: 'center', fontWeight: '500' },
  emptyContainer: { padding: 48, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#8E8E93' },
  cartFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#D1D1D6',
    paddingHorizontal: 16, paddingTop: 12,
  },
  cartSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cartItemCount: { fontSize: 14, fontWeight: '500', color: '#8E8E93' },
  cartTotal: { fontSize: 24, fontWeight: '900', color: '#1C1C1E' },
  confirmButton: { borderRadius: 16, overflow: 'hidden' },
  confirmGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16 },
  confirmText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32, maxHeight: '80%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#D1D1D6', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
  modalPrice: { fontSize: 18, fontWeight: '700', color: '#0A84FF', marginBottom: 20 },
  modalScroll: { flexGrow: 0 },
  optionGroup: { marginBottom: 20 },
  optionLabel: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
  requiredBadge: { color: '#FF3B30', fontSize: 13 },
  choicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#F2F2F7', borderWidth: 1.5, borderColor: '#E5E5EA',
  },
  choiceChipSelected: { backgroundColor: '#EEF4FF', borderColor: '#0A84FF' },
  choiceText: { fontSize: 15, color: '#3C3C43', fontWeight: '500' },
  choiceTextSelected: { color: '#0A84FF', fontWeight: '700' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E5EA',
    justifyContent: 'center', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: '#8E8E93' },
  addToCartBtn: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  addToCartGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, gap: 8 },
  addToCartText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
