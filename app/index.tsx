/**
 * Refactored Splash Screen — SEEGLA
 * Fix: Forced Onboarding Path & Logo Centered/Enlarged
 * Updated: Color Palette matched to Seegla Brand Guidelines
 */

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAuth } from '@/lib/auth-context';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Brand Colors & Theme (Seegla Official)
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
  navy: '#1E2356',       // Brand anchor, headings
  teal: '#00C4C7',       // Primary actions
  bgGray: '#F7F9FC',     // App background
  white: '#FFFFFF',      // Cards and text on dark backgrounds
  textSecondary: '#64748B', // Subtitles and body text
};

export default function SplashScreen() {
  const { user, isLoading } = useAuth();
  const hasNavigated = useRef(false);

  // --- Animation Hooks ---
  const badgeOpacity = useSharedValue(0);
  const badgeY = useSharedValue(-10);
  const logoScale = useSharedValue(0.9);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(15);
  const btnOpacity = useSharedValue(0);
  const btnY = useSharedValue(20);

  const badgeStyle = useAnimatedStyle(() => ({ 
    opacity: badgeOpacity.value, 
    transform: [{ translateY: badgeY.value }] 
  }));
  const logoStyle = useAnimatedStyle(() => ({ 
    opacity: logoOpacity.value, 
    transform: [{ scale: logoScale.value }] 
  }));
  const textStyle = useAnimatedStyle(() => ({ 
    opacity: textOpacity.value, 
    transform: [{ translateY: textY.value }] 
  }));
  const btnStyle = useAnimatedStyle(() => ({ 
    opacity: btnOpacity.value, 
    transform: [{ translateY: btnY.value }] 
  }));

  useEffect(() => {
    badgeOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    badgeY.value = withDelay(100, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    logoScale.value = withDelay(300, withSpring(1.15, { damping: 12, stiffness: 90 })); 
    textOpacity.value = withDelay(700, withTiming(1, { duration: 600 }));
    textY.value = withDelay(700, withTiming(0, { duration: 600 }));
    btnOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
    btnY.value = withDelay(1000, withTiming(0, { duration: 500 }));
  }, []);

  // --- Session Logic: ONLY auto-redirect if USER is ALREADY logged in ---
  useEffect(() => {
    if (isLoading || !user || hasNavigated.current) return;

    hasNavigated.current = true;
    (async () => {
      const permsRaw = await AsyncStorage.getItem('seegla_activity_perms');
      if (Platform.OS === 'android' && permsRaw !== 'true') {
        router.replace('/permissions');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    })();
  }, [isLoading, user]);

  // --- Navigation Fix: Always route to onboarding from this button ---
  const handleGetStarted = async () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    // We navigate directly to onboarding. 
    router.replace('/onboarding');
  };

  return (
    <View style={s.root}>
      {/* Dark text for the status bar since background is light gray */}
      <StatusBar style="dark" />

      {/* Centered Logo Container */}
      <View style={s.centerContainer}>
        <Animated.View style={[s.logoContainer, logoStyle]}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={s.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[s.messageBlock, textStyle]}>
          <Text style={s.tagline}>HEALTHY PEOPLE. GROWING BUSINESS.</Text>
          <Text style={s.bodyText}>
            The first corporate wellness platform{'\n'}built for the Filipino workforce.
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[s.ctaContainer, btnStyle]}>
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.teal} />
        ) : (
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              s.primaryBtn,
              pressed && s.btnPressed,
            ]}
          >
            <Text style={s.primaryBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgGray,
    paddingHorizontal: 32,
  },
  centerContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: -height * 0.05, 
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10, 
  },
  logoImage: {
    width: 160, 
    height: 190, 
    marginBottom: 0,
    marginTop: 0,
  },

  messageBlock: {
    alignItems: 'center',
    gap: 16,
    marginTop: 10, 
  },
  tagline: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 40,
    width: width, 
    alignSelf: 'center', 
    alignItems: 'center',
    paddingHorizontal: 32, 
  },
  primaryBtn: {
    width: '85%',
    backgroundColor: COLORS.navy, // Bright engaging action color
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
});