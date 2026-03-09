/**
 * Rewards — Challenges & Rewards Store
 *
 * Layout:
 *   1. Dark green header — "Rewards 🎁" + points badge
 *   2. Progress to Platinum card
 *   3. Tab toggle: Challenges | Rewards Store
 *   4a. Challenges tab — list with progress bars, JOINED/Join badge
 *   4b. Rewards Store tab — 2-column grid with Redeem button
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Challenge {
  id:            string
  title:         string
  description:   string
  category:      string
  points_reward: number
  target_value:  number
  metric_type:   string
  // injected locally
  emoji?:        string
  current_value?: number
  days_left?:    number
  prize_label?:  string
  is_joined?:    boolean
}

interface Reward {
  id:          string
  title:       string
  description: string
  category:    string
  points_cost: number
  is_active:   boolean
  // injected locally
  emoji?:      string
}

interface PointsBalance {
  total_points:     number
  available_points: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo data (used when DB is empty)
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_CHALLENGES: Challenge[] = [
  {
    id:            'd1',
    title:         '10K Steps Streak',
    emoji:         '🏃',
    description:   'Walk 10,000 steps daily for 7 days',
    category:      'fitness',
    points_reward: 500,
    target_value:  7,
    current_value: 5,
    metric_type:   'steps',
    days_left:     2,
    prize_label:   '₱100 GCash',
    is_joined:     true,
  },
  {
    id:            'd2',
    title:         'Hydration Hero',
    emoji:         '💧',
    description:   'Log 8 glasses of water for 5 days',
    category:      'nutrition',
    points_reward: 300,
    target_value:  5,
    current_value: 3,
    metric_type:   'hydration',
    days_left:     4,
    prize_label:   'Grab Voucher',
    is_joined:     true,
  },
  {
    id:            'd3',
    title:         'Mindfulness March',
    emoji:         '🧘',
    description:   'Complete 10-min meditation 10x this month',
    category:      'mindful',
    points_reward: 750,
    target_value:  10,
    current_value: 4,
    metric_type:   'meditation',
    days_left:     21,
    prize_label:   'Wellness Kit',
    is_joined:     false,
  },
]

const DEMO_REWARDS: Reward[] = [
  { id: 'r1', title: 'GCash ₱100',    emoji: '💚', category: 'Cash',     points_cost: 500,  description: '', is_active: true },
  { id: 'r2', title: 'Grab ₱150',     emoji: '🚗', category: 'Voucher',  points_cost: 750,  description: '', is_active: true },
  { id: 'r3', title: 'Jollibee ₱200', emoji: '🍔', category: 'Food',     points_cost: 900,  description: '', is_active: true },
  { id: 'r4', title: 'SM Gift Card',  emoji: '🛍️', category: 'Shopping', points_cost: 1200, description: '', is_active: true },
]

const CATEGORY_EMOJI: Record<string, string> = {
  fitness:   '🏃',
  nutrition: '🥗',
  sleep:     '😴',
  mindful:   '🧘',
  social:    '👥',
  default:   '⭐',
}

// ─────────────────────────────────────────────────────────────────────────────
// Challenge card
// ─────────────────────────────────────────────────────────────────────────────

function ChallengeCard({
  challenge,
  onJoin,
}: {
  challenge: Challenge
  onJoin:    (id: string) => void
}) {
  const joined    = challenge.is_joined ?? false
  const progress  = Math.min((challenge.current_value ?? 0) / (challenge.target_value || 1), 1)
  const emoji     = challenge.emoji ?? CATEGORY_EMOJI[challenge.category] ?? CATEGORY_EMOJI.default

  return (
    <View style={[cc.card, joined && cc.cardJoined]}>
      {/* Top row */}
      <View style={cc.topRow}>
        <View style={cc.iconBox}>
          <Text style={cc.iconEmoji}>{emoji}</Text>
        </View>
        <View style={cc.meta}>
          <View style={cc.titleRow}>
            <Text style={cc.title} numberOfLines={1}>{challenge.title}</Text>
            {joined ? (
              <View style={cc.joinedBadge}>
                <Text style={cc.joinedText}>JOINED</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [cc.joinBtn, pressed && { opacity: 0.8 }]}
                onPress={() => onJoin(challenge.id)}
              >
                <Text style={cc.joinBtnText}>Join</Text>
              </Pressable>
            )}
          </View>
          <Text style={cc.desc} numberOfLines={2}>{challenge.description}</Text>
          {challenge.days_left !== undefined && (
            <Text style={cc.daysLeft}>{challenge.days_left} days left</Text>
          )}
        </View>
      </View>

      {/* Progress bar */}
      {joined && challenge.current_value !== undefined && (
        <View style={cc.progressSection}>
          <View style={cc.progressTrack}>
            <View style={[cc.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={cc.progressLabel}>
            {challenge.current_value}/{challenge.target_value} {challenge.metric_type === 'steps' ? 'days' : 'days'}
          </Text>
        </View>
      )}

      {/* Reward row */}
      <View style={cc.rewardRow}>
        <Text style={cc.rewardEmoji}>🎁</Text>
        <Text style={cc.rewardText}>
          {challenge.points_reward} pts{challenge.prize_label ? ` + ${challenge.prize_label}` : ''}
        </Text>
      </View>
    </View>
  )
}

const cc = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius:    14,
    borderWidth:     1.5,
    borderColor:     '#e2e8f0',
    padding:         14,
    marginBottom:    12,
    gap:             10,
  },
  cardJoined: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  topRow: {
    flexDirection: 'row',
    gap:           12,
    alignItems:    'flex-start',
  },
  iconBox: {
    width:          44,
    height:         44,
    borderRadius:   12,
    backgroundColor: '#f0fdf4',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  iconEmoji: { fontSize: 22 },
  meta: {
    flex: 1,
    gap:  4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    flexWrap:      'wrap',
  },
  title: {
    fontSize:   14,
    fontWeight: '800',
    color:      '#0f172a',
    flexShrink: 1,
  },
  joinedBadge: {
    backgroundColor:   '#1a3a1a',
    borderRadius:      99,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  joinedText: {
    fontSize:      9,
    fontWeight:    '800',
    color:         '#3FE870',
    letterSpacing: 0.5,
  },
  joinBtn: {
    borderRadius:      99,
    borderWidth:       1.5,
    borderColor:       '#3FE870',
    paddingHorizontal: 10,
    paddingVertical:   3,
  },
  joinBtnText: {
    fontSize:   11,
    fontWeight: '700',
    color:      '#16a34a',
  },
  desc: {
    fontSize:   12,
    color:      '#475569',
    lineHeight: 17,
  },
  daysLeft: {
    fontSize:   11,
    color:      '#94a3b8',
    fontWeight: '500',
  },
  progressSection: {
    gap: 5,
  },
  progressTrack: {
    height:          6,
    borderRadius:    3,
    backgroundColor: '#e2e8f0',
    overflow:        'hidden',
  },
  progressFill: {
    height:          6,
    borderRadius:    3,
    backgroundColor: '#FF6B00',
  },
  progressLabel: {
    fontSize:  11,
    color:     '#64748b',
    fontWeight:'600',
    textAlign: 'right',
  },
  rewardRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   '#fff7ed',
    borderRadius:      8,
    paddingHorizontal: 10,
    paddingVertical:   7,
  },
  rewardEmoji: { fontSize: 14 },
  rewardText: {
    fontSize:   12,
    fontWeight: '700',
    color:      '#c2410c',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Reward card (2-column grid)
// ─────────────────────────────────────────────────────────────────────────────

function RewardCard({
  reward,
  availablePoints,
  onRedeem,
  redeeming,
}: {
  reward:          Reward
  availablePoints: number
  onRedeem:        (id: string, cost: number, title: string) => void
  redeeming:       boolean
}) {
  const canAfford = availablePoints >= reward.points_cost
  const emoji     = reward.emoji ?? '🎁'

  return (
    <View style={[rc.card, canAfford && rc.cardAffordable]}>
      <View style={rc.topRow}>
        <Text style={rc.emoji}>{emoji}</Text>
        <View style={rc.catBadge}>
          <Text style={rc.catText}>{reward.category}</Text>
        </View>
      </View>
      <Text style={rc.title}>{reward.title}</Text>
      <Text style={rc.pts}>{reward.points_cost.toLocaleString()} pts</Text>
      <Pressable
        onPress={() => canAfford && onRedeem(reward.id, reward.points_cost, reward.title)}
        disabled={!canAfford || redeeming}
        style={({ pressed }) => [
          rc.redeemBtn,
          !canAfford && rc.redeemBtnDisabled,
          pressed && canAfford && { opacity: 0.85 },
        ]}
      >
        {redeeming ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={[rc.redeemText, !canAfford && rc.redeemTextDisabled]}>
            {canAfford ? 'Redeem →' : 'Need more'}
          </Text>
        )}
      </Pressable>
    </View>
  )
}

const rc = StyleSheet.create({
  card: {
    flex:            1,
    backgroundColor: '#ffffff',
    borderRadius:    14,
    borderWidth:     1.5,
    borderColor:     '#e2e8f0',
    padding:         14,
    gap:             6,
  },
  cardAffordable: {
    borderColor:     '#bbf7d0',
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   4,
  },
  emoji: { fontSize: 26 },
  catBadge: {
    backgroundColor:   '#f0fdf4',
    borderRadius:      99,
    paddingHorizontal: 7,
    paddingVertical:   3,
    borderWidth:       1,
    borderColor:       '#bbf7d0',
  },
  catText: {
    fontSize:   9,
    fontWeight: '700',
    color:      '#16a34a',
    letterSpacing: 0.3,
  },
  title: {
    fontSize:   13,
    fontWeight: '800',
    color:      '#16a34a',
    lineHeight: 18,
  },
  pts: {
    fontSize:   13,
    fontWeight: '700',
    color:      '#3FE870',
  },
  redeemBtn: {
    backgroundColor: '#1a3a1a',
    borderRadius:    10,
    paddingVertical: 10,
    alignItems:      'center',
    marginTop:       4,
  },
  redeemBtnDisabled: {
    backgroundColor: '#e2e8f0',
  },
  redeemText: {
    fontSize:   13,
    fontWeight: '800',
    color:      '#ffffff',
  },
  redeemTextDisabled: {
    color: '#94a3b8',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Rewards Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function RewardsScreen() {
  const { user } = useAuth()

  const [balance,      setBalance]      = useState<PointsBalance>({ total_points: 1420, available_points: 1420 })
  const [challenges,   setChallenges]   = useState<Challenge[]>(DEMO_CHALLENGES)
  const [rewards,      setRewards]      = useState<Reward[]>(DEMO_REWARDS)
  const [activeTab,    setActiveTab]    = useState<'challenges' | 'store'>('challenges')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [redeeming,    setRedeeming]    = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    const [balRes, chRes, rwRes] = await Promise.all([
      supabase.from('user_points').select('total_points, available_points').eq('user_id', user.id).maybeSingle(),
      supabase.from('challenges').select('id, title, description, category, points_reward, target_value, metric_type').eq('is_active', true).limit(10),
      supabase.from('rewards').select('id, title, description, category, points_cost, is_active').eq('is_active', true).order('points_cost', { ascending: true }).limit(8),
    ])
    if (balRes.data) setBalance(balRes.data as PointsBalance)
    if (chRes.data && chRes.data.length > 0) setChallenges(chRes.data as Challenge[])
    if (rwRes.data && rwRes.data.length > 0)  setRewards(rwRes.data as Reward[])
  }, [user])

  useEffect(() => { load() }, [load])

  const onRefresh = async () => { setIsRefreshing(true); await load(); setIsRefreshing(false) }

  const handleJoin = (id: string) => {
    setChallenges((prev) => prev.map((c) => c.id === id ? { ...c, is_joined: true } : c))
  }

  const handleRedeem = (rewardId: string, cost: number, title: string) => {
    if (!user) return
    Alert.alert(
      'Redeem Reward',
      `Spend ${cost.toLocaleString()} pts on ${title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            setRedeeming(rewardId)
            try {
              if (user.id) {
                const { data: pts } = await supabase.from('user_points').select('available_points').eq('user_id', user.id).maybeSingle()
                if (pts && (pts.available_points ?? 0) >= cost) {
                  await Promise.all([
                    supabase.from('user_points').update({ available_points: (pts.available_points ?? 0) - cost }).eq('user_id', user.id),
                    supabase.from('points_transactions').insert({ user_id: user.id, org_id: user.org_id, points: cost, transaction_type: 'spent', description: `Redeemed: ${title}`, reference_id: rewardId }),
                  ])
                  setBalance((prev) => ({ ...prev, available_points: prev.available_points - cost }))
                }
              }
              Alert.alert('Redeemed! 🎉', 'Your HR team has been notified. Enjoy your reward!')
            } finally {
              setRedeeming(null)
            }
          },
        },
      ]
    )
  }

  const availablePts = balance.available_points
  const platinumGoal = 2000
  const platinumProgress = Math.min(availablePts / platinumGoal, 1)
  const remainingPts = Math.max(0, platinumGoal - availablePts)

  // Rewards Store — split into 2-column pairs
  const rewardPairs: Reward[][] = []
  for (let i = 0; i < rewards.length; i += 2) {
    rewardPairs.push(rewards.slice(i, i + 2))
  }

  return (
    <SafeAreaView style={styles.root}>

      {/* ── Dark green header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Rewards 🎁</Text>
          <Text style={styles.headerSub}>Earn points · Redeem perks</Text>
        </View>
        <View style={styles.ptsBadge}>
          <Ionicons name="diamond" size={14} color="#60a5fa" />
          <View>
            <Text style={styles.ptsBadgeNum}>{availablePts.toLocaleString()}</Text>
            <Text style={styles.ptsBadgeLabel}>Your Points</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#3FE870" />}
      >

        {/* ── Progress to Platinum ── */}
        <View style={styles.platCard}>
          <View style={styles.platTop}>
            <Text style={styles.platLabel}>Progress to Platinum 🏆</Text>
            <Text style={styles.platPts}>{availablePts.toLocaleString()} / {platinumGoal.toLocaleString()} pts</Text>
          </View>
          <View style={styles.platTrack}>
            <View style={[styles.platFill, { width: `${platinumProgress * 100}%` as any }]} />
          </View>
          <Text style={styles.platSub}>{remainingPts > 0 ? `${remainingPts.toLocaleString()} more points to unlock Platinum benefits` : 'Platinum unlocked! 🎉'}</Text>
        </View>

        {/* ── Tab toggle ── */}
        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setActiveTab('challenges')}
            style={[styles.tabBtn, activeTab === 'challenges' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'challenges' && styles.tabTextActive]}>Challenges</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('store')}
            style={[styles.tabBtn, activeTab === 'store' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'store' && styles.tabTextActive]}>Rewards Store</Text>
          </Pressable>
        </View>

        {/* ── Challenges ── */}
        {activeTab === 'challenges' && (
          <View style={styles.tabContent}>
            {challenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} onJoin={handleJoin} />
            ))}
          </View>
        )}

        {/* ── Rewards Store ── */}
        {activeTab === 'store' && (
          <View style={styles.tabContent}>
            {/* Balance card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <Ionicons name="diamond" size={16} color="#3b82f6" />
                <Text style={styles.balanceText}>Your Balance: <Text style={styles.balancePts}>{availablePts.toLocaleString()} pts</Text></Text>
              </View>
              <Text style={styles.balanceSub}>
                Eligible for {rewards.filter((r) => r.points_cost <= availablePts).length} rewards below
              </Text>
            </View>

            {/* 2-column grid */}
            {rewardPairs.map((pair, i) => (
              <View key={i} style={styles.rewardRow}>
                {pair.map((r) => (
                  <RewardCard
                    key={r.id}
                    reward={r}
                    availablePoints={availablePts}
                    onRedeem={handleRedeem}
                    redeeming={redeeming === r.id}
                  />
                ))}
                {pair.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            ))}
          </View>
        )}

      </ScrollView>
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

  // Header
  header: {
    backgroundColor:   '#0d2210',
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingTop:        Platform.OS === 'android' ? 8 : 12,
    paddingBottom:     16,
  },
  headerTitle: {
    fontSize:   24,
    fontWeight: '900',
    color:      '#ffffff',
  },
  headerSub: {
    fontSize:  12,
    color:     'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  ptsBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   '#1a3a1a',
    borderRadius:      12,
    paddingHorizontal: 12,
    paddingVertical:   8,
  },
  ptsBadgeNum: {
    fontSize:   15,
    fontWeight: '900',
    color:      '#ffffff',
    lineHeight: 19,
  },
  ptsBadgeLabel: {
    fontSize:  10,
    color:     'rgba(255,255,255,0.5)',
    lineHeight: 13,
  },

  scroll: {
    paddingBottom: 40,
  },

  // Platinum card
  platCard: {
    backgroundColor:   '#0d2210',
    marginHorizontal:  16,
    marginTop:         16,
    borderRadius:      16,
    padding:           16,
    gap:               8,
  },
  platTop: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  platLabel: {
    fontSize:   13,
    fontWeight: '700',
    color:      '#ffffff',
  },
  platPts: {
    fontSize:   12,
    fontWeight: '800',
    color:      '#3FE870',
  },
  platTrack: {
    height:          6,
    borderRadius:    3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow:        'hidden',
  },
  platFill: {
    height:          6,
    borderRadius:    3,
    backgroundColor: '#3FE870',
  },
  platSub: {
    fontSize:  11,
    color:     'rgba(255,255,255,0.45)',
  },

  // Tab toggle
  tabRow: {
    flexDirection:     'row',
    marginHorizontal:  16,
    marginTop:         20,
    backgroundColor:   '#f1f5f9',
    borderRadius:      12,
    padding:           4,
  },
  tabBtn: {
    flex:            1,
    paddingVertical: 10,
    alignItems:      'center',
    borderRadius:    10,
  },
  tabBtnActive: {
    backgroundColor: '#1a3a1a',
  },
  tabText: {
    fontSize:   13,
    fontWeight: '700',
    color:      '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },

  tabContent: {
    paddingHorizontal: 16,
    paddingTop:        16,
    gap:               0,
  },

  // Balance card (store tab)
  balanceCard: {
    backgroundColor:   '#f0fdf4',
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       '#bbf7d0',
    padding:           14,
    marginBottom:      16,
    gap:               4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  balanceText: {
    fontSize:   13,
    fontWeight: '700',
    color:      '#0f172a',
  },
  balancePts: {
    color: '#16a34a',
  },
  balanceSub: {
    fontSize: 12,
    color:    '#64748b',
  },

  // Reward 2-column row
  rewardRow: {
    flexDirection: 'row',
    gap:           12,
    marginBottom:  12,
  },
})
