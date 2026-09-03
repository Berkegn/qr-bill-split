import React, { useState, useEffect, useRef } from 'react';
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
import MenuScreen from './src/presentation/screens/MenuScreen';
import JoinTableScreen from './src/presentation/screens/JoinTableScreen';
import { ReceiptResponse } from './src/types';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import * as Linking from 'expo-linking';
type ScreenState = 'Scanner' | 'Bill' | 'B2BAuth' | 'B2BDashboard' | 'Settings' | 'Receipt' | 'Login' | 'Register' | 'Profile' | 'Otp' | 'Menu' | 'JoinTable';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('Login');
  const [tableId, setTableId] = useState<string>('');
  const [currencySymbol, setCurrencySymbol] = useState<string>('₺');
  const [receiptData, setReceiptData] = useState<ReceiptResponse | null>(null);
  const [otpEmail, setOtpEmail] = useState<string>('');
  const [guestUserId, setGuestUserId] = useState<string>('');
  // Track whether user is "seated" (joined a table) to prevent back to Scanner/JoinTable
  const [isSeated, setIsSeated] = useState<boolean>(false);

  useEffect(() => {
    const handleUrl = (url: string) => {
      if (url.startsWith('qrbillsplit://table/')) {
        const tId = url.split('qrbillsplit://table/')[1];
        setTableId(tId);
        setCurrentScreen('JoinTable');
      }
    };

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
        setCurrentScreen('Scanner');
      } else if (!user && currentScreen !== 'Login' && currentScreen !== 'Register' && currentScreen !== 'Otp') {
        setCurrentScreen('Login');
      }
    }
  }, [user, isLoading]);

  const handleScanSuccess = (scannedTableId: string) => {
    setTableId(scannedTableId);
    setCurrentScreen('JoinTable');
  };

  const handleLeaveTable = () => {
    // Full reset: clear session state and go back to Scanner
    setIsSeated(false);
    setTableId('');
    setGuestUserId('');
    setCurrentScreen('Scanner');
  };

  const handleB2BAuthSuccess = () => {
    setCurrentScreen('B2BDashboard');
  };

  if (isLoading) {
    return <View style={{flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center'}} />;
  }

  if (currentScreen === 'Login') return <LoginScreen 
    onNavigateToRegister={() => setCurrentScreen('Register')} 
    onRequiresOtp={(email) => { setOtpEmail(email); setCurrentScreen('Otp'); }}
  />;
  if (currentScreen === 'Register') return <RegisterScreen onNavigateToLogin={() => setCurrentScreen('Login')} />;
  if (currentScreen === 'Otp') return <OtpScreen email={otpEmail} onSuccess={() => setCurrentScreen('Scanner')} onBack={() => setCurrentScreen('Login')} />;
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
      onMenu={() => setCurrentScreen('Menu')}
    />;
  }

  if (currentScreen === 'JoinTable') {
    return <JoinTableScreen 
      tableId={tableId} 
      onJoinSuccess={(newUserId) => {
        setGuestUserId(newUserId);
        setIsSeated(true);
        setCurrentScreen('Bill');
      }} 
    />;
  }

  if (currentScreen === 'Menu') {
    return (
      <MenuScreen tableId={tableId} onBack={() => {
        // If seated → go back to Bill (table summary)
        // If not seated (browsing from Scanner) → go back to Scanner
        setCurrentScreen(isSeated ? 'Bill' : 'Scanner');
      }} />
    );
  }

  if (currentScreen === 'Receipt' && receiptData) {
    return <ReceiptScreen
      receipt={receiptData}
      currencySymbol={currencySymbol}
      onDone={() => {
        setTableId('');
        setReceiptData(null);
        setIsSeated(false);
        setCurrentScreen('Scanner');
      }}
    />;
  }

  return <BillSplitScreen
    tableId={tableId}
    userId={user?.id || guestUserId || ''}
    currencySymbol={currencySymbol}
    onBack={handleLeaveTable}
    onMenu={() => setCurrentScreen('Menu')}
    onCheckoutSuccess={(receipt) => {
      setReceiptData(receipt);
      setCurrentScreen('Receipt');
    }}
  />;
}

import { CartProvider } from './src/contexts/CartContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// Extraneous styles removed
