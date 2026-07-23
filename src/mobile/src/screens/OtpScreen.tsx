import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function OtpScreen({ email, onSuccess, onBack }: Props) {
  const { login } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lockedOut, setLockedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTextChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (lockedOut) return;
    
    const otpString = code.join('');
    if (otpString.length !== 6) {
      setErrorMsg("Please enter the 6-digit code.");
      return;
    }
    
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.verifyOtp(email, otpString);
      if (res.success && res.token && res.user) {
        await login(res.user, res.token);
        onSuccess();
      } else {
        setErrorMsg(res.message || "Invalid OTP");
      }
    } catch (e: any) {
      if (e.status === 429) {
        setLockedOut(true);
        setErrorMsg(e.message || "Too many failed attempts. Please try again in 15 minutes.");
      } else {
        setErrorMsg(e.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>We sent a 6-digit code to your email.</Text>
        </View>

        <View style={styles.otpContainer}>
          {code.map((digit, idx) => (
            <TextInput
              key={idx}
              style={[styles.otpInput, errorMsg ? styles.otpInputError : null, lockedOut && styles.otpInputLocked]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleTextChange(text, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              ref={(ref) => { inputs.current[idx] = ref; }}
              autoFocus={idx === 0}
              editable={!lockedOut}
            />
          ))}
        </View>

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        <TouchableOpacity 
          style={[styles.verifyButton, lockedOut && styles.verifyButtonLocked]} 
          onPress={handleVerify}
          disabled={loading || code.join('').length !== 6 || lockedOut}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyButtonText}>Verify</Text>}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          {timeLeft > 0 ? (
            <Text style={styles.timerText}>Resend code in {formatTime(timeLeft)}</Text>
          ) : (
            <TouchableOpacity onPress={() => { /* Mock resend */ Alert.alert("Sent", "A new code has been sent."); setTimeLeft(180); }}>
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 40, left: 24, zIndex: 10 },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center' },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  otpInput: { width: 48, height: 56, backgroundColor: '#FFF', borderRadius: 12, fontSize: 24, fontWeight: '700', textAlign: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'transparent' },
  otpInputError: { borderColor: '#FF3B30' },
  otpInputLocked: { backgroundColor: '#E5E5EA' },
  errorText: { color: '#FF3B30', fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 20 },
  verifyButton: { backgroundColor: '#0A84FF', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 12 },
  verifyButtonLocked: { backgroundColor: '#A0CFFF' },
  verifyButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  resendContainer: { marginTop: 32, alignItems: 'center' },
  timerText: { color: '#8E8E93', fontSize: 15 },
  resendText: { color: '#0A84FF', fontSize: 15, fontWeight: '600' }
});
