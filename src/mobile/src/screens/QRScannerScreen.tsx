import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  onScanSuccess: (tableId: string) => void;
  onB2BAuth: () => void;
  onProfile: () => void;
  onBack?: () => void;
}

export default function QRScannerScreen({ onScanSuccess, onB2BAuth, onProfile, onBack }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [scannedTableId, setScannedTableId] = useState<string | null>(null);
  const [guestNameInput, setGuestNameInput] = useState('');

  // If permission is loading
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Permission denied / Not requested
  if (!permission.granted) {
    return (
      <LinearGradient colors={['#1a1a24', '#000000']} style={styles.container}>
        <SafeAreaView style={styles.permissionContainer}>
          <BlurView intensity={80} tint="dark" style={styles.permissionCard}>
            <Ionicons name="camera-outline" size={64} color="#0A84FF" />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionSub}>
              We need access to your camera so you can scan table QR codes and split bills.
            </Text>
            <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
              <Text style={styles.permissionBtnText}>Request Permission</Text>
            </TouchableOpacity>
          </BlurView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const checkAuthAndJoin = async (tableId: string) => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      if (token) {
        onScanSuccess(tableId);
        return;
      }
      
      const storedName = await AsyncStorage.getItem('guest_name');
      if (storedName) {
        onScanSuccess(tableId);
        return;
      }
      
      setScannedTableId(tableId);
      setShowAuthSheet(true);
    } catch (e) {
      console.warn("Auth check failed", e);
      setScannedTableId(tableId);
      setShowAuthSheet(true);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    if (scanned || showAuthSheet) return;
    
    const parsedTableId = data.startsWith('qrbillsplit://table/') 
      ? data.split('qrbillsplit://table/')[1] 
      : data;
      
    setScanned(true);
    checkAuthAndJoin(parsedTableId);
  };

  const handleSimulatedScan = () => {
    if (scanned || showAuthSheet) return;
    setScanned(true);
    checkAuthAndJoin('f15977cf-1cba-4528-ae23-70fe07f881e6'); // Specific table ID or just table-5
  };

  const submitGuestName = async () => {
    if (!guestNameInput.trim()) return;
    await AsyncStorage.setItem('guest_name', guestNameInput.trim());
    setShowAuthSheet(false);
    if (scannedTableId) {
      onScanSuccess(scannedTableId);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      {/* Overlay */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          
          <View style={styles.transparentSquare}>
            {/* Glowing Corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      <SafeAreaView style={StyleSheet.absoluteFill}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                <BlurView intensity={40} tint="dark" style={styles.iconButtonBlur}>
                  <Ionicons name="chevron-back" size={24} color="#FFF" />
                </BlurView>
              </TouchableOpacity>
            )}
            <Text style={styles.title}>Split.It</Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={onB2BAuth} style={styles.iconButton}>
              <BlurView intensity={40} tint="dark" style={styles.iconButtonBlur}>
                <Ionicons name="business" size={20} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity onPress={onProfile} style={styles.iconButton}>
              <BlurView intensity={40} tint="dark" style={styles.iconButtonBlur}>
                <Ionicons name="person-circle" size={24} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.scanText}>Scan Table QR Code</Text>
          <Text style={styles.subtitle}>Center the QR code in the frame to join your table and split the bill.</Text>
        </View>

        <View style={{ flex: 1 }} />

        <BlurView intensity={80} tint="dark" style={styles.footerBlur}>
          <TouchableOpacity style={styles.scanButton} onPress={handleSimulatedScan}>
            <LinearGradient
              colors={['#0A84FF', '#0062D2']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="qr-code-outline" size={24} color="#FFF" style={{marginRight: 8}} />
              <Text style={styles.scanButtonText}>Simulate Scan (Table 5)</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </SafeAreaView>

      {/* Guest Auth Bottom Sheet */}
      <Modal visible={showAuthSheet} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackground}>
          <View style={{ flex: 1 }} />
          <View style={styles.bottomSheet}>
            <View style={styles.dragIndicator} />
            <Text style={styles.sheetTitle}>Masaya Hoş Geldiniz! 👋</Text>
            <Text style={styles.sheetSub}>Masadakilerin sizi tanıyabilmesi için lütfen isminizi girin.</Text>
            
            <TextInput
              style={styles.nameInput}
              placeholder="İsminiz (örn. Berke)"
              placeholderTextColor="#8E8E93"
              value={guestNameInput}
              onChangeText={setGuestNameInput}
              autoFocus
              maxLength={20}
            />
            
            <TouchableOpacity 
              style={[styles.sheetButton, !guestNameInput.trim() && { opacity: 0.5 }]} 
              onPress={submitGuestName}
              disabled={!guestNameInput.trim()}
            >
              <Text style={styles.sheetButtonText}>Masaya Katıl</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" style={{marginLeft: 8}} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.sheetCancel} 
              onPress={() => {
                setShowAuthSheet(false);
                setScanned(false);
              }}
            >
              <Text style={styles.sheetCancelText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const overlayColor = 'rgba(0,0,0,0.6)';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    width: '100%',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: overlayColor,
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 280,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: overlayColor,
  },
  transparentSquare: {
    width: 280,
    height: 280,
    backgroundColor: 'transparent',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: overlayColor,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#0A84FF',
  },
  topLeft: { top: -2, left: -2, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 24 },
  topRight: { top: -2, right: -2, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 24 },
  bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 24 },
  bottomRight: { bottom: -2, right: -2, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 24 },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  iconButtonBlur: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  scanText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  footerBlur: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  scanButton: {
    width: '100%',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  sheetSub: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  nameInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sheetButton: {
    backgroundColor: '#0A84FF',
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sheetCancel: {
    marginTop: 20,
    padding: 10,
  },
  sheetCancelText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  }
});
