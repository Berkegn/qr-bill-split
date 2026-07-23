import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import QRScannerScreen from './src/screens/QRScannerScreen';
import BillSplitScreen from './src/screens/BillSplitScreen';
import B2BDashboardScreen from './src/screens/B2BDashboardScreen';
import B2BAuthScreen from './src/screens/B2BAuthScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ReceiptScreen from './src/screens/ReceiptScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OtpScreen from './src/screens/OtpScreen';
import { ReceiptResponse } from './src/types';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import * as Linking from 'expo-linking';

type ScreenState = 'Scanner' | 'Bill' | 'B2BAuth' | 'B2BDashboard' | 'Settings' | 'Receipt' | 'Login' | 'Register' | 'Profile' | 'Otp';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('Login');
  const [tableId, setTableId] = useState<string>('');
  const [currencySymbol, setCurrencySymbol] = useState<string>('₺');
  const [receiptData, setReceiptData] = useState<ReceiptResponse | null>(null);
  const [otpEmail, setOtpEmail] = useState<string>('');

  // URL Parser Helper (Hem qrbillsplit:// hem de https:// adresi destekler)
  const parseTableIdFromUrl = (rawUrl: string): string | null => {
    if (!rawUrl) return null;

    // 1. Durum: https://masa-phi-lemon.vercel.app/table/TABLE_ID
    if (rawUrl.includes('/table/')) {
      const parts = rawUrl.split('/table/');
      if (parts.length > 1) {
        return parts[1].split('?')[0].split('#')[0];
      }
    }

    // 2. Durum: qrbillsplit://table/TABLE_ID
    if (rawUrl.startsWith('qrbillsplit://table/')) {
      return rawUrl.split('qrbillsplit://table/')[1];
    }

    return null;
  };

  useEffect(() => {
    const handleUrl = (url: string) => {
      const extractedTableId = parseTableIdFromUrl(url);
      if (extractedTableId) {
        setTableId(extractedTableId);
        setCurrentScreen('Bill');
      }
    };

    // Web tarayıcılarında (PWA/Vercel) doğrudan URL kontrolü
    if (typeof window !== 'undefined' && window.location) {
      const currentWebUrl = window.location.href;
      const extractedTableId = parseTableIdFromUrl(currentWebUrl);
      if (extractedTableId) {
        setTableId(extractedTableId);
        setCurrentScreen('Bill');
      }
    }

    // Native & Expo Linking dinleyicileri
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (user && (currentScreen === 'Login' || currentScreen === 'Register' || currentScreen === 'Otp')) {
        // Eğer URL'den yakalanan bir masa id varsa doğrudan Bill ekranına git, yoksa Scanner
        setCurrentScreen(tableId ? 'Bill' : 'Scanner');
      } else if (!user && currentScreen !== 'Login' && currentScreen !== 'Register' && currentScreen !== 'Otp') {
        setCurrentScreen('Login');
      }
    }
  }, [user, isLoading]);

  const handleScanSuccess = (scannedTableId: string) => {
    // QR Scanner ekranından bir URL gelirse de tableId'yi çıkarır
    const extractedId = parseTableIdFromUrl(scannedTableId) || scannedTableId;
    setTableId(extractedId);
    setCurrentScreen('Bill');
  };

  const handleB2BAuthSuccess = () => {
    setCurrentScreen('B2BDashboard');
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center' }} />;
  }

  if (currentScreen === 'Login') return <LoginScreen 
    onNavigateToRegister={() => setCurrentScreen('Register')} 
    onRequiresOtp={(email) => { setOtpEmail(email); setCurrentScreen('Otp'); }}
  />;
  if (currentScreen === 'Register') return <RegisterScreen onNavigateToLogin={() => setCurrentScreen('Login')} />;
  if (currentScreen === 'Otp') return <OtpScreen email={otpEmail} onSuccess={() => setCurrentScreen(tableId ? 'Bill' : 'Scanner')} onBack={() => setCurrentScreen('Login')} />;
  if (currentScreen === 'Profile') return <ProfileScreen currencySymbol={currencySymbol} onBack={() => setCurrentScreen('Scanner')} />;

  if (currentScreen === 'Settings') {
    return <SettingsScreen
      currentCurrency={currencySymbol}
      onCurrencyChange={setCurrencySymbol}
      onBack={() => setCurrentScreen('B2BDashboard')}
    />;
  }

  if (currentScreen === 'B2BAuth') {
    return <B2BAuthScreen
      onAuthSuccess={handleB2BAuthSuccess}
      onBack={() => setCurrentScreen('Scanner')}
    />;
  }

  if (currentScreen === 'B2BDashboard') {
    return <B2BDashboardScreen
      currencySymbol={currencySymbol}
      onSettings={() => setCurrentScreen('Settings')}
      onBack={() => setCurrentScreen('Scanner')}
    />;
  }

  if (currentScreen === 'Scanner') {
    return <QRScannerScreen
      onScanSuccess={handleScanSuccess}
      onB2BAuth={() => setCurrentScreen('B2BAuth')}
      onProfile={() => setCurrentScreen('Profile')}
    />;
  }

  if (currentScreen === 'Receipt' && receiptData) {
    return <ReceiptScreen
      receipt={receiptData}
      currencySymbol={currencySymbol}
      onDone={() => {
        setTableId('');
        setReceiptData(null);
        setCurrentScreen('Scanner');
      }}
    />;
  }

  return <BillSplitScreen
    tableId={tableId}
    userId={user?.id || ''}
    currencySymbol={currencySymbol}
    onBack={() => {
      setTableId('');
      setCurrentScreen('Scanner');
    }}
    onCheckoutSuccess={(receipt) => {
      setReceiptData(receipt);
      setCurrentScreen('Receipt');
    }}
  />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}