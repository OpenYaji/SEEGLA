/**
 * Promo Hour — Daily wellness check-in that unlocks tonight's exclusive deal
 *
 * States:
 *   1. PENDING    — Morning check-in not yet done (show 3 wellness questions)
 *   2. WAITING    — Check-in done, countdown to 8PM unlock
 *   3. LIVE       — 8PM arrived, voucher is live (1-hour window)
 *   4. LOCKED     — Missed check-in, locked for tonight
 *
 * The 3 morning check-in questions:
 *   Q1: How's your energy today?
 *   Q2: How did you sleep last night?
 *   Q3: What's your stress level?
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

const PROMO_HOUR     = 20   // 8 PM
const PROMO_END_HOUR = 21   // 9 PM (1-hour window)

type PromoState = 'pending' | 'waiting' | 'live' | 'locked'

interface Question {
  id:      string
  text:    string
  options: { emoji: string; label: string }[]
}

const QUESTIONS: Question[] = [
  {
    id:   'energy',
    text: 'How\'s your energy today?',
    options: [
      { emoji: '😴', label: 'Exhausted' },
      { emoji: '😐', label: 'Low' },
      { emoji: '😊', label: 'Good' },
      { emoji: '🚀', label: 'Energized' },
    ],
  },
  {
    id:   'sleep',
    text: 'How did you sleep last night?',
    options: [
      { emoji: '😩', label: 'Terrible' },
      { emoji: '😑', label: 'Poor' },
      { emoji: '😌', label: 'Okay' },
      { emoji: '😴', label: 'Great' },
    ],
  },
  {
    id:   'stress',
    text: 'What\'s your stress level?',
    options: [
      { emoji: '😤', label: 'Very High' },
      { emoji: '😣', label: 'High' },
      { emoji: '😐', label: 'Moderate' },
      { emoji: '😎', label: 'Low' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Countdown timer hook
// ─────────────────────────────────────────────────────────────────────────────

function useCountdown(targetHour: number) {
  const [remaining, setRemaining] = useState({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    const tick = () => {
      const now    = new Date()
      const target = new Date()
      target.setHours(targetHour, 0, 0, 0)
      if (target <= now) target.setDate(target.getDate() + 1)
      const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
      setRemaining({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetHour])

  return remaining
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown flip tile
// ─────────────────────────────────────────────────────────────────────────────

function FlipTile({ value, label }: { value: number; label: string }) {
  return (
    <View style={ft.wrap}>
      <View style={ft.tile}>
        <Text style={ft.num}>{String(value).padStart(2, '0')}</Text>
      </View>
      <Text style={ft.label}>{label}</Text>
    </View>
  )
}
const ft = StyleSheet.create({
  wrap:  { alignItems: 'center', gap: 6 },
  tile: {
    width:           80,
    height:          80,
    borderRadius:    16,
    backgroundColor: '#2a1500',
    borderWidth:     1,
    borderColor:     '#FF6B0044',
    alignItems:      'center',
    justifyContent:  'center',
  },
  num:   { fontSize: 34, fontWeight: '900', color: '#FF6B00', fontVariant: ['tabular-nums'] },
  label: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
})

// ─────────────────────────────────────────────────────────────────────────────
// Check-in complete / waiting state
// ─────────────────────────────────────────────────────────────────────────────

function WaitingState({ answers }: { answers: Record<string, string> }) {
  const countdown = useCountdown(PROMO_HOUR)

  return (
    <ScrollView contentContainerStyle={ws2.scroll} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={ws2.header}>
        <Text style={ws2.checkBadge}>CHECK-IN COMPLETE ✓</Text>
        <Text style={ws2.title}>You're in! 🙌</Text>
        <Text style={ws2.sub}>Tonight's exclusive promo unlocks at 8PM. Come back!</Text>
      </View>

      {/* Countdown */}
      <View style={ws2.countdownCard}>
        <Text style={ws2.countdownLabel}>PROMO UNLOCKS IN</Text>
        <View style={ws2.countdownRow}>
          <FlipTile value={countdown.h} label="HRS" />
          <Text style={ws2.colon}>:</Text>
          <FlipTile value={countdown.m} label="MIN" />
          <Text style={ws2.colon}>:</Text>
          <FlipTile value={countdown.s} label="SEC" />
        </View>
      </View>

      {/* Sneak peek */}
      <View style={ws2.sneakCard}>
        <Text style={ws2.sneakLabel}>TONIGHT'S DEAL — SNEAK PEEK</Text>
        <View style={ws2.sneakContent}>
          <Text style={ws2.sneakEmoji}>🔥</Text>
          <Text style={ws2.sneakText}>Revealed at 8:00 PM</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={ws2.summaryCard}>
        <Text style={ws2.summaryTitle}>✓ Your Morning Wellness Check-in</Text>
        {QUESTIONS.map((q, i) => {
          const answer = answers[q.id]
          const opt    = q.options.find((o) => o.label === answer)
          return (
            <View key={q.id} style={ws2.summaryRow}>
              <Text style={ws2.summaryIcon}>{opt?.emoji ?? '⚡'}</Text>
              <Text style={ws2.summaryQ}>{q.text}</Text>
              <Text style={ws2.summaryA}>Logged ✓</Text>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}
const ws2 = StyleSheet.create({
  scroll: { padding: 20, gap: 16, paddingBottom: 48 },
  header: {
    backgroundColor: '#0d2210',
    borderRadius:    18,
    padding:         20,
    alignItems:      'center',
    gap:             8,
  },
  checkBadge: { fontSize: 11, fontWeight: '800', color: '#3FE870', letterSpacing: 1 },
  title:      { fontSize: 26, fontWeight: '900', color: '#ffffff' },
  sub:        { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 19 },
  countdownCard: {
    backgroundColor: '#1a0a00',
    borderRadius:    18,
    padding:         20,
    alignItems:      'center',
    gap:             14,
    borderWidth:     1,
    borderColor:     '#FF6B0022',
  },
  countdownLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 },
  countdownRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colon:          { fontSize: 28, fontWeight: '900', color: '#FF6B00', marginBottom: 20 },
  sneakCard: {
    backgroundColor: '#1a0a00',
    borderRadius:    16,
    padding:         18,
    alignItems:      'center',
    gap:             12,
    borderWidth:     1,
    borderColor:     '#FF6B0022',
  },
  sneakLabel:   { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5 },
  sneakContent: { alignItems: 'center', gap: 8 },
  sneakEmoji:   { fontSize: 36 },
  sneakText:    { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius:    16,
    padding:         16,
    gap:             12,
    borderWidth:     1,
    borderColor:     '#e2e8f0',
  },
  summaryTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  summaryRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon:  { fontSize: 18, width: 26 },
  summaryQ:     { flex: 1, fontSize: 12, color: '#475569' },
  summaryA:     { fontSize: 11, fontWeight: '700', color: '#3FE870' },
})

// ─────────────────────────────────────────────────────────────────────────────
// Live state
// ─────────────────────────────────────────────────────────────────────────────

function LiveState() {
  const countdown = useCountdown(PROMO_END_HOUR)
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}>
      <View style={live.header}>
        <View style={live.fireBadge}>
          <Text style={live.fireBadgeText}>🔥 PROMO HOUR IS LIVE</Text>
        </View>
        <Text style={live.title}>Tonight's Deal</Text>
        <Text style={live.sub}>40% off GrabFood — Valid for 1 hour only</Text>
      </View>
      <View style={live.timerCard}>
        <Text style={live.timerLabel}>EXPIRES IN</Text>
        <View style={live.timerRow}>
          <FlipTile value={countdown.m} label="MIN" />
          <Text style={[ft.num, { color: '#FF6B00' }]}>:</Text>
          <FlipTile value={countdown.s} label="SEC" />
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [live.redeemBtn, pressed && { opacity: 0.88 }]}
        onPress={() => Alert.alert('Voucher', 'GRAB-SEEGLA-40OFF\nCopy this code in your GrabFood app!')}
      >
        <Text style={live.redeemText}>Reveal My Voucher 🎁</Text>
      </Pressable>
    </ScrollView>
  )
}
const live = StyleSheet.create({
  header:       { backgroundColor: '#1a0a00', borderRadius: 18, padding: 20, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#FF6B0033' },
  fireBadge:    { backgroundColor: '#FF6B00', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  fireBadgeText:{ fontSize: 12, fontWeight: '800', color: '#fff' },
  title:        { fontSize: 26, fontWeight: '900', color: '#ffffff' },
  sub:          { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  timerCard:    { backgroundColor: '#1a0a00', borderRadius: 16, padding: 20, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#FF6B0022' },
  timerLabel:   { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 },
  timerRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  redeemBtn:    { backgroundColor: '#FF6B00', borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  redeemText:   { fontSize: 16, fontWeight: '800', color: '#fff' },
})

// ─────────────────────────────────────────────────────────────────────────────
// Locked state
// ─────────────────────────────────────────────────────────────────────────────

function LockedState() {
  return (
    <View style={lk.wrap}>
      <Text style={lk.emoji}>🔒</Text>
      <Text style={lk.title}>Tonight's promo is locked.</Text>
      <Text style={lk.sub}>
        You missed your morning check-in today.{'\n'}
        Check in tomorrow morning to unlock tomorrow night's deal.
      </Text>
      <View style={lk.tip}>
        <Ionicons name="notifications-outline" size={16} color="#3FE870" />
        <Text style={lk.tipText}>Enable notifications so you never miss a 7AM check-in again.</Text>
      </View>
    </View>
  )
}
const lk = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  emoji: { fontSize: 52 },
  title: { fontSize: 22, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  sub:   { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  tip:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#d1fae5' },
  tipText: { flex: 1, fontSize: 13, color: '#065f46', lineHeight: 19 },
})

// ─────────────────────────────────────────────────────────────────────────────
// Morning Check-in flow
// ─────────────────────────────────────────────────────────────────────────────

function CheckInFlow({ onComplete }: { onComplete: (answers: Record<string, string>) => void }) {
  const [qIdx,    setQIdx]    = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const q = QUESTIONS[qIdx]

  const pick = (option: string) => {
    const next = { ...answers, [q.id]: option }
    setAnswers(next)
    if (qIdx < QUESTIONS.length - 1) {
      setQIdx(qIdx + 1)
    } else {
      onComplete(next)
    }
  }

  return (
    <ScrollView contentContainerStyle={ci.scroll} showsVerticalScrollIndicator={false}>
      {/* Notification banner */}
      <View style={ci.notifCard}>
        <View style={ci.notifIcon}>
          <Text style={{ fontSize: 18 }}>🌅</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ci.notifTitle}>Seegla · just now</Text>
          <Text style={ci.notifText}>
            Good morning! How's your energy today?{' '}
            <Text style={{ color: '#FF6B00', fontWeight: '700' }}>
              60 seconds to unlock tonight's promo. 🌅
            </Text>
          </Text>
        </View>
      </View>

      {/* Teaser */}
      <View style={ci.teaserCard}>
        <Text style={ci.teaserEmoji}>🔥</Text>
        <View>
          <Text style={ci.teaserTitle}>Tonight at 8PM</Text>
          <Text style={ci.teaserSub}>Complete check-in to unlock</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={ci.divider} />

      {/* Progress */}
      <View style={ci.progressRow}>
        <View style={ci.progressIcon}>
          <Ionicons name="flash-outline" size={14} color="#FF6B00" />
        </View>
        <Text style={ci.progressText}>Question {qIdx + 1} of {QUESTIONS.length}</Text>
      </View>

      {/* Question */}
      <Text style={ci.question}>{q.text}</Text>

      {/* Options */}
      <View style={ci.options}>
        {q.options.map((opt) => (
          <Pressable
            key={opt.label}
            onPress={() => pick(opt.label)}
            style={({ pressed }) => [
              ci.option,
              pressed && { backgroundColor: '#1a3a1a', borderColor: '#3FE870' },
            ]}
          >
            <Text style={ci.optionEmoji}>{opt.emoji}</Text>
            <Text style={ci.optionText}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}
const ci = StyleSheet.create({
  scroll:       { padding: 20, gap: 14, paddingBottom: 48 },
  notifCard: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            12,
    backgroundColor:'#1a1a1a',
    borderRadius:   16,
    padding:        16,
    borderWidth:    1,
    borderColor:    '#FF6B0033',
  },
  notifIcon: {
    width:          40,
    height:         40,
    borderRadius:   10,
    backgroundColor:'#3FE87020',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  notifTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  notifText:  { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 19 },
  teaserCard: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            14,
    backgroundColor:'#1a0a00',
    borderRadius:   14,
    padding:        16,
    borderWidth:    1,
    borderColor:    '#FF6B0033',
  },
  teaserEmoji: { fontSize: 28 },
  teaserTitle: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  teaserSub:   { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  divider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressIcon:{ width: 26, height: 26, borderRadius: 8, backgroundColor: '#FF6B0020', alignItems: 'center', justifyContent: 'center' },
  progressText:{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  question:    { fontSize: 24, fontWeight: '900', color: '#ffffff', lineHeight: 32 },
  options:     { gap: 10 },
  option: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               14,
    backgroundColor:   '#1a1a1a',
    borderRadius:      14,
    borderWidth:       1.5,
    borderColor:       '#2a2a2a',
    paddingHorizontal: 18,
    paddingVertical:   16,
  },
  optionEmoji: { fontSize: 22 },
  optionText:  { fontSize: 16, fontWeight: '600', color: '#ffffff' },
})

// ─────────────────────────────────────────────────────────────────────────────
// Main Promo screen
// ─────────────────────────────────────────────────────────────────────────────

const TODAY_KEY = () => `seegla_promo_checkin_${new Date().toISOString().split('T')[0]}`

export default function PromoScreen() {
  const { user } = useAuth()
  const [state,   setState]   = useState<PromoState>('pending')
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Determine promo state
  const resolveState = useCallback(async (): Promise<PromoState> => {
    const now  = new Date()
    const h    = now.getHours()
    const done = await AsyncStorage.getItem(TODAY_KEY())

    if (h >= PROMO_HOUR && h < PROMO_END_HOUR) {
      return done ? 'live' : 'locked'
    }
    if (h >= PROMO_END_HOUR) {
      return done ? 'locked' : 'locked' // missed or expired
    }
    return done ? 'waiting' : 'pending'
  }, [])

  useEffect(() => {
    resolveState().then(setState)
  }, [resolveState])

  const handleCheckInComplete = async (ans: Record<string, string>) => {
    setAnswers(ans)
    // Persist to Supabase if user exists
    if (user) {
      await supabase.from('wellness_checkins').upsert({
        user_id:    user.id,
        checkin_date: new Date().toISOString().split('T')[0],
        energy:     ans.energy,
        sleep:      ans.sleep,
        stress:     ans.stress,
      }).then(() => {})
    }
    await AsyncStorage.setItem(TODAY_KEY(), JSON.stringify(ans))
    // Award points
    if (user) {
      await supabase.rpc('increment_user_points', { p_user_id: user.id, p_points: 50 }).then(() => {})
    }
    setState('waiting')
  }

  // Status bar color
  const isOrange = state === 'pending' || state === 'live'

  return (
    <SafeAreaView style={[sc2.root, state === 'locked' && { backgroundColor: '#f8fafc' }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[sc2.header, state === 'locked' && { backgroundColor: '#f8fafc' }]}>
        {/* Orange pill indicator */}
        <View style={sc2.headerLeft}>
          <View style={[sc2.statusDot, { backgroundColor: isOrange ? '#FF6B00' : '#3FE870' }]} />
          <Text style={[sc2.headerTitle, state === 'locked' && { color: '#0f172a' }]}>
            {state === 'pending' ? 'Morning Check-In'  :
             state === 'waiting' ? 'Check-In Complete' :
             state === 'live'    ? 'Promo Hour 🔥'    :
                                   'Promo Locked'}
          </Text>
        </View>
        {state === 'pending' && (
          <Text style={sc2.timeText}>7:02 AM</Text>
        )}
      </View>

      {/* Pill labels (like Figma header) */}
      {(state === 'pending' || state === 'waiting') && (
        <View style={sc2.pillBar}>
          <View style={[sc2.pill, state === 'pending' && sc2.pillActive]}>
            <Text style={[sc2.pillText, state === 'pending' && sc2.pillTextActive]}>
              MORNING CHECK-IN
            </Text>
          </View>
          {state === 'pending' && (
            <Text style={sc2.pillTime}>7:02 AM</Text>
          )}
        </View>
      )}

      {/* Content */}
      {state === 'pending' && <CheckInFlow onComplete={handleCheckInComplete} />}
      {state === 'waiting' && <WaitingState answers={answers} />}
      {state === 'live'    && <LiveState />}
      {state === 'locked'  && <LockedState />}
    </SafeAreaView>
  )
}

const sc2 = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingTop:        Platform.OS === 'ios' ? 0 : 12,
    paddingBottom:     8,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize:   15,
    fontWeight: '800',
    color:      '#ffffff',
  },
  timeText: {
    fontSize:   13,
    color:      'rgba(255,255,255,0.45)',
    fontWeight: '600',
  },
  pillBar: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    paddingHorizontal: 20,
    paddingVertical:   8,
  },
  pill: {
    borderRadius:      99,
    paddingHorizontal: 12,
    paddingVertical:   5,
    backgroundColor:   '#2a2a2a',
  },
  pillActive: {
    backgroundColor: '#FF6B0020',
    borderWidth:     1,
    borderColor:     '#FF6B0055',
  },
  pillText: {
    fontSize:   10,
    fontWeight: '800',
    color:      'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  pillTextActive: {
    color: '#FF6B00',
  },
  pillTime: {
    fontSize:   12,
    color:      'rgba(255,255,255,0.35)',
    fontWeight: '600',
  },
})
