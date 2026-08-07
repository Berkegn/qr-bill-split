import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { useMenu } from '../hooks/useMenu';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiAgent } from '../../data/agent/apiAgent';

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
};

interface Props {
  tableId?: string;
  onBack?: () => void;
}

export default function MenuScreen({ tableId, onBack }: Props) {
  const { menuItems, isLoading, error, refreshMenu } = useMenu();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const getCartQuantity = useCallback(
    (productId: number) => {
      const item = cart.find((c) => c.productId === productId);
      return item ? item.quantity : 0;
    },
    [cart]
  );

  const addToCart = useCallback((product: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        return prev.map((c) =>
          c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          category: product.category,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((c) => c.productId !== productId);
      }
      return prev.map((c) =>
        c.productId === productId ? { ...c, quantity: c.quantity - 1 } : c
      );
    });
  }, []);

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
  const totalPrice = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handleConfirmOrder = async () => {
    if (!tableId || cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        items: cart.map(c => ({
          name: c.name,
          price: c.price,
          quantity: c.quantity,
        })),
      };

      console.log('Submitting order:', JSON.stringify(payload, null, 2));
      await apiAgent.post(`/tables/${tableId}/orders`, payload);

      Alert.alert(
        'Sipariş Gönderildi ✅',
        `${totalItems} ürün — ₺${totalPrice.toFixed(2)}\n\nSiparişiniz mutfağa iletildi!`,
        [{ text: 'Tamam' }]
      );
      setCart([]);
    } catch (err: any) {
      console.error('Order submission failed:', err);
      Alert.alert('Hata', err.message || 'Sipariş gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group items by category
  const groupedData = menuItems.reduce(
    (acc: { title: string; data: any[] }[], item: any) => {
      const section = acc.find((s) => s.title === item.category);
      if (section) {
        section.data.push(item);
      } else {
        acc.push({ title: item.category, data: [item] });
      }
      return acc;
    },
    []
  );

  // Flatten for FlatList with section headers
  const flatData: any[] = [];
  groupedData.forEach((section) => {
    flatData.push({ type: 'header', title: section.title, id: `header-${section.title}` });
    section.data.forEach((item) => {
      flatData.push({ type: 'item', ...item });
    });
  });

  const renderFlatItem = ({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      );
    }

    const qty = getCartQuantity(item.id);

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={styles.price}>₺{item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.quantityControls}>
          {qty > 0 ? (
            <>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => removeFromCart(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color="#FF3B30" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
            </>
          ) : null}
          <TouchableOpacity
            style={[styles.qtyButton, styles.addButton]}
            onPress={() => addToCart(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
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
        keyExtractor={(item) => item.id?.toString() ?? item.title}
        renderItem={renderFlatItem}
        contentContainerStyle={[
          styles.listContent,
          totalItems > 0 && { paddingBottom: 120 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshMenu}
            tintColor="#0A84FF"
          />
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
              <Text style={styles.cartItemCount}>{totalItems} ürün</Text>
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
    </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D1D1D6',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
  },
  backText: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  cartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 44,
    justifyContent: 'flex-end',
  },
  badgeCount: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -6,
    marginTop: -10,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    paddingHorizontal: 4,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 6,
    lineHeight: 18,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A84FF',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#0A84FF',
  },
  qtyText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    minWidth: 24,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  cartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D1D1D6',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cartSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartItemCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  cartTotal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  confirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
