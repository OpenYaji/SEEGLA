/**
 * Profile Screen — Seegla Brand Guidelines
 * * Features:
 * - Brand Colors (Navy & Emerald-Teal)
 * - Dynamic Rank Badge (Veteran, Pro, Beginner)
 * - 3-Way Tab System: My Posts | Likes | Rewards (Active tab is now Navy)
 * - Removed Profile Menu
 */

import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/lib/auth-context'

const { width } = Dimensions.get('window')

const COVER_HEIGHT  = 180
const AVATAR_SIZE   = 90
const AVATAR_OFFSET = AVATAR_SIZE / 2   

// ─────────────────────────────────────────────────────────────────────────────
// Brand Colors & Theme (Official PDF Hex Codes)
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
  navy: '#0A2E5C',       
  teal: '#16A085',       
  orangeDark: '#F59E0B', 
  bgGray: '#F7F9FC',     
  white: '#FFFFFF',
  textPrimary: '#0A2E5C',
  textSecondary: '#64748B',
  border: '#E5E7EB',
}

const RANK_UI: Record<string, { label: string, bg: string, text: string, border: string }> = {
  beginner: { label: 'Beginner', bg: '#E8F5E9', text: '#15803d', border: '#4CAF7A' },
  veteran:  { label: 'Veteran', bg: '#E6FDFD', text: '#0e7490', border: COLORS.teal },
  pro:      { label: 'Pro', bg: '#FFF8E1', text: '#b45309', border: COLORS.orangeDark },
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo Data
// ─────────────────────────────────────────────────────────────────────────────

const MY_REWARDS = [
  { id: 'r1', title: '₱500 GCash Credit', status: 'Available', expUsed: 'Exp: 15 Jun 2026', icon: 'wallet' },
  { id: 'r2', title: 'GrabFood 30% Off Voucher', status: 'Available', expUsed: 'Exp: 30 May 2026', icon: 'fast-food' },
  { id: 'r3', title: '1-Month Gym Access (Gold)', status: 'Used', expUsed: 'Used: 10 Mar 2026', icon: 'barbell' },
  { id: 'r4', title: 'Vanguard Cinema Tickets x2', status: 'Expired', expUsed: 'Exp: 01 Mar 2026', icon: 'ticket' },
]

const MY_POSTS = [
  {
    id:      '1',
    content: 'Just finished the 10K steps challenge! 💪 Feeling great. Who else is on the March Step Challenge?',
    time:    '2h ago',
    likes:   24,
    comments: 6,
    liked:   false,
  },
  {
    id:      '2',
    content: '🥗 Meal prepped for the whole week. Logging healthy meals on SEEGLA is so satisfying when the streak keeps growing!',
    time:    'Yesterday',
    likes:   18,
    comments: 3,
    liked:   true,
  },
]

const LIKED_POSTS = [
  {
    id:      'l1',
    author:  'Maria Santos',
    initials:'MS',
    content: 'Morning run before work is the best way to start a Monday 🌄 #WellnessWins',
    time:    '4h ago',
    likes:   31,
    comments: 8,
    liked:   true,
  },
  {
    id:      'l2',
    author:  'HR Team SEEGLA',
    initials:'HR',
    content: '📢 This month\'s wellness webinar is this Friday at 3PM. Topic: Sleep hygiene for busy professionals. See you there!',
    time:    '1 day ago',
    likes:   55,
    comments: 14,
    liked:   true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function RewardItem({ title, status, expUsed, icon }: any) {
  const isAvailable = status === 'Available'
  const isExpired = status === 'Expired'
  
  const iconColor = isAvailable ? COLORS.teal : isExpired ? '#EF4444' : COLORS.textSecondary
  const iconBg = isAvailable ? 'rgba(22, 160, 133, 0.1)' : isExpired ? '#FEF2F2' : '#F1F5F9'
  const badgeColor = isAvailable ? COLORS.teal : isExpired ? '#EF4444' : COLORS.textSecondary

  return (
    <View style={ri.row}>
      <View style={[ri.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={ri.content}>
        <Text style={ri.rewardTitle}>{title}</Text>
        <Text style={ri.rewardExpUsed}>{expUsed}</Text>
      </View>
      <View style={[ri.statusBadge, { backgroundColor: iconBg }]}>
        <Text style={[ri.statusBadgeText, { color: badgeColor }]}>
          {status.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const ri = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  content: { flex: 1 },
  rewardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.navy },
  rewardExpUsed: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, fontWeight: '600' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});

function PostCard({ author, initials, content, time, likes, comments, liked }: any) {
  const [isLiked, setLiked] = useState(liked)
  const [likeCount, setLikeCount] = useState(likes)

  const toggleLike = () => {
    setLiked((prev: boolean) => !prev)
    setLikeCount((prev: number) => prev + (isLiked ? -1 : 1))
  }

  return (
    <View style={pc.card}>
      <View style={pc.header}>
        <View style={pc.avatar}>
          <Text style={pc.avatarText}>{initials}</Text>
        </View>
        <View style={pc.meta}>
          <Text style={pc.name}>{author}</Text>
          <Text style={pc.time}>{time}</Text>
        </View>
      </View>
      <Text style={pc.content}>{content}</Text>
      <View style={pc.actions}>
        <Pressable onPress={toggleLike} style={pc.actionBtn}>
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color={isLiked ? '#ef4444' : COLORS.textSecondary} />
          <Text style={[pc.actionText, isLiked && { color: '#ef4444' }]}>{likeCount}</Text>
        </Pressable>
        <View style={pc.actionBtn}>
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} />
          <Text style={pc.actionText}>{comments}</Text>
        </View>
        <View style={pc.actionBtn}>
          <Ionicons name="share-social-outline" size={18} color={COLORS.textSecondary} />
          <Text style={pc.actionText}>Share</Text>
        </View>
      </View>
    </View>
  )
}

const pc = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.bgGray, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '900', color: COLORS.teal },
  meta: { flex: 1 },
  name: { fontSize: 14, fontWeight: '800', color: COLORS.navy },
  time: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  content: { fontSize: 14, color: '#334155', lineHeight: 21 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingTop: 6, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
})

// ─────────────────────────────────────────────────────────────────────────────
// Profile Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'rewards'>('posts')

  const displayName = user?.full_name ?? 'Juan Dela Cruz'
  const initials    = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  
  // Rank logic
  const currentRankLabel = user?.wellness_rank ? user.wellness_rank.toLowerCase() : 'veteran'
  const rankConfig = RANK_UI[currentRankLabel] || RANK_UI.beginner

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Cover photo ── */}
        <View style={[s.cover, { paddingTop: insets.top }]}>
          <Pressable onPress={() => router.back()} style={[s.backBtn, { top: insets.top + 10 }]}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </Pressable>
          <View style={s.coverBlobTL} />
          <View style={s.coverBlobBR} />
        </View>

        {/* ── Avatar row ── */}
        <View style={s.avatarRow}>
          <View style={s.avatarOuter}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
            <Pressable style={s.editBadge}>
              <Ionicons name="camera" size={13} color={COLORS.white} />
            </Pressable>
          </View>
        </View>

        {/* ── Name & Rank ── */}
        <View style={s.nameBlock}>
          <Text style={s.name}>{displayName}</Text>
          <View style={[s.rankBadge, { backgroundColor: rankConfig.bg, borderColor: rankConfig.border }]}>
            <Text style={[s.rankBadgeText, { color: rankConfig.text }]}>{rankConfig.label}</Text>
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>24</Text>
            <Text style={s.statLabel}>Posts</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={[s.statNum, {color: COLORS.teal}]}>1,420</Text>
            <Text style={s.statLabel}>Points</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={[s.statNum, {color: COLORS.orangeDark}]}>#12</Text>
            <Text style={s.statLabel}>Rank</Text>
          </View>
        </View>

        {/* ── 3-Way Tab toggle ── */}
        <View style={s.tabRow}>
          <Pressable onPress={() => setActiveTab('posts')} style={[s.tabBtn, activeTab === 'posts' && s.tabBtnActive]}>
            <Ionicons name="grid" size={16} color={activeTab === 'posts' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[s.tabText, activeTab === 'posts' && s.tabTextActive]}>My Posts</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('likes')} style={[s.tabBtn, activeTab === 'likes' && s.tabBtnActive]}>
            <Ionicons name="heart" size={16} color={activeTab === 'likes' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[s.tabText, activeTab === 'likes' && s.tabTextActive]}>Likes</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('rewards')} style={[s.tabBtn, activeTab === 'rewards' && s.tabBtnActive]}>
            <Ionicons name="gift" size={16} color={activeTab === 'rewards' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[s.tabText, activeTab === 'rewards' && s.tabTextActive]}>Rewards</Text>
          </Pressable>
        </View>

        {/* ── Dynamic Content Area ── */}
        <View style={s.feed}>
          {activeTab === 'posts' && MY_POSTS.map(p => (
            <PostCard key={p.id} author={displayName} initials={initials} content={p.content} time={p.time} likes={p.likes} comments={p.comments} liked={p.liked} />
          ))}
          
          {activeTab === 'likes' && LIKED_POSTS.map(p => (
            <PostCard key={p.id} author={p.author} initials={p.initials} content={p.content} time={p.time} likes={p.likes} comments={p.comments} liked={p.liked} />
          ))}

          {activeTab === 'rewards' && MY_REWARDS.map(r => (
            <RewardItem key={r.id} title={r.title} status={r.status as any} expUsed={r.expUsed} icon={r.icon as any} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bgGray },
  scroll: { paddingBottom: 20 },

  // Cover
  cover: { height: COVER_HEIGHT, backgroundColor: COLORS.navy, overflow: 'hidden', position: 'relative' },
  coverBlobTL: { position: 'absolute', width: width, height: width, borderRadius: width / 2, top: -width / 2, left: -width * 0.2, backgroundColor: COLORS.teal, opacity: 0.15 },
  coverBlobBR: { position: 'absolute', width: width * 0.7, height: width * 0.7, borderRadius: width * 0.35, bottom: -width * 0.35, right: -width * 0.1, backgroundColor: COLORS.orangeDark, opacity: 0.1 },
  backBtn: { position: 'absolute', left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },

  // Avatar
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -(AVATAR_OFFSET), marginBottom: 8 },
  avatarOuter: { position: 'relative' },
  avatarCircle: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: COLORS.bgGray, elevation: 5 },
  avatarInitials: { fontSize: 32, fontWeight: '900', color: COLORS.white },
  editBadge: { position: 'absolute', bottom: 4, right: 4, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white },

  // Name & Rank block
  nameBlock: { paddingHorizontal: 20, gap: 6, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '900', color: COLORS.navy },
  rankBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  rankBadgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Stats
  statsRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 24, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 14, elevation: 1 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 20, fontWeight: '900', color: COLORS.navy },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  // 3-Way Tabs
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
  
  // ---> CHANGED TO NAVY HERE <---
  tabBtnActive: { backgroundColor: COLORS.navy },
  
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },

  // Feed Area
  feed: { marginBottom: 24 },
})