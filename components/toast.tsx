import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withDelay,
  runOnJS 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  type?: 'success' | 'error';
}

const COLORS = {
  primaryDark: '#3A4D39',
  success: '#4F6F52', // Your Forest Green
  error: '#ef4444',
};

export default function Toast({ message, visible, onHide, type = 'success' }: ToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(2000, withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(onHide)();
          }
        }))
      );
      translateY.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle, { backgroundColor: type === 'success' ? COLORS.success : COLORS.error }]}>
      <Ionicons 
        name={type === 'success' ? "checkmark-circle" : "alert-circle"} 
        size={20} 
        color="#fff" 
      />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Sits below the status bar
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    zIndex: 9999,
    elevation: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});