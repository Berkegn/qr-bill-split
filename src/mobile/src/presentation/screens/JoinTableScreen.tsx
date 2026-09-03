import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJoinTable } from '../hooks/useJoinTable';

interface Props {
  tableId: string;
  onJoinSuccess: (userId: string) => void;
}

export default function JoinTableScreen({ tableId, onJoinSuccess }: Props) {
  const [userName, setUserName] = useState('');
  const { joinSession, isLoading, error } = useJoinTable();

  const handleJoin = async () => {
    if (!userName.trim()) return;

    const response = await joinSession(tableId, userName);
    if (response) {
      console.log('Successfully joined session:', response.sessionId, 'User:', response.userId);
      onJoinSuccess(String(response.userId));
    }
  };

  // Parse table number from GUID (e.g. "a0000000-0000-0000-0000-000000000005" → "5")
  // or from slug format (e.g. "table-5" → "5")
  const tableNumber = (() => {
    const slugMatch = tableId.match(/(\d+)$/);
    const n = slugMatch ? parseInt(slugMatch[1], 10) : null;
    return n && n > 0 ? String(n) : null;
  })();
  const welcomeTitle = tableNumber
    ? `Masa ${tableNumber}'e Hoş Geldiniz 👋`
    : 'Hoş Geldiniz 👋';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{welcomeTitle}</Text>
          <Text style={styles.subtitle}>Menüyü görüntülemek ve oturuma katılmak için adınızı girin.</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Adınızı girin"
              placeholderTextColor="#8E8E93"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, (!userName.trim() || isLoading) && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={!userName.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Masaya Katıl</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#1C1C1E',
  },
  button: {
    backgroundColor: '#0A84FF',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A1D0FF',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});
