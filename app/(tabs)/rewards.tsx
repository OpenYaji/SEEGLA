/**
 * Rewards Store Screen
 *
 * Features:
 * - Purple to Teal gradient header with glassmorphism stats
 * - Rank Progress Card (Beginner -> Veteran -> Pro)
 * - Category Filter Chips
 * - Rank-locked Rewards (Requires specific rank to redeem)
 */

import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useState } from 'react'
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 50) / 2 // 2 columns with padding

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
  bgGray: '#F7F9FC',   
  white: '#FFFFFF',
  textPrimary: '#1E2356',
  textSecondary: '#64748B',
  border: '#E5E7EB',
  disabledText: '#94A3B8'
}

// ─────────────────────────────────────────────────────────────────────────────
// Rank Logic & Hierarchy
// ─────────────────────────────────────────────────────────────────────────────

// Assign numerical values to ranks to easily compare if a user qualifies
const RANK_LEVELS: Record<string, number> = {
  'Beginner': 1,
  'Veteran':  2,
  'Pro':      3,
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'food', label: 'Food', emoji: '🍔' },
  { id: 'gcash', label: 'GCash', emoji: '💸' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
]

const REWARDS = [
  { id: '1', title: '₱20 GrabFood Voucher', sub: '48 left · GrabFood', points: 200, category: 'food', topColor: COLORS.green, icon: '🚗', requiredRank: 'Beginner' },
  { id: '2', title: '₱25 Shopee Voucher', sub: '60 left · Shopee', points: 250, category: 'all', topColor: COLORS.orangeDark, icon: '🛍️', requiredRank: 'Beginner' },
  { id: '3', title: '₱30 Grab Voucher', sub: '40 left · Grab', points: 300, category: 'food', topColor: COLORS.green, icon: '🚗', requiredRank: 'Veteran' },
  { id: '4', title: 'Free SB Coffee', sub: '20 left · Starbucks', points: 450, category: 'coffee', topColor: '#059669', icon: '☕', requiredRank: 'Veteran' },
  { id: '5', title: '₱50 GCash Credits', sub: '12 left · GCash', points: 500, category: 'gcash', topColor: '#3b82f6', icon: '📱', requiredRank: 'Pro' },
  { id: '6', title: '₱100 GrabCar', sub: '5 left · Grab', points: 800, category: 'all', topColor: '#059669', icon: '🚘', requiredRank: 'Pro' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({ progress, color = COLORS.teal }: { progress: number; color?: string }) {
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function RewardsScreen() {
  const [activeFilter, setActiveFilter] = useState('all')

  // Mock User Stats
  const userPoints = 1240
  const monthlyEarned = 340
  const rewardsRedeemed = 3
  const currentStreak = 5

  // User Rank Details
  const currentRank = 'Veteran' // Change this to 'Beginner' or 'Pro' to test the lock feature!
  const nextRank = 'Pro'
  const rankProgress = 65 
  const pointsToNext = 260

  const userRankValue = RANK_LEVELS[currentRank] || 1

  // Filter Logic
  const displayedRewards = activeFilter === 'all' 
    ? REWARDS 
    : REWARDS.filter(r => r.category === activeFilter)

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        
        {/* ── 1. Gradient Header ── */}
        <LinearGradient 
          colors={[COLORS.purple, COLORS.teal]} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={s.headerGradient}
        >
          <SafeAreaView edges={['top']} style={s.safeHeader}>
            <Text style={s.headerSubtitle}>Your Balance</Text>
            <View style={s.balanceRow}>
              <Text style={s.balanceText}>{userPoints.toLocaleString()}</Text>
              <Text style={s.balancePts}>pts</Text>
            </View>
            <Text style={s.headerDesc}>Earn more by completing challenges and check-ins</Text>

            {/* Glassmorphism Stats Row */}
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={s.statLabel}>Redeemed</Text>
                <View style={s.statValRow}>
                  <Text style={s.statEmoji}>🎁</Text>
                  <Text style={s.statValue}>{rewardsRedeemed}</Text>
                </View>
              </View>

              <View style={s.statBox}>
                <Text style={s.statLabel}>This Month</Text>
                <View style={s.statValRow}>
                  <Text style={s.statEmoji}>📈</Text>
                  <Text style={s.statValue}>+{monthlyEarned}</Text>
                </View>
              </View>

              <View style={s.statBox}>
                <Text style={s.statLabel}>Streak</Text>
                <View style={s.statValRow}>
                  <Text style={s.statEmoji}>🔥</Text>
                  <Text style={s.statValue}>{currentStreak} days</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── 2. Rank Progress Card ── */}
        <View style={s.rankContainer}>
          <View style={s.rankCard}>
            <View style={s.rankHeader}>
              <View style={s.rankTitleRow}>
                <View style={s.rankIconBox}>
                  <Ionicons name="flash" size={16} color={COLORS.teal} />
                </View>
                <View>
                  <Text style={s.rankLabel}>Current Rank</Text>
                  <Text style={s.rankName}>{currentRank}</Text>
                </View>
              </View>
              <View style={s.nextRankBox}>
                <Ionicons name="trophy" size={12} color={COLORS.orangeDark} />
                <Text style={s.nextRankText}>Next: {nextRank}</Text>
              </View>
            </View>

            <ProgressBar progress={rankProgress} color={COLORS.teal} />
            
            <View style={s.rankFooter}>
              <Text style={s.rankFooterText}>{rankProgress}% completed</Text>
              <Text style={s.rankFooterPoints}>Earn {pointsToNext} more pts to rank up</Text>
            </View>
          </View>
        </View>

        {/* ── 3. Filters ── */}
        <View style={s.filterWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id
              return (
                <Pressable
                  key={filter.id}
                  onPress={() => setActiveFilter(filter.id)}
                  style={[s.filterChip, isActive && s.filterChipActive]}
                >
                  <Text style={s.filterEmoji}>{filter.emoji}</Text>
                  <Text style={[s.filterText, isActive && s.filterTextActive]}>{filter.label}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        {/* ── 4. Rewards Grid ── */}
        <View style={s.rewardsSection}>
          <Text style={s.sectionTitle}>
            {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Rewards
          </Text>

          <View style={s.rewardsGrid}>
            {displayedRewards.map((reward) => {
              
              // Rank validation check
              const rewardRankValue = RANK_LEVELS[reward.requiredRank] || 1
              const isLocked = userRankValue < rewardRankValue

              return (
                <View key={reward.id} style={[s.rewardCard, isLocked && s.rewardCardLocked]}>
                  {/* Top Color Accent Line (Grayed out if locked) */}
                  <View style={[s.cardTopBorder, { backgroundColor: isLocked ? COLORS.border : reward.topColor }]} />
                  
                  <View style={s.cardInner}>
                    {/* Icon */}
                    <View style={s.rewardIconBox}>
                      <Text style={[s.rewardIcon, isLocked && { opacity: 0.4 }]}>{reward.icon}</Text>
                    </View>

                    {/* Title & Subtitle */}
                    <Text style={[s.rewardTitle, isLocked && { color: COLORS.textSecondary }]} numberOfLines={2}>
                      {reward.title}
                    </Text>
                    <Text style={s.rewardSub}>{reward.sub}</Text>

                    <View style={s.spacer} />

                    {/* Points & CTA Row */}
                    <View style={s.rewardFooter}>
                      <View style={[s.pointsWrapper, isLocked && { opacity: 0.5 }]}>
                        <Ionicons name="star" size={13} color={COLORS.orangeDark} />
                        <Text style={s.rewardPoints}>{reward.points}</Text>
                        <Text style={s.rewardPtsLabel}>pts</Text>
                      </View>

                      {/* Redeem Button OR Lock Badge */}
                      {isLocked ? (
                        <View style={s.lockedBtn}>
                          <Ionicons name="lock-closed" size={10} color={COLORS.disabledText} />
                          <Text style={s.lockedBtnText}>{reward.requiredRank}</Text>
                        </View>
                      ) : (
                        <Pressable style={s.redeemBtn}>
                          <Text style={s.redeemBtnText}>Redeem</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        </View>

      </ScrollView>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgGray,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Gradient Header
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 24,
  },
  safeHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  balanceText: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
  },
  balancePts: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  headerDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },

  // Glassmorphism Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 6,
  },
  statValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statEmoji: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Rank Progress Card
  rankContainer: {
    paddingHorizontal: 20,
    marginTop: -20, 
    marginBottom: 10,
  },
  rankCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: COLORS.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 196, 199, 0.15)', // lightTeal
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  rankName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  nextRankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nextRankText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.orangeDark,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  rankFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  rankFooterPoints: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.teal,
  },

  // Filters
  filterWrapper: {
    marginTop: 10,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterChipActive: {
    borderColor: COLORS.teal,
    backgroundColor: 'rgba(0, 196, 199, 0.1)',
  },
  filterEmoji: {
    fontSize: 14,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.teal,
    fontWeight: '800',
  },

  // Rewards Grid
  rewardsSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 16,
  },
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10, 
  },
  rewardCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden', 
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  rewardCardLocked: {
    backgroundColor: COLORS.bgGray,
    borderColor: COLORS.border,
  },
  cardTopBorder: {
    height: 6,
    width: '100%',
  },
  cardInner: {
    padding: 12,
    flex: 1,
  },
  rewardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bgGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  rewardIcon: {
    fontSize: 18,
  },
  rewardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
    lineHeight: 18,
    marginBottom: 4,
  },
  rewardSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  spacer: {
    flex: 1, 
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  pointsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rewardPoints: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.navy,
  },
  rewardPtsLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Normal Redeem Button
  redeemBtn: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  redeemBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },

  // Locked Rank Button
  lockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  lockedBtnText: {
    color: COLORS.disabledText,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
})