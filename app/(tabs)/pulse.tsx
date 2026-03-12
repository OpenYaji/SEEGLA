/**
 * Challenges & Leaderboard Screen 
 *
 * - Navy header with Daily/Weekly/Team challenge toggles
 * - Challenge cards with progress bars and "Join" buttons
 * - Leaderboard section using the classic gamified design (Trophies & Rank Chips)
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Pressable,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '@/lib/auth-context'

// ─────────────────────────────────────────────────────────────────────────────
// Brand Colors & Theme
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
  navy: '#1E2356',     
  teal: '#00C4C7',     
  purple: '#6244CB',   
  orange: '#FFB185',   
  orangeDark: '#F59E0B',
  green: '#4CAF7A',    
  lightGreen: '#E8F5E9',
  lightTeal: '#E6FDFD',
  bgGray: '#F7F9FC',   
  white: '#FFFFFF',
  textPrimary: '#1E2356',
  textSecondary: '#64748B',
  border: '#E5E7EB',
  disabledText: '#94A3B8'
}

// ─────────────────────────────────────────────────────────────────────────────
// Config & Helpers
// ─────────────────────────────────────────────────────────────────────────────

type ChallengeTab = 'daily' | 'weekly' | 'team'
type LeaderboardTab = 'individual' | 'department' | 'company'
type RankKey = 'beginner' | 'veteran' | 'pro'

const RANK: Record<RankKey, {
  label:       string
  icon:        keyof typeof Ionicons.glyphMap
  borderColor: string
  bgColor:     string
  textColor:   string
}> = {
  beginner: {
    label: 'Beginner', icon: 'leaf-outline',
    borderColor: COLORS.green, bgColor: COLORS.lightGreen, textColor: '#15803d',
  },
  veteran: {
    label: 'Veteran',  icon: 'flash-outline',
    borderColor: COLORS.teal, bgColor: COLORS.lightTeal, textColor: '#0e7490',
  },
  pro: {
    label: 'Pro',      icon: 'trophy-outline',
    borderColor: COLORS.orangeDark, bgColor: '#FFF8E1', textColor: '#b45309',
  },
}

const POSITION_COLORS = [COLORS.orangeDark, COLORS.textSecondary, COLORS.orange, COLORS.disabledText]

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CHALLENGES = {
  daily: [
    { id: '1', title: 'Walk 8,000 Steps', sub: 'Track your steps via Google Fit', category: 'Movement', time: 'Ends tonight', points: 50, icon: '🚶', iconBg: COLORS.lightGreen, progress: 72, joined: true },
    { id: '2', title: 'Drink 6 Glasses of Water', sub: 'Stay hydrated throughout the day', category: 'Hydration', time: 'Ends tonight', points: 30, icon: '💧', iconBg: '#E0F2FE', progress: 66, joined: true },
    { id: '3', title: 'Meditate for 5 Minutes', sub: 'Find calm in the middle of your day', category: 'Mental', time: 'Ends tonight', points: 40, icon: '🧘', iconBg: '#FEF3C7', progress: 0, joined: false },
  ],
  weekly: [
    { id: '4', title: 'Log 50,000 Steps', sub: 'Cumulative weekly step count', category: 'Movement', time: '4 days left', points: 200, icon: '👟', iconBg: '#F3E8FF', progress: 58, joined: true },
    { id: '5', title: 'Complete 5 Check-ins', sub: 'Answer your morning wellness check-in', category: 'Wellbeing', time: '4 days left', points: 100, icon: '✅', iconBg: COLORS.lightGreen, progress: 80, joined: true },
    { id: '6', title: 'Sleep 7+ Hours x3', sub: 'Track sleep via Health Connect', category: 'Recovery', time: '4 days left', points: 80, icon: '😴', iconBg: '#FFEDD5', progress: 0, joined: false },
  ],
  team: [
    { id: '7', title: 'IT Dept: 100k Steps', sub: 'Your department’s combined step goal', category: 'Team', time: '5 days left', points: 500, icon: '🏢', iconBg: '#E2E8F0', progress: 64, joined: true },
    { id: '8', title: 'March Wellness Sprint', sub: 'Company-wide challenge this month', category: 'Company', time: '19 days left', points: 350, icon: '🏃', iconBg: '#FEF3C7', progress: 41, joined: true },
    { id: '9', title: 'Hydration Heroes', sub: 'Team-based hydration challenge', category: 'Team', time: '5 days left', points: 250, icon: '💦', iconBg: '#E0F2FE', progress: 0, joined: false },
  ]
}

const MOCK_LEADERBOARD = [
  { id: 'l1', rank: 1, name: 'Ana Reyes', dept: 'Marketing', points: 2840, rankKey: 'pro' as RankKey },
  { id: 'l2', rank: 2, name: 'Paulo Cruz', dept: 'Sales', points: 2615, rankKey: 'veteran' as RankKey },
  { id: 'l3', rank: 3, name: 'Marco Santos', dept: 'IT', points: 2480, rankKey: 'veteran' as RankKey },
  { id: 'l4', rank: 4, name: 'Ria dela Cruz', dept: 'HR', points: 2200, rankKey: 'beginner' as RankKey },
]

const MOCK_ME = { id: 'me', rank: 50, name: 'You (Jenzele)', dept: 'IT', points: 1240, rankKey: 'beginner' as RankKey }

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: `${progress}%` }]} />
    </View>
  )
}

function RankChip({ rank }: { rank: string }) {
  const cfg = RANK[(rank as RankKey)] ?? RANK.beginner
  return (
    <View style={[chip.chip, { borderColor: cfg.borderColor, backgroundColor: cfg.bgColor }]}>
      <Ionicons name={cfg.icon} size={8} color={cfg.textColor} />
      <Text style={[chip.text, { color: cfg.textColor }]}>{cfg.label}</Text>
    </View>
  )
}

const chip = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: { fontSize: 9, fontWeight: '700' },
})

function PositionMedal({ position }: { position: number }) {
  if (position === 1) return <Ionicons name="trophy" size={18} color={POSITION_COLORS[0]} />
  if (position === 2) return <Ionicons name="medal" size={18} color={POSITION_COLORS[1]} />
  if (position === 3) return <Ionicons name="medal" size={18} color={POSITION_COLORS[2]} />
  return <Text style={medal.number}>{position}</Text>
}

const medal = StyleSheet.create({
  number: { fontSize: 14, fontWeight: '700', width: 20, textAlign: 'center', color: POSITION_COLORS[3] },
})

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function ChallengesScreen() {
  const { user, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const [activeChallengeTab, setActiveChallengeTab] = useState<ChallengeTab>('daily')
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<LeaderboardTab>('individual')

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true)
    else setIsLoading(true)
    
    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false)
      setIsRefreshing(false)
    }, 500)
  }

  useEffect(() => {
    if (!authLoading) loadData()
  }, [authLoading])

  if (authLoading || isLoading) {
    return (
      <SafeAreaView style={s.centerFill}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </SafeAreaView>
    )
  }

  const currentChallenges = MOCK_CHALLENGES[activeChallengeTab]

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      
      {/* ── 1. Navy Header ── */}
      <View style={s.headerBg}>
        <Text style={s.headerSubtitle}>Compete & Win</Text>
        <Text style={s.headerTitle}>Challenges</Text>
        
        <View style={s.tabRow}>
          {(['daily', 'weekly', 'team'] as ChallengeTab[]).map((tab) => {
            const isActive = activeChallengeTab === tab
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveChallengeTab(tab)}
                style={[s.tabPill, isActive && s.tabPillActive]}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* ── 2. Scrollable Body ── */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={s.scrollBody}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} tintColor={COLORS.teal} />}
      >
        
        {/* ── Challenges List ── */}
        <View style={s.challengesList}>
          {currentChallenges.map((item) => (
            <View key={item.id} style={s.card}>
              <View style={s.cardTopRow}>
                <View style={[s.cardIconBox, { backgroundColor: item.iconBg }]}>
                  <Text style={s.cardIconText}>{item.icon}</Text>
                </View>
                <View style={s.cardTextContent}>
                  <Text style={s.cardTitle}>{item.title}</Text>
                  <Text style={s.cardSubtitle}>{item.sub}</Text>
                  <View style={s.cardMetaRow}>
                    <View style={s.categoryTag}>
                      <Text style={s.categoryText}>{item.category}</Text>
                    </View>
                    <Text style={s.timeLeftText}>·  {item.time}</Text>
                  </View>
                </View>
                <View style={s.pointsBadge}>
                  <Text style={s.pointsText}>+{item.points}</Text>
                </View>
              </View>

              <View style={s.cardBottomRow}>
                {item.joined ? (
                  <View style={s.progressContainer}>
                    <ProgressBar progress={item.progress} />
                    <View style={s.progressLabels}>
                      <Text style={s.progressText}>{item.progress}% complete</Text>
                      <Text style={s.activeText}>Active ✓</Text>
                    </View>
                  </View>
                ) : (
                  <Pressable style={s.joinBtn}>
                    <Text style={s.joinBtnText}>Join Challenge</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* ── Leaderboard Section (Old Design Restored) ── */}
        <View style={s.leaderboardHeader}>
          <Text style={s.leaderboardTitle}>Leaderboard</Text>
          <Pressable>
            <Text style={s.companyLink}>Company →</Text>
          </Pressable>
        </View>

        <View style={s.lbTabRow}>
          {(['individual', 'department', 'company'] as LeaderboardTab[]).map((tab) => {
            const isActive = activeLeaderboardTab === tab
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveLeaderboardTab(tab)}
                style={[s.lbTabPill, isActive && s.lbTabPillActive]}
              >
                <Text style={[s.lbTabText, isActive && s.lbTabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Leaderboard Rows */}
        <View style={s.leaderboardList}>
          {MOCK_LEADERBOARD.map((user) => (
            <View key={user.id} style={[s.leaderRow, user.rank <= 3 && s.leaderRowTop]}>
              <View style={s.position}>
                <PositionMedal position={user.rank} />
              </View>

              <View style={s.avatarCircle}>
                <Text style={s.avatarInitial}>{user.name.charAt(0)}</Text>
              </View>

              <View style={s.leaderMeta}>
                <View style={s.leaderNameRow}>
                  <Text style={s.leaderName} numberOfLines={1}>{user.name}</Text>
                  <RankChip rank={user.rankKey} />
                </View>
                <Text style={s.leaderDept}>{user.dept}</Text>
              </View>

              <View style={s.leaderRight}>
                <View style={s.streakValue}>
                  <Ionicons name="star" size={13} color={COLORS.orangeDark} />
                  <Text style={s.streakDays}>{user.points.toLocaleString()}</Text>
                </View>
                <Text style={s.metricLabel}>points</Text>
              </View>
            </View>
          ))}

          <Text style={s.lbDots}>...</Text>

          {/* Current User Row */}
          <View style={[s.leaderRow, s.leaderRowMe]}>
            <View style={s.position}>
              <Text style={[medal.number, { color: COLORS.teal }]}>#{MOCK_ME.rank}</Text>
            </View>

            <View style={s.avatarCircleMe}>
              <Text style={s.avatarInitialMe}>{MOCK_ME.name.charAt(0)}</Text>
            </View>

            <View style={s.leaderMeta}>
              <View style={s.leaderNameRow}>
                <Text style={s.leaderName} numberOfLines={1}>{MOCK_ME.name}</Text>
                <RankChip rank={MOCK_ME.rankKey} />
              </View>
              <Text style={s.leaderDept}>{MOCK_ME.dept}</Text>
            </View>

            <View style={s.leaderRight}>
              <View style={s.streakValue}>
                <Ionicons name="star" size={13} color={COLORS.orangeDark} />
                <Text style={s.streakDays}>{MOCK_ME.points.toLocaleString()}</Text>
              </View>
              <Text style={s.metricLabel}>points</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.navy },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  headerBg: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.white, marginBottom: 16 },
  tabRow: { flexDirection: 'row', gap: 10 },
  tabPill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  tabPillActive: { backgroundColor: COLORS.white },
  tabText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: COLORS.navy, fontWeight: '800' },

  // Body
  scrollBody: { backgroundColor: COLORS.white },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

  // Challenge Cards
  challengesList: { gap: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.lightTeal,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  cardIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardIconText: { fontSize: 22 },
  cardTextContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.navy, marginBottom: 2 },
  cardSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center' },
  categoryTag: { backgroundColor: COLORS.lightTeal, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText: { color: COLORS.teal, fontSize: 10, fontWeight: '700' },
  timeLeftText: { fontSize: 11, color: COLORS.disabledText, marginLeft: 6 },
  pointsBadge: { backgroundColor: '#FFF8E1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginLeft: 10 },
  pointsText: { color: COLORS.orangeDark, fontWeight: '800', fontSize: 12 },

  // Card Bottom
  cardBottomRow: { marginTop: 4 },
  progressContainer: { width: '100%' },
  progressTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  activeText: { fontSize: 11, color: COLORS.teal, fontWeight: '700' },
  joinBtn: { backgroundColor: COLORS.teal, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  joinBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },

  // Leaderboard Header & Tabs
  leaderboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 32, marginBottom: 16 },
  leaderboardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.navy },
  companyLink: { fontSize: 13, fontWeight: '700', color: COLORS.teal },
  lbTabRow: { flexDirection: 'row', gap: 8, marginBottom: 8 }, // reduced margin to pull cards up
  lbTabPill: { backgroundColor: COLORS.bgGray, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  lbTabPillActive: { backgroundColor: COLORS.teal },
  lbTabText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 12 },
  lbTabTextActive: { color: COLORS.white, fontWeight: '800' },

  // Leaderboard List (Old Design Restored)
  leaderboardList: {
    paddingBottom: 10,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8, // spaces out the individual cards
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  leaderRowTop: {
    borderColor: COLORS.border,
    ...Platform.select({
      ios: { shadowOpacity: 0.07, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  leaderRowMe: {
    borderColor: COLORS.teal,
    backgroundColor: COLORS.lightTeal,
  },

  position: { width: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bgGray, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarInitial: { fontSize: 13, fontWeight: '700', color: COLORS.navy },
  
  avatarCircleMe: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarInitialMe: { fontSize: 13, fontWeight: '700', color: COLORS.white },

  leaderMeta: { flex: 1, minWidth: 0, gap: 3 },
  leaderNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  leaderName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, flexShrink: 1 },
  leaderDept: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 14 },

  leaderRight: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  streakValue: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  streakDays: { fontSize: 14, fontWeight: '900', color: COLORS.textPrimary },
  metricLabel: { fontSize: 10, fontWeight: '600', color: COLORS.disabledText },

  lbDots: { textAlign: 'center', color: COLORS.disabledText, fontSize: 16, fontWeight: '800', letterSpacing: 2, marginTop: 12, marginBottom: 4 },
})