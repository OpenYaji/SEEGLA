/**
 * Dashboard — Home tab
 *
 * - Greeting + date + avatar
 * - Wellness Score circular card
 * - TODAY'S METRICS: 2×2 grid (Wellness Score, Steps, Active Mins, Calories)
 * - DAILY HABITS: 3×2 grid of habit tiles
 * - March Step Challenge card
 * - Daily Promo Hour card (links to Promo tab)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
  Pressable,
  Dimensions,
  Modal,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const { width } = Dimensions.get('window')

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TodayMetrics {
  steps:            number
  exercise_minutes: number
  calories:         number
  wellness_score:   number
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function greeting(name: string | undefined): string {
  const h    = new Date().getHours()
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  const first = name?.split(' ')[0] ?? 'Juan'
  return `Good ${part}, ${first}!`
}

function dayLabel(): string {
  const now = new Date()
  return now.toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric',
  }) + ' · PH'
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1)
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
    </View>
  )
}
const pb = StyleSheet.create({
  track: { height: 5, borderRadius: 3, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  fill:  { height: 5, borderRadius: 3 },
})

// ─────────────────────────────────────────────────────────────────────────────
// Wellness Score card (circular)
// ─────────────────────────────────────────────────────────────────────────────

function WellnessScoreCard({ score }: { score: number }) {
  return (
    <View style={ws.card}>
      {/* Circle */}
      <View style={ws.circleWrap}>
        <View style={ws.circleOuter}>
          <View style={ws.circleInner}>
            <Text style={ws.scoreNum}>{score}</Text>
            <Text style={ws.scoreDen}>/100</Text>
          </View>
        </View>
      </View>
      {/* Text */}
      <View style={ws.textBlock}>
        <Text style={ws.title}>Wellness Score ☀️</Text>
        <Text style={ws.subtitle}>
          You're in the top 15% of your company! Keep it up, Kabayan!
        </Text>
        <View style={ws.badge}>
          <Ionicons name="trending-up-outline" size={12} color="#3FE870" />
          <Text style={ws.badgeText}>+5 from last week</Text>
        </View>
      </View>
    </View>
  )
}
const ws = StyleSheet.create({
  card: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#ffffff',
    borderRadius:      18,
    padding:           18,
    gap:               16,
    marginHorizontal:  16,
    marginTop:         16,
    borderWidth:       1,
    borderColor:       '#f1f5f9',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  circleWrap:  { alignItems: 'center', justifyContent: 'center' },
  circleOuter: {
    width:           76,
    height:          76,
    borderRadius:    38,
    borderWidth:     4,
    borderColor:     '#3FE870',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#f0fdf4',
  },
  circleInner: { alignItems: 'center' },
  scoreNum:    { fontSize: 22, fontWeight: '900', color: '#0f172a', lineHeight: 26 },
  scoreDen:    { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  textBlock:   { flex: 1, gap: 5 },
  title:       { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  subtitle:    { fontSize: 12, color: '#64748b', lineHeight: 17 },
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   '#f0fdf4',
    borderRadius:      99,
    paddingHorizontal: 8,
    paddingVertical:   4,
    alignSelf:         'flex-start',
    marginTop:         2,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#3FE870' },
})

// ─────────────────────────────────────────────────────────────────────────────
// Metric card (2×2 grid)
// ─────────────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  emoji:    string
  value:    string
  unit:     string
  label:    string
  current:  number
  max:      number
  barColor: string
}
function MetricCard({ emoji, value, unit, label, current, max, barColor }: MetricCardProps) {
  return (
    <View style={mc.card}>
      <View style={mc.topRow}>
        <Text style={mc.emoji}>{emoji}</Text>
        <Text style={mc.unit}>{unit}</Text>
      </View>
      <Text style={mc.value}>{value}</Text>
      <Text style={mc.label}>{label}</Text>
      <ProgressBar value={current} max={max} color={barColor} />
    </View>
  )
}
const mc = StyleSheet.create({
  card: {
    flex:            1,
    backgroundColor: '#ffffff',
    borderRadius:    14,
    padding:         14,
    gap:             5,
    borderWidth:     1,
    borderColor:     '#f1f5f9',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emoji:  { fontSize: 18 },
  unit:   { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  value:  { fontSize: 22, fontWeight: '900', color: '#0f172a', lineHeight: 26 },
  label:  { fontSize: 11, color: '#64748b', fontWeight: '500', marginBottom: 4 },
})

// ─────────────────────────────────────────────────────────────────────────────
// Daily Habit tile
// ─────────────────────────────────────────────────────────────────────────────

interface HabitTileProps {
  emoji:    string
  value:    string
  label:    string
  done:     boolean
}
function HabitTile({ emoji, value, label, done }: HabitTileProps) {
  return (
    <View style={ht.tile}>
      <Text style={ht.emoji}>{emoji}</Text>
      <Text style={ht.value}>{value}</Text>
      <Text style={ht.label}>{label}</Text>
      {done && (
        <View style={ht.check}>
          <Ionicons name="checkmark-circle" size={16} color="#3FE870" />
        </View>
      )}
    </View>
  )
}
const ht = StyleSheet.create({
  tile: {
    flex:            1,
    backgroundColor: '#1a3a1a',
    borderRadius:    14,
    padding:         12,
    minHeight:       80,
    gap:             3,
  },
  emoji: { fontSize: 20 },
  value: { fontSize: 15, fontWeight: '900', color: '#ffffff', marginTop: 4 },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  check: {
    position: 'absolute',
    bottom:   8,
    right:    8,
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────

function SectionHead({ title, right }: { title: string; right?: string }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      {right && <Text style={sh.right}>{right}</Text>}
    </View>
  )
}
const sh = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 13, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase' },
  right: { fontSize: 13, fontWeight: '700', color: '#3FE870' },
})

// ─────────────────────────────────────────────────────────────────────────────
// Profile Drawer
// ─────────────────────────────────────────────────────────────────────────────

const DRAWER_WIDTH = width * 0.8

function ProfileDrawer({
  visible,
  onClose,
  user,
}: {
  visible: boolean
  onClose: () => void
  user:    any
}) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue:         0,
        tension:         65,
        friction:        11,
        useNativeDriver: true,
      }).start()
    } else {
      slideAnim.setValue(DRAWER_WIDTH)
    }
  }, [visible])

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue:         DRAWER_WIDTH,
      duration:        220,
      useNativeDriver: true,
    }).start(() => onClose())
  }

  const handleLogOut = async () => {
    handleClose()
    await supabase.auth.signOut()
    router.replace('/')
  }

  const authorName = user?.full_name ?? 'Juan Dela Cruz'
  const initials   = authorName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const role       = user?.wellness_rank ?? 'Wellness Member'

  const handleViewProfile = () => {
    handleClose()
    setTimeout(() => router.push('/(tabs)/profile'), 250)
  }

  const MENU_ITEMS = [
    { icon: 'person-outline'       as const, label: 'View Profile',       onPress: handleViewProfile },
    { icon: 'settings-outline'     as const, label: 'Settings & Privacy', onPress: undefined },
    { icon: 'newspaper-outline'    as const, label: 'Activity Log',        onPress: undefined },
    { icon: 'help-circle-outline'  as const, label: 'Help & Support',      onPress: undefined },
  ]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={dr.overlay}>
        {/* Backdrop — tap to close */}
        <Pressable style={dr.backdrop} onPress={handleClose} />

        {/* Sliding drawer */}
        <Animated.View style={[dr.drawer, { transform: [{ translateX: slideAnim }] }]}>

          {/* ── Profile header ── */}
          <View style={dr.profileSection}>
            <View style={dr.avatarWrap}>
              <View style={dr.avatarCircle}>
                <Text style={dr.avatarInitials}>{initials}</Text>
              </View>
              <View style={dr.editBadge}>
                <Ionicons name="pencil" size={11} color="#ffffff" />
              </View>
            </View>
            <Text style={dr.profileName}>{authorName}</Text>
            <Text style={dr.profileRole}>{role}</Text>
          </View>

          <View style={dr.divider} />

          {/* ── Menu items ── */}
          <ScrollView style={dr.menuScroll} showsVerticalScrollIndicator={false}>
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                style={({ pressed }) => [dr.menuItem, pressed && { backgroundColor: '#f8fafc' }]}
              >
                <View style={dr.menuIconBox}>
                  <Ionicons name={item.icon} size={20} color="#475569" />
                </View>
                <Text style={dr.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </Pressable>
            ))}
          </ScrollView>

          {/* ── Log Out (bottom) ── */}
          <View style={dr.footer}>
            <View style={dr.divider} />
            <Pressable
              onPress={handleLogOut}
              style={({ pressed }) => [dr.logoutBtn, pressed && { opacity: 0.75 }]}
            >
              <View style={dr.logoutIconBox}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              </View>
              <Text style={dr.logoutText}>Log Out</Text>
            </Pressable>
          </View>

        </Animated.View>
      </View>
    </Modal>
  )
}

const dr = StyleSheet.create({
  overlay: {
    flex:           1,
    flexDirection:  'row',
    backgroundColor:'transparent',
  },
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    width:           DRAWER_WIDTH,
    backgroundColor: '#ffffff',
    height:          '100%',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },

  // Profile section
  profileSection: {
    alignItems:        'center',
    paddingTop:        Platform.OS === 'ios' ? 64 : 48,
    paddingBottom:     24,
    paddingHorizontal: 20,
    gap:               6,
    backgroundColor:   '#f8fafc',
  },
  avatarWrap: {
    marginBottom: 8,
  },
  avatarCircle: {
    width:           76,
    height:          76,
    borderRadius:    38,
    backgroundColor: '#3FE870',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     3,
    borderColor:     '#ffffff',
    ...Platform.select({
      ios:     { shadowColor: '#3FE870', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  avatarInitials: {
    fontSize:   26,
    fontWeight: '900',
    color:      '#0d2210',
  },
  editBadge: {
    position:        'absolute',
    bottom:          0,
    right:           0,
    width:           24,
    height:          24,
    borderRadius:    12,
    backgroundColor: '#1a3a1a',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     '#ffffff',
  },
  profileName: {
    fontSize:   17,
    fontWeight: '900',
    color:      '#0f172a',
    textAlign:  'center',
  },
  profileRole: {
    fontSize:  12,
    color:     '#94a3b8',
    fontWeight:'600',
  },

  divider: {
    height:          1,
    backgroundColor: '#f1f5f9',
  },

  // Menu
  menuScroll: {
    flex: 1,
  },
  menuItem: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               14,
    paddingHorizontal: 20,
    paddingVertical:   15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  menuIconBox: {
    width:          38,
    height:         38,
    borderRadius:   10,
    backgroundColor:'#f8fafc',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  menuLabel: {
    flex:       1,
    fontSize:   14,
    fontWeight: '600',
    color:      '#334155',
  },

  // Footer / Log out
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  logoutBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               14,
    paddingHorizontal: 20,
    paddingVertical:   16,
  },
  logoutIconBox: {
    width:          38,
    height:         38,
    borderRadius:   10,
    backgroundColor:'#fef2f2',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  logoutText: {
    fontSize:   14,
    fontWeight: '700',
    color:      '#ef4444',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard screen
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user } = useAuth()
  const [metrics,      setMetrics]      = useState<TodayMetrics>({ steps: 0, exercise_minutes: 0, calories: 0, wellness_score: 0 })
  const [totalPoints,  setTotalPoints]  = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDrawer,   setShowDrawer]   = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    if (!user) return
    const [metricsRes, pointsRes] = await Promise.all([
      supabase
        .from('health_metrics')
        .select('steps, exercise_minutes, calories, wellness_score')
        .eq('user_id', user.id)
        .eq('metric_date', today)
        .maybeSingle(),
      supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])
    if (metricsRes.data) {
      setMetrics({
        steps:            (metricsRes.data as any).steps            ?? 0,
        exercise_minutes: (metricsRes.data as any).exercise_minutes ?? 0,
        calories:         (metricsRes.data as any).calories         ?? 0,
        wellness_score:   (metricsRes.data as any).wellness_score   ?? 87,
      })
    }
    if (pointsRes.data) setTotalPoints((pointsRes.data as any).total_points ?? 0)
  }, [user, today])

  useEffect(() => { load() }, [load])

  const onRefresh = async () => {
    setIsRefreshing(true)
    await load()
    setIsRefreshing(false)
  }

  if (!user) return null

  // Fallback demo values
  const steps    = metrics.steps    || 8420
  const actMins  = metrics.exercise_minutes || 42
  const calories = metrics.calories || 320
  const wsScore  = metrics.wellness_score   || 87
  const pts      = totalPoints || 1420

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#3FE870" />
        }
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.dateText}>{dayLabel()}</Text>
            <Text style={s.greeting}>{greeting(user.full_name)}</Text>
          </View>
          {/* Avatar — opens profile drawer */}
          <Pressable
            onPress={() => setShowDrawer(true)}
            style={({ pressed }) => [s.avatar, pressed && { opacity: 0.8 }]}
          >
            <Text style={s.avatarText}>
              {user.full_name?.charAt(0).toUpperCase() ?? 'J'}
            </Text>
          </Pressable>
        </View>

        {/* ── Wellness Score ── */}
        <WellnessScoreCard score={wsScore} />

        {/* ── Today's Metrics ── */}
        <View style={s.section}>
          <SectionHead title="Today's Metrics" />
          <View style={s.grid}>
            <MetricCard emoji="⭐" value={String(wsScore)} unit="/100" label="Wellness Score"
              current={wsScore} max={100} barColor="#f59e0b" />
            <MetricCard emoji="🏃" value={steps.toLocaleString()} unit="today" label="Steps"
              current={steps} max={10000} barColor="#f97316" />
          </View>
          <View style={[s.grid, { marginTop: 10 }]}>
            <MetricCard emoji="⚡" value={String(actMins)} unit="min" label="Active Mins"
              current={actMins} max={60} barColor="#f97316" />
            <MetricCard emoji="🔥" value={String(calories)} unit="kcal" label="Calories"
              current={calories} max={500} barColor="#f97316" />
          </View>
        </View>

        {/* ── Daily Habits ── */}
        <View style={s.section}>
          <SectionHead title="Daily Habits" right="4/6 done" />
          <View style={s.habitGrid}>
            <View style={s.habitRow}>
              <HabitTile emoji="💧" value="6/8"   label="glasses"    done />
              <HabitTile emoji="🏃" value="8,420" label="/10k"       done />
              <HabitTile emoji="🔥" value="0/10"  label="mins"       done={false} />
            </View>
            <View style={s.habitRow}>
              <HabitTile emoji="😴" value="7.5h"  label="last night" done />
              <HabitTile emoji="🥗" value="2/3"   label="meals logged" done />
              <HabitTile emoji="☕" value="3"     label="breaks taken" done />
            </View>
          </View>
        </View>

        {/* ── March Step Challenge ── */}
        <Pressable
          onPress={() => router.push('/(tabs)/rewards')}
          style={s.challengeCard}
        >
          <View style={s.challengeLeft}>
            <Text style={s.challengeEmoji}>🏆</Text>
          </View>
          <View style={s.challengeText}>
            <Text style={s.challengeTitle}>March Step Challenge</Text>
            <Text style={s.challengeSub}>250,000 / 300,000 company steps</Text>
            <View style={s.challengeBarTrack}>
              <View style={[s.challengeBarFill, { width: '83%' }]} />
            </View>
          </View>
          <View style={s.challengePct}>
            <Text style={s.challengePctText}>83%</Text>
          </View>
        </Pressable>

        {/* ── Daily Promo Hour ── */}
        <Pressable
          onPress={() => router.push('/(tabs)/promo')}
          style={s.promoCard}
        >
          <View style={s.promoLeft}>
            <View style={s.promoIconBox}>
              <Text style={s.promoIcon}>🔥</Text>
            </View>
          </View>
          <View style={s.promoText}>
            <View style={s.promoTitleRow}>
              <Text style={s.promoTitle}>Daily Promo Hour</Text>
              <View style={s.promoBadge}>
                <Text style={s.promoBadgeText}>TONIGHT 8PM</Text>
              </View>
            </View>
            <Text style={s.promoSub}>Check in now → unlock exclusive deals</Text>
            <View style={s.promoMeta}>
              <Text style={s.promoMetaText}>⏱ Unlocks in 8h 34m</Text>
              <Text style={[s.promoMetaText, { color: '#3FE870' }]}>  ✓ You're checked in!</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
        </Pressable>

      </ScrollView>

      {/* ── Profile Drawer ── */}
      <ProfileDrawer
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        user={user}
      />

    </SafeAreaView>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingTop:        16,
    paddingBottom:     4,
  },
  dateText: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 2 },
  greeting: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  avatar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: '#3FE870',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     '#ffffff',
  },
  avatarText: { fontSize: 16, fontWeight: '900', color: '#0d2210' },

  section: {
    paddingHorizontal: 16,
    paddingTop:        20,
  },
  grid: {
    flexDirection: 'row',
    gap:           10,
  },

  habitGrid: { gap: 10 },
  habitRow:  { flexDirection: 'row', gap: 10 },

  // March Step Challenge
  challengeCard: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#1e1040',
    borderRadius:      16,
    marginHorizontal:  16,
    marginTop:         20,
    padding:           16,
    gap:               12,
  },
  challengeLeft:    { justifyContent: 'center' },
  challengeEmoji:   { fontSize: 28 },
  challengeText:    { flex: 1, gap: 4 },
  challengeTitle:   { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  challengeSub:     { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  challengeBarTrack:{
    height:          6,
    borderRadius:    3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow:        'hidden',
    marginTop:       4,
  },
  challengeBarFill: {
    height:          6,
    borderRadius:    3,
    backgroundColor: '#FFC091',
  },
  challengePct:     { alignItems: 'center' },
  challengePctText: { fontSize: 15, fontWeight: '900', color: '#FFC091' },

  // Promo Hour card
  promoCard: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#1a0a00',
    borderRadius:      16,
    marginHorizontal:  16,
    marginTop:         12,
    padding:           16,
    gap:               12,
    borderWidth:       1,
    borderColor:       '#FF6B0033',
  },
  promoLeft:    {},
  promoIconBox: {
    width:           44,
    height:          44,
    borderRadius:    12,
    backgroundColor: '#FF6B0022',
    alignItems:      'center',
    justifyContent:  'center',
  },
  promoIcon:    { fontSize: 22 },
  promoText:    { flex: 1, gap: 4 },
  promoTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  promoTitle:   { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  promoBadge: {
    backgroundColor:   '#FF6B00',
    borderRadius:      6,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  promoBadgeText: { fontSize: 9, fontWeight: '800', color: '#ffffff', letterSpacing: 0.4 },
  promoSub:       { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  promoMeta:      { flexDirection: 'row', gap: 4 },
  promoMetaText:  { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
})
