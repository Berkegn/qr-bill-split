import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

interface Props {
  onNavigateToRegister: () => void;
  onRequiresOtp: (email: string) => void;
}

export default function LoginScreen({ onNavigateToRegister, onRequiresOtp }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isEmailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length === 0 || password.length >= 8;
  const isFormValid = email.length > 0 && password.length >= 8 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await ApiService.login(email, password);
      if (res.success && res.requiresOtp && res.email) {
        onRequiresOtp(res.email);
      } else if (res.success && res.token && res.user) {
        await login(res.user, res.token);
      } else {
        Alert.alert('Login Failed', res.message || 'Invalid credentials');
      }
    } catch (e: any) {
      if (e.status === 429) {
        Alert.alert('Too Many Attempts', e.message);
      } else {
        Alert.alert('Login Error', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    const guestId = `Guest_${Math.random().toString(36).substring(7)}`;
    const guestUser = { id: guestId, name: 'Misafir', email: 'misafir@qrbillsplit.local' };
    const guestToken = 'guest_temp_token';
    await login(guestUser, guestToken);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill}>
        <SafeAreaView style={styles.content}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to access your bill history</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                style={[styles.input, !isEmailValid && styles.inputError]} 
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              {!isEmailValid && <Text style={styles.errorText}>Invalid email format</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput 
                style={[styles.input, !isPasswordValid && styles.inputError]} 
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {!isPasswordValid && <Text style={styles.errorText}>Password must be at least 8 characters</Text>}
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, !isFormValid && styles.primaryButtonDisabled]} 
              onPress={handleLogin} 
              disabled={loading || !isFormValid}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onNavigateToRegister}>
              <Text style={styles.secondaryButtonText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
              <Text style={styles.guestButtonText}>Üye Olmadan Devam Et</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#1C1C1E', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8E8E93' },
  form: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, fontSize: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: '#FF3B30' },
  errorText: { color: '#FF3B30', fontSize: 12, marginTop: 4, marginLeft: 4, fontWeight: '500' },
  primaryButton: { backgroundColor: '#0A84FF', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 12 },
  primaryButtonDisabled: { backgroundColor: '#A0CFFF' },
  primaryButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  secondaryButton: { marginTop: 24, alignItems: 'center' },
  secondaryButtonText: { color: '#0A84FF', fontSize: 15, fontWeight: '600' },
  guestButton: { marginTop: 16, alignItems: 'center', paddingVertical: 12 },
  guestButtonText: { color: '#8E8E93', fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' }
});
