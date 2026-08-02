import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useMenu } from '../hooks/useMenu';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MenuScreen() {
  const { menuItems, isLoading, error, refreshMenu } = useMenu();

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>
      <Text style={styles.price}>₺{item.price.toFixed(2)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Menü</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
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
              <Text style={styles.emptyText}>Henüz menüye ürün eklenmemiş.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#8E8E93',
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A84FF',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
