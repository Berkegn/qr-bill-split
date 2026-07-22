import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onSwipeSuccess: () => void;
  text?: string;
  currencySymbol?: string;
  amount?: number;
}

const SWIPE_WIDTH = Dimensions.get('window').width - 64; // Modal padding
const BUTTON_WIDTH = 56;
const MAX_TRANSLATE = SWIPE_WIDTH - BUTTON_WIDTH - 8;

export default function SwipeToPay({ onSwipeSuccess, text = "Swipe to Pay", currencySymbol = "$", amount = 0 }: Props) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [swiped, setSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !swiped,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx <= MAX_TRANSLATE) {
          pan.setValue({ x: gestureState.dx, y: 0 });
        } else if (gestureState.dx > MAX_TRANSLATE) {
          pan.setValue({ x: MAX_TRANSLATE, y: 0 });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= MAX_TRANSLATE * 0.8) {
          // Success threshold
          Animated.spring(pan, {
            toValue: { x: MAX_TRANSLATE, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            setSwiped(true);
            onSwipeSuccess();
          });
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
          }).start();
        }
      },
    })
  ).current;

  // Track color transition
  const interpolatedBackground = pan.x.interpolate({
    inputRange: [0, MAX_TRANSLATE],
    outputRange: ['#1C1C1E', '#34C759'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.track, { backgroundColor: interpolatedBackground }]}>
        <Text style={styles.text}>{swiped ? "Processing..." : text}</Text>
        
        {amount > 0 && !swiped && (
          <Text style={styles.amountText}>{currencySymbol}{amount.toFixed(2)}</Text>
        )}

        <Animated.View
          style={[
            styles.thumbButton,
            { transform: [{ translateX: pan.x }] }
          ]}
          {...panResponder.panHandlers}
        >
          <LinearGradient
            colors={swiped ? ['#28A745', '#34C759'] : ['#3A3A3C', '#2C2C2E']}
            style={styles.thumbGradient}
          >
            <Ionicons name={swiped ? "checkmark" : "chevron-forward"} size={24} color="#FFF" />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    width: '100%',
    justifyContent: 'center',
    marginTop: 24,
  },
  track: {
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    padding: 4,
    overflow: 'hidden',
  },
  text: {
    position: 'absolute',
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  amountText: {
    position: 'absolute',
    right: 24,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  thumbButton: {
    width: BUTTON_WIDTH,
    height: BUTTON_WIDTH,
    borderRadius: BUTTON_WIDTH / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  thumbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: BUTTON_WIDTH / 2,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
