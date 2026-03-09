/**
 * Permissions — Enable device permissions
 *
 * Shows a dark-green header + white scrollable card with 4 toggleable permissions:
 *   1. Physical Activity (REQUIRED)
 *   2. Health Connect (REQUIRED)
 *   3. Push Notifications
 *   4. Location (Optional)
 *
 * "Allow & Continue" → requests Android ACTIVITY_RECOGNITION, saves flag, → dashboard
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
// Permission row
// ─────────────────────────────────────────────────────────────────────────────

interface PermItemProps {
  icon:       string  // emoji
  iconBg:     string
  title:      string
  sub:        string
  required?:  boolean
  accentColor?: string
  value:      boolean
  onChange:   (v: boolean) => void
}

function PermItem({ icon, iconBg, title, sub, required, accentColor = '#3FE870', value, onChange }: PermItemProps) {
  return (
    <View style={[pi.row, { borderColor: required ? accentColor + '55' : '#f1f5f9' }]}>
      <View style={[pi.iconBox, { backgroundColor: iconBg }]}>
        <Text style={pi.iconEmoji}>{icon}</Text>
      </View>
      <View style={pi.text}>
        <View style={pi.titleRow}>
          <Text style={pi.title}>{title}</Text>
          {required && (
            <View style={[pi.badge, { backgroundColor: '#1a3a1a' }]}>
              <Text style={pi.badgeText}>REQUIRED</Text>
            </View>
          )}
        </View>
        <Text style={pi.sub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#e2e8f0', true: accentColor }}
        thumbColor="#ffffff"
        ios_backgroundColor="#e2e8f0"
      />
    </View>
  )
}

const pi = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            14,
    backgroundColor:'#ffffff',
    borderRadius:   14,
    borderWidth:    1.5,
    padding:        16,
  },
  iconBox: {
    width:          44,
    height:         44,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  iconEmoji: {
    fontSize: 22,
  },
  text: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    flexWrap:      'wrap',
  },
  title: {
    fontSize:   14,
    fontWeight: '700',
    color:      '#0f172a',
  },
  badge: {
    borderRadius:      99,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  badgeText: {
    fontSize:   9,
    fontWeight: '800',
    color:      '#3FE870',
    letterSpacing: 0.5,
  },
  sub: {
    fontSize:  12,
    color:     '#64748b',
    marginTop: 3,
    lineHeight: 17,
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function PermissionsScreen() {
  const [physicalActivity, setPhysicalActivity] = useState(true)
  const [healthConnect,    setHealthConnect]    = useState(true)
  const [pushNotifs,       setPushNotifs]       = useState(false)
  const [location,         setLocation]         = useState(false)
  const [loading,          setLoading]          = useState(false)

  const proceed = async (granted: boolean) => {
    await AsyncStorage.setItem('seegla_activity_perms', granted ? 'true' : 'skipped')
    router.replace('/(tabs)/dashboard')
  }

  const requestAndAllow = async () => {
    if (Platform.OS !== 'android') { await proceed(true); return }
    setLoading(true)
    try {
      const result = await PermissionsAndroid.request(
        'android.permission.ACTIVITY_RECOGNITION' as any,
        {
          title:         'Physical Activity Permission',
          message:       'SEEGLA uses your phone\'s sensors to count steps and calculate your daily activity score.',
          buttonNeutral: 'Ask Later',
          buttonNegative:'Not Now',
          buttonPositive:'Allow',
        }
      )
      await proceed(result === PermissionsAndroid.RESULTS.GRANTED)
    } catch { await proceed(false) }
    finally { setLoading(false) }
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Dark green header */}
      <View style={s.header}>
        <View style={s.lockBox}>
          <Text style={s.lockEmoji}>🔐</Text>
        </View>
        <Text style={s.headerTitle}>Enable Permissions</Text>
        <Text style={s.headerSub}>
          To accurately track your wellness, Seegla needs access to these device features.
          Your data stays private and secure.
        </Text>
      </View>

      {/* White card */}
      <View style={s.card}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.cardContent}
        >
          <PermItem
            icon="🏃"
            iconBg="rgba(63,232,112,0.12)"
            title="Physical Activity"
            sub="Count steps, detect workouts, track movement throughout the day"
            required
            accentColor="#3FE870"
            value={physicalActivity}
            onChange={setPhysicalActivity}
          />

          <PermItem
            icon="❤️"
            iconBg="rgba(239,68,68,0.1)"
            title="Health Connect"
            sub="Sync heart rate, calories, and sleep data from your device"
            required
            accentColor="#f97316"
            value={healthConnect}
            onChange={setHealthConnect}
          />

          <PermItem
            icon="🔔"
            iconBg="rgba(245,158,11,0.1)"
            title="Push Notifications"
            sub="Daily wellness reminders, team challenges, and reward alerts"
            value={pushNotifs}
            onChange={setPushNotifs}
          />

          <PermItem
            icon="📍"
            iconBg="rgba(239,68,68,0.08)"
            title="Location (Optional)"
            sub="Discover nearby wellness events and corporate health fairs"
            value={location}
            onChange={setLocation}
          />

          {/* Privacy note */}
          <View style={s.privacyNote}>
            <Text style={s.privacyEmoji}>🛡️</Text>
            <Text style={s.privacyText}>
              Your privacy is paramount. Seegla is PDPA compliant. We never sell your health data and all information is encrypted end-to-end.
            </Text>
          </View>

          {/* Allow button */}
          <Pressable
            onPress={requestAndAllow}
            disabled={loading}
            style={({ pressed }) => [
              s.allowBtn,
              pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
            ]}
          >
            {loading ? <ActivityIndicator color="#0d2210" /> : (
              <Text style={s.allowBtnText}>Allow &amp; Continue 🧘</Text>
            )}
          </Pressable>

          <Pressable onPress={() => proceed(false)} style={s.laterBtn}>
            <Text style={s.laterText}>Set up later</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0d2210',
  },
  header: {
    alignItems:        'center',
    paddingTop:        Platform.OS === 'ios' ? 64 : 48,
    paddingHorizontal: 24,
    paddingBottom:     28,
    gap:               10,
  },
  lockBox: {
    width:           60,
    height:          60,
    borderRadius:    16,
    backgroundColor: 'rgba(63,232,112,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  lockEmoji:   { fontSize: 28 },
  headerTitle: {
    fontSize:   24,
    fontWeight: '900',
    color:      '#ffffff',
  },
  headerSub: {
    fontSize:   13,
    color:      'rgba(255,255,255,0.55)',
    textAlign:  'center',
    lineHeight: 20,
  },

  card: {
    flex:                1,
    backgroundColor:     '#f8fafc',
    borderTopLeftRadius: 28,
    borderTopRightRadius:28,
    overflow:            'hidden',
  },
  cardContent: {
    padding: 20,
    gap:     12,
  },

  privacyNote: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:               10,
    backgroundColor:   '#ecfdf5',
    borderRadius:      12,
    padding:           14,
    borderWidth:       1,
    borderColor:       '#d1fae5',
  },
  privacyEmoji: { fontSize: 16, marginTop: 1 },
  privacyText: {
    flex:       1,
    fontSize:   12,
    color:      '#065f46',
    lineHeight: 18,
  },

  allowBtn: {
    backgroundColor: '#3FE870',
    borderRadius:    16,
    paddingVertical: 17,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       8,
  },
  allowBtnText: {
    fontSize:   16,
    fontWeight: '800',
    color:      '#0d2210',
  },
  laterBtn: {
    alignItems:      'center',
    paddingVertical: 12,
  },
  laterText: {
    fontSize:   13,
    color:      '#94a3b8',
    fontWeight: '500',
  },
})
