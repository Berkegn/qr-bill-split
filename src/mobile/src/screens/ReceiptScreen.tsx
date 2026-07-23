import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ReceiptResponse } from '../types';

interface Props {
  receipt: ReceiptResponse;
  currencySymbol: string;
  onDone: () => void;
}

export default function ReceiptScreen({ receipt, currencySymbol, onDone }: Props) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Animated.View style={[styles.successIconContainer, { opacity: opacityValue, transform: [{ scale: scaleValue }] }]}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={64} color="#FFF" />
          </View>
          <Text style={styles.successText}>Payment Successful</Text>
        </Animated.View>

        <Animated.View style={[styles.receiptCard, { opacity: opacityValue, transform: [{ translateY: opacityValue.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }]}>
          <Text style={styles.receiptTitle}>DIGITAL RECEIPT</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Transaction ID</Text>
            <Text style={styles.metaValue}>{receipt.transactionId}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{new Date(receipt.date).toLocaleString()}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Items Paid</Text>
          {receipt.items && receipt.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{currencySymbol}{(item.price || 0).toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{currencySymbol}{(receipt.baseTotal || 0).toFixed(2)}</Text>
          </View>
          
          {(receipt.taxAndTip || 0) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Proportional Tax & Tip</Text>
              <Text style={styles.summaryValue}>{currencySymbol}{(receipt.taxAndTip || 0).toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.dividerSolid} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.grandTotalLabel}>Total Paid</Text>
            <Text style={styles.grandTotalValue}>{currencySymbol}{(receipt.grandTotal || 0).toFixed(2)}</Text>
          </View>
          
          <View style={styles.secureBadge}>
            <Ionicons name="lock-closed" size={14} color="#34C759" />
            <Text style={styles.secureText}> Securely Processed via DemoBank</Text>
          </View>
        </Animated.View>

        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneText}>Leave Table</Text>
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
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  successIconContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#32D74B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#32D74B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  successText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 40,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginVertical: 24,
  },
  dividerSolid: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 15,
    color: '#3A3A3C',
    flex: 1,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  grandTotalLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  grandTotalValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0A84FF',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  secureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  doneButton: {
    backgroundColor: '#1C1C1E',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  doneText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
