/**
 * Permissions — Refactored for Moss & Forest Theme
 * No emojis, Professional Ionicons
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

const COLORS = {
  primaryDark: '#3A4D39',
  primaryForest: '#4F6F52',
  secondarySage: '#86A789',
  background: '#D2E3C8',
  white: '#FFFFFF',
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
    <View style={[pi.row, required && value && { borderColor: COLORS.secondarySage }]}>
      <View style={[pi.iconBox, { backgroundColor: value ? COLORS.background : '#F1F5F9' }]}>
        <Ionicons name={icon} size={22} color={value ? COLORS.primaryDark : '#94a3b8'} />
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
        trackColor={{ false: '#E2E8F0', true: COLORS.secondarySage }}
        thumbColor={COLORS.white}
      />
    </View>
  )
}

const pi = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#F1F5F9', padding: 16, marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.primaryDark },
  badge: { backgroundColor: COLORS.primaryDark, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '800', color: COLORS.background },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 16 },
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
    if (Platform.OS !== 'android') { await proceed(true); return }
    setLoading(true)
    try {
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
      <View style={s.header}>
        <View style={s.iconCircle}>
          <Ionicons name="shield-checkmark" size={32} color={COLORS.background} />
        </View>
        <Text style={s.headerTitle}>Permissions</Text>
        <Text style={s.headerSub}>Enable these features to get the most out of Seegla's wellness tracking.</Text>
      </View>

      <View style={s.card}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <PermItem icon="walk-outline" title="Physical Activity" sub="Track steps and calculate daily activity scores automatically." required value={physicalActivity} onChange={setPhysicalActivity} />
          <PermItem icon="heart-outline" title="Health Connect" sub="Sync heart rate, sleep, and nutrition data from your device." required value={healthConnect} onChange={setHealthConnect} />
          <PermItem icon="notifications-outline" title="Notifications" sub="Receive reminders for habits and team challenge updates." value={pushNotifs} onChange={setPushNotifs} />

          <View style={s.privacyBox}>
            <Ionicons name="lock-closed" size={16} color={COLORS.primaryForest} />
            <Text style={s.privacyText}>Your data is encrypted and Seegla is PDPA compliant. We never sell your health information.</Text>
          </View>

          <Pressable onPress={requestAndAllow} disabled={loading} style={({ pressed }) => [s.btn, { backgroundColor: COLORS.primaryDark }, pressed && { opacity: 0.9 }]}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Allow & Continue</Text>}
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
  root: { flex: 1, backgroundColor: COLORS.primaryDark },
  header: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30, paddingBottom: 30 },
  iconCircle: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  card: { flex: 1, backgroundColor: '#F8FAF9', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  scroll: { padding: 24 },
  privacyBox: { flexDirection: 'row', backgroundColor: COLORS.background + '40', padding: 14, borderRadius: 12, gap: 10, marginTop: 10, marginBottom: 20 },
  privacyText: { flex: 1, fontSize: 12, color: COLORS.primaryDark, lineHeight: 18, fontWeight: '500' },
  btn: { height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  later: { alignItems: 'center', marginTop: 16, padding: 10 },
  laterText: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
})