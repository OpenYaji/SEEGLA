/**
 * Splash Screen — SEEGLA
 * "Made for the Filipino Workforce"
 *
 * Navigation logic:
 *   • While isLoading  → stay on splash (auth session check in progress)
 *   • isLoading done + session found  → auto-redirect to dashboard (skip everything)
 *   • isLoading done + no session     → show CTA, wait for user tap — NO auto-redirect
 *
 * "Get Started" → /onboarding (first time) or /login (returning user, no session)
 * "Sign In"     → /login always
 */

import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '@/lib/auth-context'

const { width, height } = Dimensions.get('window')

export default function SplashScreen() {
  const { user, isLoading } = useAuth()
  const hasNavigated        = useRef(false)

  // ── Animated values ────────────────────────────────────────────────────────
  const badgeOpacity = useSharedValue(0)
  const badgeY       = useSharedValue(-12)
  const logoScale    = useSharedValue(0.75)
  const logoOpacity  = useSharedValue(0)
  const textOpacity  = useSharedValue(0)
  const textY        = useSharedValue(20)
  const btnOpacity   = useSharedValue(0)
  const btnY         = useSharedValue(16)

  const badgeStyle = useAnimatedStyle(() => ({ opacity: badgeOpacity.value, transform: [{ translateY: badgeY.value }] }))
  const logoStyle  = useAnimatedStyle(() => ({ opacity: logoOpacity.value,  transform: [{ scale: logoScale.value }] }))
  const textStyle  = useAnimatedStyle(() => ({ opacity: textOpacity.value,  transform: [{ translateY: textY.value }] }))
  const btnStyle   = useAnimatedStyle(() => ({ opacity: btnOpacity.value,   transform: [{ translateY: btnY.value }] }))

  useEffect(() => {
    badgeOpacity.value = withDelay(200,  withTiming(1, { duration: 600 }))
    badgeY.value       = withDelay(200,  withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }))
    logoOpacity.value  = withDelay(400,  withTiming(1, { duration: 700 }))
    logoScale.value    = withDelay(400,  withSpring(1, { damping: 14, stiffness: 120 }))
    textOpacity.value  = withDelay(800,  withTiming(1, { duration: 600 }))
    textY.value        = withDelay(800,  withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }))
    btnOpacity.value   = withDelay(1100, withTiming(1, { duration: 500 }))
    btnY.value         = withDelay(1100, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Session-found: auto-redirect to dashboard ──────────────────────────────
  useEffect(() => {
    if (isLoading)            return  // still checking — do nothing
    if (!user)                return  // no session — stay, wait for tap
    if (hasNavigated.current) return  // already navigating

    hasNavigated.current = true
    ;(async () => {
      const permsRaw = await AsyncStorage.getItem('seegla_activity_perms')
      if (Platform.OS === 'android' && permsRaw !== 'true') {
        router.replace('/permissions')
      } else {
        router.replace('/(tabs)/dashboard')
      }
    })()
  }, [isLoading, user])

  // ── "Get Started" tap — only reachable when !user ─────────────────────────
  const handleGetStarted = async () => {
    if (hasNavigated.current) return
    hasNavigated.current = true

    const seen = await AsyncStorage.getItem('seegla_onboarding_done')
    if (!seen) {
      router.replace('/onboarding')
    } else {
      router.replace('/login')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Background blobs */}
      <View style={[s.blob, s.blobTL]} />
      <View style={[s.blob, s.blobBR]} />

      {/* PH badge */}
      <Animated.View style={[s.badge, badgeStyle]}>
        <Text style={s.badgeFlag}>🇵🇭</Text>
        <Text style={s.badgeText}>Made for the Filipino Workforce</Text>
      </Animated.View>

      {/* Logo block */}
      <Animated.View style={[s.logoBlock, logoStyle]}>
        <View style={s.iconBox}>
          <Ionicons name="body-outline" size={40} color="#fff" />
        </View>
        <Text style={s.logoText}>SEEGLA</Text>
      </Animated.View>

      {/* Tagline + body */}
      <Animated.View style={[s.tagBlock, textStyle]}>
        <Text style={s.tagline}>HEALTHY PEOPLE. GROWING BUSINESS.</Text>
        <Text style={s.bodyText}>
          The first corporate wellness platform{'\n'}built for the Filipino workforce
        </Text>
      </Animated.View>

      {/* CTA — shown when auth check is done and no session found */}
      <Animated.View style={[s.ctaBlock, btnStyle]}>
        {isLoading ? (
          /* Session check in progress — show spinner, hide buttons */
          <ActivityIndicator size="small" color="rgba(63,232,112,0.6)" style={s.spinner} />
        ) : (
          <>
            <Pressable
              onPress={handleGetStarted}
              style={({ pressed }) => [
                s.getStartedBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={s.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#1a3a1a" />
            </Pressable>

            <Pressable onPress={() => router.replace('/login')} style={s.signInLink}>
              <Text style={s.signInText}>
                Already have an account?{' '}
                <Text style={s.signInBold}>Sign In</Text>
              </Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0d2210',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             28,
    overflow:        'hidden',
    paddingHorizontal: 28,
  },

  // Background gradient blobs
  blob: {
    position:     'absolute',
    borderRadius: 999,
  },
  blobTL: {
    width:           width * 1.1,
    height:          width * 1.1,
    top:             -width * 0.5,
    left:            -width * 0.2,
    backgroundColor: '#1a4a20',
    opacity:         0.6,
  },
  blobBR: {
    width:           width * 0.9,
    height:          width * 0.9,
    bottom:          -width * 0.4,
    right:           -width * 0.2,
    backgroundColor: '#0a2a14',
    opacity:         0.7,
  },

  // PH badge
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(63,232,112,0.15)',
    borderWidth:       1,
    borderColor:       'rgba(63,232,112,0.4)',
    borderRadius:      99,
    paddingHorizontal: 14,
    paddingVertical:   7,
  },
  badgeFlag: {
    fontSize: 14,
  },
  badgeText: {
    fontSize:   12,
    fontWeight: '700',
    color:      '#3FE870',
    letterSpacing: 0.2,
  },

  // Logo
  logoBlock: {
    alignItems: 'center',
    gap:        16,
  },
  iconBox: {
    width:           88,
    height:          88,
    borderRadius:    22,
    backgroundColor: '#3FE870',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#3FE870',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.5,
    shadowRadius:    16,
    elevation:       10,
  },
  logoText: {
    fontSize:      40,
    fontWeight:    '900',
    color:         '#ffffff',
    letterSpacing: 6,
  },

  // Tagline
  tagBlock: {
    alignItems: 'center',
    gap:        10,
  },
  tagline: {
    fontSize:      13,
    fontWeight:    '800',
    color:         '#3FE870',
    letterSpacing: 1.5,
    textAlign:     'center',
  },
  bodyText: {
    fontSize:   14,
    color:      'rgba(255,255,255,0.55)',
    textAlign:  'center',
    lineHeight: 22,
  },

  // CTA block
  ctaBlock: {
    position:   'absolute',
    bottom:     Platform.OS === 'ios' ? 56 : 40,
    width:      '100%',
    alignItems: 'center',
    gap:        16,
    paddingHorizontal: 0,
  },
  getStartedBtn: {
    width:             '100%',
    backgroundColor:   '#3FE870',
    borderRadius:      16,
    paddingVertical:   17,
    alignItems:        'center',
    justifyContent:    'center',
    flexDirection:     'row',
    gap:               8,
  },
  getStartedText: {
    fontSize:   17,
    fontWeight: '800',
    color:      '#0d2210',
    letterSpacing: 0.3,
  },

  signInLink: {
    paddingVertical: 4,
  },
  signInText: {
    fontSize:  13,
    color:     'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },
  signInBold: {
    fontWeight: '800',
    color:      '#3FE870',
  },
})
