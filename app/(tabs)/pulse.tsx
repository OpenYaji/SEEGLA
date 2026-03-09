/**
 * Team Pulse — mobile screen
 *
 * Ports SEEGLA-WEB/components/vitality/TeamPulse.tsx +
 *       SEEGLA-WEB/app/(dashboard)/employee/dashboard/leaderboard/page.tsx
 *
 * Combines both web views into one screen:
 *  Section 1 — Top Habit Streaks leaderboard (from TeamPulse)
 *  Section 2 — Steps Leaderboard: last 30 days (from LeaderboardPage)
 *
 * Profile Rating Tags (Beginner / Veteran / Pro) are rendered on every row.
 */

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

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
    borderColor: '#e2e8f0', bgColor: '#f1f5f9', textColor: '#334155',
  },
  veteran: {
    label: 'Veteran',  icon: 'flash-outline',
    borderColor: '#bfdbfe', bgColor: '#dbeafe', textColor: '#1d4ed8',
  },
  pro: {
    label: 'Pro',      icon: 'trophy-outline',
    borderColor: '#fde68a', bgColor: '#fef3c7', textColor: '#b45309',
  },
}

const METRIC: Record<string, {
  label:     string
  icon:      keyof typeof Ionicons.glyphMap
  textColor: string
}> = {
  water:      { label: 'Hydration', icon: 'water-outline',      textColor: '#0891b2' },
  steps:      { label: 'Steps',     icon: 'footsteps-outline',   textColor: '#2563eb' },
  exercise:   { label: 'Exercise',  icon: 'pulse-outline',       textColor: '#059669' },
  sleep:      { label: 'Sleep',     icon: 'moon-outline',        textColor: '#7c3aed' },
  nutrition:  { label: 'Nutrition', icon: 'leaf-outline',        textColor: '#4d7c0f' },
  meditation: { label: 'Mindful',   icon: 'analytics-outline',   textColor: '#c2410c' },
}

const POSITION_COLORS = ['#d97706', '#64748b', '#c2410c', '#94a3b8'] // gold, silver, bronze, rest

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StreakEntry {
  id:             string
  metric_type:    string
  current_streak: number
  longest_streak: number
  users: {
    full_name:     string | null
    department:    string | null
    wellness_rank: string | null
  } | null
}

interface StepsEntry {
  user_id:                string
  full_name:              string
  total_steps:            number
  total_exercise_minutes: number
  avg_sleep_hours:        number
  days_logged:            number
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={statStyles.sub}>{sub}</Text>
    </View>
  )
}

const statStyles = StyleSheet.create({
  card: {
    flex:            1,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  value: {
    fontSize:   18,
    fontWeight: '800',
    color:      '#0f172a',
    lineHeight: 22,
  },
  label: {
    fontSize:   11,
    fontWeight: '600',
    color:      '#334155',
    marginTop:  3,
    lineHeight: 14,
  },
  sub: {
    fontSize:  10,
    color:     '#94a3b8',
    marginTop: 1,
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Rank chip (reused by both leaderboards)
// ─────────────────────────────────────────────────────────────────────────────

function RankChip({ rank }: { rank: string }) {
  const cfg = RANK[(rank as RankKey)] ?? RANK.beginner
  return (
    <View style={[chipStyles.chip, { borderColor: cfg.borderColor, backgroundColor: cfg.bgColor }]}>
      <Ionicons name={cfg.icon} size={8} color={cfg.textColor} />
      <Text style={[chipStyles.text, { color: cfg.textColor }]}>{cfg.label}</Text>
    </View>
  )
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              3,
    borderRadius:     99,
    borderWidth:      1,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  text: {
    fontSize:   9,
    fontWeight: '700',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Position medal
// ─────────────────────────────────────────────────────────────────────────────

function PositionMedal({ position }: { position: number }) {
  if (position === 1) return <Ionicons name="trophy"     size={18} color="#d97706" />
  if (position === 2) return <Ionicons name="medal"      size={18} color="#64748b" />
  if (position === 3) return <Ionicons name="medal"      size={18} color="#c2410c" />
  return (
    <Text style={[medalStyles.number, { color: POSITION_COLORS[3] }]}>
      {position}
    </Text>
  )
}

const medalStyles = StyleSheet.create({
  number: {
    fontSize:  14,
    fontWeight:'700',
    width:     20,
    textAlign: 'center',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, sub }: {
  icon:  keyof typeof Ionicons.glyphMap
  title: string
  sub:   string
}) {
  return (
    <View style={secStyles.row}>
      <Ionicons name={icon} size={18} color="#0a7ea4" />
      <View>
        <Text style={secStyles.title}>{title}</Text>
        <Text style={secStyles.sub}>{sub}</Text>
      </View>
    </View>
  )
}

const secStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  12,
  },
  title: {
    fontSize:   15,
    fontWeight: '700',
    color:      '#0f172a',
    lineHeight: 18,
  },
  sub: {
    fontSize:  11,
    color:     '#94a3b8',
    marginTop: 1,
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Pulse screen
// ─────────────────────────────────────────────────────────────────────────────

export default function PulseScreen() {
  const { user, isLoading: authLoading } = useAuth()

  const [streakEntries, setStreakEntries] = useState<StreakEntry[]>([])
  const [stepsLeaders,  setStepsLeaders]  = useState<StepsEntry[]>([])
  const [isLoading,     setIsLoading]     = useState(true)
  const [isRefreshing,  setIsRefreshing]  = useState(false)

  const loadData = async (refresh = false) => {
    if (!user?.org_id) return
    if (refresh) setIsRefreshing(true)
    else         setIsLoading(true)

    try {
      // ── Habit streak leaderboard ──────────────────────────────────────────
      const { data: streaks } = await supabase
        .from('habit_streaks')
        .select('id, metric_type, current_streak, longest_streak, users(full_name, department, wellness_rank)')
        .eq('org_id', user.org_id)
        .gt('current_streak', 0)
        .order('current_streak', { ascending: false })
        .limit(10)

      setStreakEntries((streaks as StreakEntry[] | null) ?? [])

      // ── Steps leaderboard (last 30 days) ──────────────────────────────────
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const fromDate = thirtyDaysAgo.toISOString().split('T')[0]

      const { data: metrics } = await supabase
        .from('health_metrics')
        .select('user_id, steps, exercise_minutes, sleep_hours')
        .eq('org_id', user.org_id)
        .gte('metric_date', fromDate)

      if (metrics && metrics.length > 0) {
        const userMap = new Map<string, {
          steps: number; exercise: number; sleep: number[]; days: number
        }>()

        metrics.forEach((m: {
          user_id: string; steps: number; exercise_minutes: number; sleep_hours: number
        }) => {
          const e = userMap.get(m.user_id) ?? { steps: 0, exercise: 0, sleep: [], days: 0 }
          e.steps    += m.steps            ?? 0
          e.exercise += m.exercise_minutes ?? 0
          if (m.sleep_hours) e.sleep.push(m.sleep_hours)
          e.days += 1
          userMap.set(m.user_id, e)
        })

        const userIds = Array.from(userMap.keys())
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', userIds)

        const nameMap = new Map(
          (users ?? []).map((u: { id: string; full_name: string }) => [u.id, u.full_name])
        )

        const entries: StepsEntry[] = Array.from(userMap.entries()).map(([uid, d]) => ({
          user_id:                uid,
          full_name:              (nameMap.get(uid) as string) ?? 'Anonymous',
          total_steps:            d.steps,
          total_exercise_minutes: d.exercise,
          avg_sleep_hours:        d.sleep.length
            ? parseFloat((d.sleep.reduce((a, b) => a + b, 0) / d.sleep.length).toFixed(1))
            : 0,
          days_logged: d.days,
        }))

        entries.sort((a, b) => b.total_steps - a.total_steps)
        setStepsLeaders(entries.slice(0, 20))
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!authLoading) loadData()
  }, [authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <SafeAreaView style={styles.centerFill}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </SafeAreaView>
    )
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.centerFill}>
        <Ionicons name="lock-closed-outline" size={40} color="#94a3b8" />
        <Text style={styles.authGateText}>Please sign in to view Team Pulse.</Text>
      </SafeAreaView>
    )
  }

  // ── Computed summary stats ────────────────────────────────────────────────
  const totalDays    = streakEntries.reduce((s, e) => s + e.current_streak, 0)
  const uniqueHabits = new Set(streakEntries.map((e) => e.metric_type)).size
  const longestAny   = streakEntries.reduce((m, e) => Math.max(m, e.longest_streak), 0)

  const myRank    = stepsLeaders.findIndex((l) => l.user_id === user.id) + 1
  const myEntry   = stepsLeaders.find((l) => l.user_id === user.id)

  // ── Render ────────────────────────────────────────────────────────────────

  // Build a single data array for FlatList using type-tagged items so we can
  // render headers, stat cards, streak rows, and steps rows all in one list.
  type ListItem =
    | { _type: 'streakHeader' }
    | { _type: 'statCards' }
    | { _type: 'streak';      entry: StreakEntry; position: number }
    | { _type: 'streakEmpty' }
    | { _type: 'stepsHeader' }
    | { _type: 'myStepsCard' }
    | { _type: 'steps';       entry: StepsEntry;  position: number }
    | { _type: 'stepsEmpty' }
    | { _type: 'footer' }

  const listData: ListItem[] = [
    { _type: 'streakHeader' },
    ...(streakEntries.length > 0 ? [{ _type: 'statCards' } as ListItem] : []),
    ...(streakEntries.length > 0
      ? streakEntries.map((entry, i) => ({ _type: 'streak', entry, position: i + 1 } as ListItem))
      : [{ _type: 'streakEmpty' } as ListItem]),
    { _type: 'stepsHeader' },
    ...(myEntry ? [{ _type: 'myStepsCard' } as ListItem] : []),
    ...(stepsLeaders.length > 0
      ? stepsLeaders.map((entry, i) => ({ _type: 'steps', entry, position: i + 1 } as ListItem))
      : [{ _type: 'stepsEmpty' } as ListItem]),
    { _type: 'footer' },
  ]

  const renderItem = ({ item }: { item: ListItem }) => {
    switch (item._type) {
      case 'streakHeader':
        return (
          <View style={styles.sectionBlock}>
            <SectionHeader
              icon="trending-up-outline"
              title="Top Habit Streaks"
              sub="Active streak leaders in your organisation"
            />
          </View>
        )

      case 'statCards':
        return (
          <View style={styles.statsRow}>
            <StatCard label="Combined streak days" value={totalDays}         sub="across all habits"  />
            <StatCard label="Active habit types"   value={uniqueHabits}      sub="tracked by team"    />
            <StatCard label="Longest record"        value={`${longestAny}d`} sub="best streak ever"   />
          </View>
        )

      case 'streak': {
        const { entry, position } = item
        const metric   = METRIC[entry.metric_type] ?? { label: entry.metric_type, icon: 'pulse-outline' as keyof typeof Ionicons.glyphMap, textColor: '#94a3b8' }
        const rankKey  = (entry.users?.wellness_rank ?? 'beginner') as RankKey
        return (
          <View style={[styles.leaderRow, position <= 3 && styles.leaderRowTop]}>
            <View style={styles.position}>
              <PositionMedal position={position} />
            </View>

            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {(entry.users?.full_name ?? '?')[0].toUpperCase()}
              </Text>
            </View>

            <View style={styles.leaderMeta}>
              <View style={styles.leaderNameRow}>
                <Text style={styles.leaderName} numberOfLines={1}>
                  {entry.users?.full_name ?? 'Team Member'}
                </Text>
                <RankChip rank={rankKey} />
              </View>
              {entry.users?.department ? (
                <Text style={styles.leaderDept} numberOfLines={1}>
                  {entry.users.department}
                </Text>
              ) : null}
            </View>

            <View style={styles.leaderRight}>
              <View style={styles.metricTag}>
                <Ionicons name={metric.icon} size={10} color={metric.textColor} />
                <Text style={[styles.metricLabel, { color: metric.textColor }]}>
                  {metric.label}
                </Text>
              </View>
              <View style={styles.streakValue}>
                <Ionicons name="flame" size={13} color="#f97316" />
                <Text style={styles.streakDays}>{entry.current_streak}d</Text>
              </View>
            </View>
          </View>
        )
      }

      case 'streakEmpty':
        return (
          <View style={styles.emptyBlock}>
            <Ionicons name="people-outline" size={20} color="#94a3b8" />
            <Text style={styles.emptyText}>No active streaks yet</Text>
            <Text style={styles.emptySubText}>
              Log a habit today to appear on the leaderboard.
            </Text>
          </View>
        )

      case 'stepsHeader':
        return (
          <View style={[styles.sectionBlock, { marginTop: 24 }]}>
            <SectionHeader
              icon="footsteps-outline"
              title="Top Performers by Steps"
              sub="Ranked by total steps — last 30 days"
            />
          </View>
        )

      case 'myStepsCard':
        if (!myEntry) return null
        return (
          <View style={styles.myCard}>
            <View style={styles.myCardLeft}>
              <PositionMedal position={myRank} />
              <View style={styles.myAvatar}>
                <Text style={styles.myAvatarText}>
                  {myEntry.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
              <View>
                <Text style={styles.myName}>{myEntry.full_name} (You)</Text>
                <Text style={styles.myMeta}>
                  Rank #{myRank} · {myEntry.days_logged} days logged
                </Text>
              </View>
            </View>
            <View style={styles.myRight}>
              <Text style={styles.mySteps}>{myEntry.total_steps.toLocaleString()}</Text>
              <Text style={styles.myStepsSub}>total steps</Text>
            </View>
          </View>
        )

      case 'steps': {
        const { entry: se, position: sp } = item
        const isMe = se.user_id === user.id
        return (
          <View style={[styles.leaderRow, isMe && styles.leaderRowMe]}>
            <View style={styles.position}>
              <PositionMedal position={sp} />
            </View>

            <View style={[styles.avatarCircle, isMe && styles.avatarCircleMe]}>
              <Text style={[styles.avatarInitial, isMe && { color: '#fff' }]}>
                {se.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>

            <View style={styles.leaderMeta}>
              <Text style={styles.leaderName} numberOfLines={1}>
                {se.full_name}{isMe ? ' (You)' : ''}
              </Text>
              <Text style={styles.leaderDept} numberOfLines={1}>
                {se.total_exercise_minutes} min exercise · {se.avg_sleep_hours}h sleep · {se.days_logged} days
              </Text>
            </View>

            <View style={styles.leaderRight}>
              <Text style={styles.streakDays}>{se.total_steps.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>steps</Text>
            </View>
          </View>
        )
      }

      case 'stepsEmpty':
        return (
          <View style={styles.emptyBlock}>
            <Ionicons name="footsteps-outline" size={20} color="#94a3b8" />
            <Text style={styles.emptyText}>No activity data yet</Text>
            <Text style={styles.emptySubText}>
              Start logging your metrics to appear here.
            </Text>
          </View>
        )

      case 'footer':
        if (streakEntries.length === 0) return null
        return (
          <View style={styles.footerCard}>
            <Text style={styles.footerTitle}>
              {totalDays} combined streak days across the team.
            </Text>
            <Text style={styles.footerSub}>
              Log daily to climb the leaderboard and build your authority rank.
            </Text>
          </View>
        )

      default:
        return null
    }
  }

  // Demo podium for top 3 (replaces with real data if available)
  const podium = stepsLeaders.length >= 3
    ? [stepsLeaders[1], stepsLeaders[0], stepsLeaders[2]]  // 2nd, 1st, 3rd
    : [
        { full_name: 'Ana Reyes',          total_steps: 1720, user_id: 'a' },
        { full_name: 'Maria Santos',       total_steps: 1840, user_id: 'b' },
        { full_name: 'Carlo Dela Cruz',    total_steps: 1580, user_id: 'c' },
      ]

  return (
    <SafeAreaView style={styles.root}>
      <FlatList<ListItem>
        data={listData}
        keyExtractor={(item, index) => `${item._type}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            tintColor="#3FE870"
          />
        }
        ListHeaderComponent={(
          <View style={styles.pulseHeader}>
            {/* Title + rank */}
            <View style={styles.pulseTitleRow}>
              <View>
                <Text style={styles.pulseTitle}>Team Pulse ⚡</Text>
                <Text style={styles.pulseSub}>March 2026 Leaderboard · BDO Unibank</Text>
              </View>
              <View style={styles.myRankBadge}>
                <Text style={styles.myRankText}>Rank #{myRank || 4}</Text>
              </View>
            </View>

            {/* Podium */}
            <View style={styles.podium}>
              {/* 2nd place */}
              <View style={styles.podiumPerson}>
                <View style={[styles.podiumAvatar, { borderColor: '#94a3b8' }]}>
                  <Text style={styles.podiumAvatarText}>{podium[0].full_name?.charAt(0)}</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {podium[0].full_name?.split(' ')[0]}
                </Text>
                <View style={[styles.podiumBox, { backgroundColor: '#94a3b833', height: 60 }]}>
                  <Text style={styles.podiumPts}>{podium[0].total_steps?.toLocaleString()}</Text>
                  <Text style={styles.podiumMedal}>🥈</Text>
                </View>
              </View>

              {/* 1st place */}
              <View style={[styles.podiumPerson, { marginBottom: 0 }]}>
                <View style={[styles.podiumAvatar, styles.podiumAvatarFirst, { borderColor: '#f59e0b' }]}>
                  <Text style={styles.podiumAvatarText}>{podium[1].full_name?.charAt(0)}</Text>
                </View>
                <Text style={[styles.podiumName, { fontWeight: '900' }]} numberOfLines={1}>
                  {podium[1].full_name?.split(' ')[0]}
                </Text>
                <View style={[styles.podiumBox, { backgroundColor: '#f59e0b33', height: 80 }]}>
                  <Text style={[styles.podiumPts, { color: '#f59e0b' }]}>{podium[1].total_steps?.toLocaleString()}</Text>
                  <Text style={styles.podiumMedal}>🥇</Text>
                </View>
              </View>

              {/* 3rd place */}
              <View style={styles.podiumPerson}>
                <View style={[styles.podiumAvatar, { borderColor: '#c2410c' }]}>
                  <Text style={styles.podiumAvatarText}>{podium[2].full_name?.charAt(0)}</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {podium[2].full_name?.split(' ')[0]}
                </Text>
                <View style={[styles.podiumBox, { backgroundColor: '#c2410c33', height: 44 }]}>
                  <Text style={styles.podiumPts}>{podium[2].total_steps?.toLocaleString()}</Text>
                  <Text style={styles.podiumMedal}>🥉</Text>
                </View>
              </View>
            </View>

            {/* Stat strip */}
            <View style={styles.pulseStatStrip}>
              <View style={styles.pulseStatItem}>
                <Text style={styles.pulseStatEmoji}>📊</Text>
                <View>
                  <Text style={styles.pulseStatValue}>1,280</Text>
                  <Text style={styles.pulseStatLabel}>Company Avg Score</Text>
                </View>
              </View>
              <View style={styles.pulseStatDivider} />
              <View style={styles.pulseStatItem}>
                <Text style={styles.pulseStatEmoji}>👟</Text>
                <View>
                  <Text style={styles.pulseStatValue}>2.4M</Text>
                  <Text style={styles.pulseStatLabel}>Total Steps This Week</Text>
                </View>
              </View>
            </View>

            <Text style={styles.rankingsLabel}>FULL RANKINGS · THIS MONTH</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#f8fafc',
  },
  centerFill: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            12,
  },

  // Pulse header
  pulseHeader: {
    backgroundColor:   '#260A2F',
    paddingHorizontal: 18,
    paddingTop:        Platform.OS === 'ios' ? 16 : 20,
    paddingBottom:     20,
    gap:               16,
  },
  pulseTitleRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
  },
  pulseTitle: { fontSize: 22, fontWeight: '900', color: '#ffffff' },
  pulseSub:   { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 },
  myRankBadge: {
    backgroundColor:   'rgba(255,107,0,0.25)',
    borderRadius:      99,
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderWidth:       1,
    borderColor:       '#FF6B0055',
  },
  myRankText: { fontSize: 12, fontWeight: '800', color: '#FF6B00' },

  // Podium
  podium: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    justifyContent: 'center',
    gap:            12,
  },
  podiumPerson: {
    alignItems:  'center',
    gap:         4,
    width:       90,
    marginBottom: 0,
  },
  podiumAvatar: {
    width:           52,
    height:          52,
    borderRadius:    26,
    borderWidth:     2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  podiumAvatarFirst: {
    width:  60,
    height: 60,
    borderRadius: 30,
  },
  podiumAvatarText: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  podiumName: {
    fontSize:   11,
    fontWeight: '700',
    color:      'rgba(255,255,255,0.7)',
    textAlign:  'center',
  },
  podiumBox: {
    width:          '100%',
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'flex-end',
    paddingBottom:  8,
    gap:            2,
  },
  podiumPts:   { fontSize: 13, fontWeight: '900', color: '#ffffff' },
  podiumMedal: { fontSize: 18 },

  // Stat strip
  pulseStatStrip: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(255,255,255,0.08)',
    borderRadius:      14,
    padding:           14,
  },
  pulseStatItem: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  pulseStatEmoji: { fontSize: 22 },
  pulseStatValue: { fontSize: 17, fontWeight: '900', color: '#ffffff' },
  pulseStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1 },
  pulseStatDivider: {
    width:           1,
    height:          32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 8,
  },

  rankingsLabel: {
    fontSize:      10,
    fontWeight:    '800',
    color:         'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  authGateText: {
    fontSize:  14,
    color:     '#94a3b8',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },

  sectionBlock: {
    paddingHorizontal: 16,
    paddingTop:        20,
    paddingBottom:     0,
  },

  statsRow: {
    flexDirection:    'row',
    gap:              10,
    paddingHorizontal: 16,
    paddingTop:       12,
    paddingBottom:    4,
  },

  // Leaderboard rows
  leaderRow: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              12,
    backgroundColor:  '#ffffff',
    borderWidth:      1,
    borderColor:      '#f1f5f9',
    borderRadius:     14,
    paddingHorizontal: 14,
    paddingVertical:  12,
    marginHorizontal: 16,
    marginTop:        8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  leaderRowTop: {
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowOpacity: 0.07, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  leaderRowMe: {
    borderColor:     '#bfdbfe',
    backgroundColor: '#eff6ff',
  },

  position: {
    width:          24,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },

  avatarCircle: {
    width:          36,
    height:         36,
    borderRadius:   18,
    backgroundColor: '#dbeafe',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  avatarCircleMe: {
    backgroundColor: '#0a7ea4',
  },
  avatarInitial: {
    fontSize:   13,
    fontWeight: '700',
    color:      '#0a7ea4',
  },

  leaderMeta: {
    flex:     1,
    minWidth: 0,
    gap:      3,
  },
  leaderNameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    flexWrap:      'wrap',
    gap:           6,
  },
  leaderName: {
    fontSize:   14,
    fontWeight: '600',
    color:      '#0f172a',
    flexShrink: 1,
  },
  leaderDept: {
    fontSize:  11,
    color:     '#94a3b8',
    lineHeight: 14,
  },

  leaderRight: {
    alignItems: 'flex-end',
    gap:        4,
    flexShrink: 0,
  },
  metricTag: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           3,
  },
  metricLabel: {
    fontSize:   10,
    fontWeight: '600',
    color:      '#94a3b8',
  },
  streakValue: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           3,
  },
  streakDays: {
    fontSize:   14,
    fontWeight: '900',
    color:      '#0f172a',
  },

  // My steps highlight card
  myCard: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    backgroundColor:  '#eff6ff',
    borderWidth:      1,
    borderColor:      '#bfdbfe',
    borderRadius:     14,
    paddingHorizontal: 14,
    paddingVertical:  12,
    marginHorizontal: 16,
    marginTop:        12,
  },
  myCardLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    flex:          1,
    minWidth:      0,
  },
  myAvatar: {
    width:          40,
    height:         40,
    borderRadius:   20,
    backgroundColor: '#0a7ea4',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  myAvatarText: {
    fontSize:   13,
    fontWeight: '700',
    color:      '#ffffff',
  },
  myName: {
    fontSize:   14,
    fontWeight: '700',
    color:      '#0f172a',
  },
  myMeta: {
    fontSize: 11,
    color:    '#64748b',
    marginTop: 1,
  },
  myRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  mySteps: {
    fontSize:   20,
    fontWeight: '900',
    color:      '#0f172a',
  },
  myStepsSub: {
    fontSize:  11,
    color:     '#64748b',
  },

  // Empty states
  emptyBlock: {
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     '#e2e8f0',
    borderStyle:     'dashed',
    backgroundColor: '#f8fafc',
    paddingVertical: 40,
    marginHorizontal: 16,
    marginTop:       8,
    gap:             6,
  },
  emptyText: {
    fontSize:   13,
    fontWeight: '600',
    color:      '#64748b',
  },
  emptySubText: {
    fontSize:  11,
    color:     '#94a3b8',
    textAlign: 'center',
    maxWidth:  220,
  },

  // Footer motivation card
  footerCard: {
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop:       16,
  },
  footerTitle: {
    fontSize:   14,
    fontWeight: '700',
    color:      '#0f172a',
  },
  footerSub: {
    fontSize:  12,
    color:     '#94a3b8',
    marginTop: 3,
  },
})
