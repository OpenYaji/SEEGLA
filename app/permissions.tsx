/**
 * Permissions — Seegla Brand Guidelines
 * Theme: Official Navy (#0A2E5C) & Teal (#16A085)
 * Professional Ionicons, Premium Soft UI
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  Switch,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ─────────────────────────────────────────────────────────────────────────────
// Brand Colors & Theme (Official PDF Hex Codes)
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
  navy: '#0A2E5C',       
  teal: '#16A085',       
  orangeDark: '#F59E0B', 
  bgGray: '#F7F9FC',     
  white: '#FFFFFF',
  textSecondary: '#64748B',
  border: '#E5E7EB',
}

interface PermItemProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  sub: string
  required?: boolean
  value: boolean
  onChange: (v: boolean) => void
}

function PermItem({ icon, title, sub, required, value, onChange }: PermItemProps) {
  return (
    <View style={[pi.row, required && value && { borderColor: COLORS.teal }]}>
      <View style={[pi.iconBox, { backgroundColor: value ? 'rgba(22, 160, 133, 0.1)' : '#F8FAFC' }]}>
        <Ionicons name={icon} size={22} color={value ? COLORS.teal : '#94A3B8'} />
      </View>
      <View style={pi.text}>
        <View style={pi.titleRow}>
          <Text style={pi.title}>{title}</Text>
          {required && (
            <View style={pi.badge}>
              <Text style={pi.badgeText}>REQUIRED</Text>
            </View>
          )}
        </View>
        <Text style={pi.sub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E2E8F0', true: COLORS.teal }}
        thumbColor={COLORS.white}
      />
    </View>
  )
}

const pi = StyleSheet.create({
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14, 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    borderWidth: 1.5, 
    borderColor: COLORS.border, 
    padding: 16, 
    marginBottom: 12 
  },
  iconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  text: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '800', color: COLORS.navy },
  badge: { backgroundColor: COLORS.navy, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
})

export default function PermissionsScreen() {
  const [physicalActivity, setPhysicalActivity] = useState(true)
  const [healthConnect, setHealthConnect] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(true)
  const [loading, setLoading] = useState(false)

  const proceed = async (granted: boolean) => {
    await AsyncStorage.setItem('seegla_activity_perms', granted ? 'true' : 'skipped')
    router.replace('/(tabs)/dashboard')
  }

  const requestAndAllow = async () => {
    if (Platform.OS !== 'android') { 
      await proceed(true); 
      return 
    }
    
    setLoading(true)
    try {
      // This maps directly to the ACTIVITY_RECOGNITION permission in your app.json
      const result = await PermissionsAndroid.request(
        'android.permission.ACTIVITY_RECOGNITION' as any,
        {
          title: 'Physical Activity Permission',
          message: 'Seegla needs activity access to track your steps and wellness score.',
          buttonPositive: 'Allow',
        }
      )
      await proceed(result === PermissionsAndroid.RESULTS.GRANTED)
    } catch {
      await proceed(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      
      {/* Navy Header */}
      <View style={s.header}>
        <View style={s.iconCircle}>
          <Ionicons name="shield-checkmark" size={32} color={COLORS.teal} />
        </View>
        <Text style={s.headerTitle}>Permissions</Text>
        <Text style={s.headerSub}>Enable these features to get the most out of Seegla's wellness tracking.</Text>
      </View>

      {/* White Content Card */}
      <View style={s.card}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          
          <PermItem 
            icon="walk" 
            title="Physical Activity" 
            sub="Track steps and calculate daily activity scores automatically." 
            required 
            value={physicalActivity} 
            onChange={setPhysicalActivity} 
          />
          
          <PermItem 
            icon="heart" 
            title="Health Connect" 
            sub="Sync heart rate, sleep, and nutrition data from your device." 
            required 
            value={healthConnect} 
            onChange={setHealthConnect} 
          />
          
          <PermItem 
            icon="notifications" 
            title="Notifications" 
            sub="Receive reminders for habits and team challenge updates." 
            value={pushNotifs} 
            onChange={setPushNotifs} 
          />

          <View style={s.privacyBox}>
            <Ionicons name="lock-closed" size={18} color={COLORS.teal} />
            <Text style={s.privacyText}>Your data is encrypted and Seegla is PDPA compliant. We never sell your health information.</Text>
          </View>

          <Pressable 
            onPress={requestAndAllow} 
            disabled={loading} 
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          >
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.btnText}>Allow & Continue</Text>}
          </Pressable>

          <Pressable onPress={() => proceed(false)} style={s.later}>
            <Text style={s.laterText}>Set up manually later</Text>
          </Pressable>
          
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.navy },
  
  header: { 
    alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 70 : 50, 
    paddingHorizontal: 30, 
    paddingBottom: 30 
  },
  iconCircle: { 
    width: 64, 
    height: 64, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16 
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  
  card: { 
    flex: 1, 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    overflow: 'hidden' 
  },
  scroll: { padding: 24, paddingBottom: 40 },
  
  privacyBox: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: 'rgba(22, 160, 133, 0.08)', // Light Teal
    padding: 16, 
    borderRadius: 16, 
    gap: 12, 
    marginTop: 10, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(22, 160, 133, 0.2)',
  },
  privacyText: { 
    flex: 1, 
    fontSize: 12, 
    color: COLORS.navy, 
    lineHeight: 18, 
    fontWeight: '600' 
  },
  
  btn: { 
    height: 60, 
    borderRadius: 16, 
    backgroundColor: COLORS.navy,
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  
  later: { alignItems: 'center', marginTop: 16, padding: 10 },
  laterText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700' },
})