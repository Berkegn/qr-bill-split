import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface Props {
  onAuthSuccess: () => void;
  onBack: () => void;
}

export default function B2BAuthScreen({ onAuthSuccess, onBack }: Props) {
  const [pin, setPin] = useState<string>('');

  const handlePress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (newPin === '1234') {
          onAuthSuccess();
        } else {
          Alert.alert("Error", "Invalid PIN. Try 1234");
          setPin('');
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Ionicons name="lock-closed" size={48} color="#0A84FF" style={{ marginBottom: 24 }} />
            <Text style={styles.title}>Admin Access</Text>
            <Text style={styles.subtitle}>Enter your 4-digit PIN</Text>

            <View style={styles.pinDotsContainer}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
              ))}
            </View>

            <View style={styles.keypad}>
              {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'delete']].map((row, rIdx) => (
                <View key={rIdx} style={styles.keypadRow}>
                  {row.map((btn, cIdx) => {
                    if (btn === '') return <View key={cIdx} style={styles.keypadBtn} />;
                    if (btn === 'delete') {
                      return (
                        <TouchableOpacity key={cIdx} style={styles.keypadBtn} onPress={handleBackspace}>
                          <Ionicons name="backspace-outline" size={28} color="#FFF" />
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity key={cIdx} style={styles.keypadBtn} onPress={() => handlePress(btn)}>
                        <Text style={styles.keypadBtnText}>{btn}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

          </View>
        </SafeAreaView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    padding: 16,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A5',
    marginBottom: 48,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 64,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3A3A3C',
  },
  pinDotFilled: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
    gap: 24,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadBtnText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFF',
  },
});
