/**
 * HabitLauncher — React Native port of SEEGLA-WEB/components/vitality/HabitLauncher.tsx
 *
 * Key mobile differences vs. web:
 *  - Horizontal ScrollView (replaces overflow-x-auto)
 *  - expo-haptics on successful log (ImpactFeedbackStyle.Medium)
 *  - expo-haptics Light for "already logged today"
 *  - No server action — Supabase called directly from client
 *  - Streak flame badge uses absolute positioning (same as web)
 */

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Habit metric → health_metrics column mapping (mirrors web actions.ts)
// ─────────────────────────────────────────────────────────────────────────────

const HABIT_METRIC_MAP: Record<string, { col: string; increment: number } | null> = {
  water:      { col: 'water_intake_ml',  increment: 250 },
  steps:      { col: 'steps',            increment: 1000 },
  exercise:   { col: 'exercise_minutes', increment: 10  },
  sleep:      { col: 'sleep_hours',      increment: 1   },
  nutrition:  null,
  meditation: { col: 'exercise_minutes', increment: 5   },
}

// ─────────────────────────────────────────────────────────────────────────────
// Habit definitions
// ─────────────────────────────────────────────────────────────────────────────

interface HabitDef {
  type:          string
  label:         string
  sub:           string
  icon:          keyof typeof Ionicons.glyphMap
  idleBorderColor: string
  idleBgColor:     string
  idleTextColor:   string
  activeBgColor:   string
  activeBorderColor: string
}

const HABITS: HabitDef[] = [
  {
    type: 'water',     label: 'Water',    sub: '+250 ml',    icon: 'water-outline',
    idleBorderColor: '#a5f3fc', idleBgColor: '#ecfeff', idleTextColor: '#0e7490',
    activeBgColor: '#06b6d4',   activeBorderColor: '#06b6d4',
  },
  {
    type: 'steps',     label: 'Walk',     sub: '+1,000 steps', icon: 'footsteps-outline',
    idleBorderColor: '#bfdbfe', idleBgColor: '#eff6ff', idleTextColor: '#1d4ed8',
    activeBgColor: '#3b82f6',   activeBorderColor: '#3b82f6',
  },
  {
    type: 'exercise',  label: 'Workout',  sub: '+10 min',    icon: 'pulse-outline',
    idleBorderColor: '#a7f3d0', idleBgColor: '#ecfdf5', idleTextColor: '#047857',
    activeBgColor: '#10b981',   activeBorderColor: '#10b981',
  },
  {
    type: 'sleep',     label: 'Sleep',    sub: '+1 hr',      icon: 'moon-outline',
    idleBorderColor: '#ddd6fe', idleBgColor: '#f5f3ff', idleTextColor: '#6d28d9',
    activeBgColor: '#8b5cf6',   activeBorderColor: '#8b5cf6',
  },
  {
    type: 'nutrition', label: 'Nutrition',sub: 'log meal',   icon: 'leaf-outline',
    idleBorderColor: '#d9f99d', idleBgColor: '#f7fee7', idleTextColor: '#4d7c0f',
    activeBgColor: '#84cc16',   activeBorderColor: '#84cc16',
  },
  {
    type: 'meditation',label: 'Mindful', sub: '+5 min',     icon: 'analytics-outline',
    idleBorderColor: '#fed7aa', idleBgColor: '#fff7ed', idleTextColor: '#c2410c',
    activeBgColor: '#f97316',   activeBorderColor: '#f97316',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StreakRow {
  current_streak:   number
  last_logged_date: string | null
}

interface HabitLauncherProps {
  userId: string
  orgId:  string
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function HabitLauncher({ userId, orgId }: HabitLauncherProps) {
  const today = new Date().toISOString().split('T')[0]

  const [streaks,       setStreaks]       = useState<Record<string, StreakRow>>({})
  const [pendingHabit,  setPendingHabit]  = useState<string | null>(null)

  // Load streaks on mount
  useEffect(() => {
    supabase
      .from('habit_streaks')
      .select('metric_type, current_streak, last_logged_date')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, StreakRow> = {}
        data.forEach((row: { metric_type: string; current_streak: number; last_logged_date: string | null }) => {
          map[row.metric_type] = row
        })
        setStreaks(map)
      })
  }, [userId])

  const handleLog = async (habit: HabitDef) => {
    if (pendingHabit) return
    setPendingHabit(habit.type)

    try {
      // Fetch current streak row
      const { data: streak } = await supabase
        .from('habit_streaks')
        .select('id, current_streak, longest_streak, last_logged_date')
        .eq('user_id', userId)
        .eq('metric_type', habit.type)
        .maybeSingle()

      // Idempotent guard — already logged today
      if (streak?.last_logged_date === today) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        // Optionally show an alert here
        setPendingHabit(null)
        return
      }

      // Upsert health_metrics for types that have a column mapping
      const metricConfig = HABIT_METRIC_MAP[habit.type]
      if (metricConfig) {
        const { data: existingMetric } = await supabase
          .from('health_metrics')
          .select(metricConfig.col)
          .eq('user_id', userId)
          .eq('metric_date', today)
          .maybeSingle()

        const currentVal =
          (existingMetric as Record<string, number> | null)?.[metricConfig.col] ?? 0

        await supabase.from('health_metrics').upsert(
          {
            user_id:       userId,
            org_id:        orgId,
            metric_date:   today,
            [metricConfig.col]: currentVal + metricConfig.increment,
          },
          { onConflict: 'user_id,metric_date' }
        )
      }

      // Calculate new streak
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      let newStreak  = 1
      let newLongest = 1

      if (!streak) {
        await supabase.from('habit_streaks').insert({
          user_id:          userId,
          org_id:           orgId,
          metric_type:      habit.type,
          current_streak:   1,
          longest_streak:   1,
          last_logged_date: today,
        })
      } else {
        const isConsecutive = streak.last_logged_date === yesterdayStr
        newStreak  = isConsecutive ? streak.current_streak + 1 : 1
        newLongest = Math.max(newStreak, streak.longest_streak)

        await supabase
          .from('habit_streaks')
          .update({
            current_streak:   newStreak,
            longest_streak:   newLongest,
            last_logged_date: today,
          })
          .eq('id', streak.id)
      }

      // Optimistic UI update
      setStreaks((prev) => ({
        ...prev,
        [habit.type]: {
          current_streak:   newStreak,
          last_logged_date: today,
        },
      }))

      // Haptic success feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    } catch (err) {
      console.error('[HabitLauncher] log error:', err)
    } finally {
      setPendingHabit(null)
    }
  }

  return (
    <View style={styles.container}>
      {/* Label row */}
      <View style={styles.labelRow}>
        <Text style={styles.labelLeft}>TODAY'S HABITS</Text>
        <Text style={styles.labelRight}>Tap to log</Text>
      </View>

      {/* Scrollable habit strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {HABITS.map((habit) => {
          const row         = streaks[habit.type]
          const loggedToday = row?.last_logged_date === today
          const streak      = row?.current_streak ?? 0
          const isLoading   = pendingHabit === habit.type

          return (
            <Pressable
              key={habit.type}
              onPress={() => handleLog(habit)}
              disabled={!!pendingHabit}
              style={({ pressed }) => [
                styles.habitBtn,
                loggedToday
                  ? {
                      backgroundColor: habit.activeBgColor,
                      borderColor:     habit.activeBorderColor,
                    }
                  : {
                      backgroundColor: habit.idleBgColor,
                      borderColor:     habit.idleBorderColor,
                    },
                pressed && { transform: [{ scale: 0.95 }] },
                pendingHabit && !isLoading && { opacity: 0.6 },
              ]}
            >
              {/* Streak flame badge */}
              {streak > 0 && (
                <View style={[
                  styles.streakBadge,
                  loggedToday
                    ? { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.4)' }
                    : { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
                ]}>
                  <Ionicons name="flame" size={9} color={loggedToday ? '#fff' : '#c2410c'} />
                  <Text style={[
                    styles.streakText,
                    { color: loggedToday ? '#fff' : '#c2410c' },
                  ]}>
                    {streak}
                  </Text>
                </View>
              )}

              {/* Icon */}
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={loggedToday ? '#fff' : habit.idleTextColor}
                />
              ) : loggedToday ? (
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              ) : (
                <Ionicons name={habit.icon} size={20} color={habit.idleTextColor} />
              )}

              {/* Label */}
              <Text style={[
                styles.habitLabel,
                { color: loggedToday ? '#fff' : habit.idleTextColor },
              ]}>
                {habit.label}
              </Text>

              {/* Sub-label */}
              <Text style={[
                styles.habitSub,
                { color: loggedToday ? 'rgba(255,255,255,0.8)' : habit.idleTextColor, opacity: loggedToday ? 1 : 0.6 },
              ]}>
                {habit.sub}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  labelRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   10,
  },
  labelLeft: {
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing: 1.2,
    color:         '#94a3b8',
    textTransform: 'uppercase',
  },
  labelRight: {
    fontSize:   10,
    color:      '#94a3b8',
  },
  strip: {
    gap:             10,
    paddingBottom:   2,
    paddingRight:    4,
  },
  habitBtn: {
    width:           80,
    alignItems:      'center',
    gap:             5,
    borderRadius:    12,
    borderWidth:     2,
    paddingHorizontal: 10,
    paddingVertical:   10,
    position:        'relative',
  },
  streakBadge: {
    position:         'absolute',
    top:              -8,
    right:            -8,
    flexDirection:    'row',
    alignItems:       'center',
    gap:              2,
    borderRadius:     99,
    borderWidth:      1,
    paddingHorizontal: 5,
    paddingVertical:   2,
    zIndex:            1,
  },
  streakText: {
    fontSize:   9,
    fontWeight: '800',
    lineHeight: 11,
  },
  habitLabel: {
    fontSize:   11,
    fontWeight: '700',
    lineHeight: 13,
  },
  habitSub: {
    fontSize:   9,
    lineHeight: 11,
  },
})
