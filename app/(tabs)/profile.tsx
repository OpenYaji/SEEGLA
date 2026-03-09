/**
 * Profile Screen — Facebook-style
 *
 * Layout:
 *   • Cover photo (dark green gradient band)
 *   • Circular avatar with Edit badge, floating above cover
 *   • Name, role, stats row (Posts / Points / Rank)
 *   • My Posts | Likes tab toggle
 *   • Scrollable post feed
 *   • Bottom menu section: Settings & Privacy, Activity Log, Help & Support
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  Dimensions,
  StatusBar,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

import { useAuth } from '@/lib/auth-context'

const { width } = Dimensions.get('window')

const COVER_HEIGHT  = 180
const AVATAR_SIZE   = 90
const AVATAR_OFFSET = AVATAR_SIZE / 2   // how far below cover bottom the avatar sits

// ─────────────────────────────────────────────────────────────────────────────
// Demo posts
// ─────────────────────────────────────────────────────────────────────────────

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
  {
    id:      '3',
    content: 'Finally hit the Platinum tier! 🏅 The GCash reward is going straight to groceries. Salamat SEEGLA!',
    time:    '3 days ago',
    likes:   47,
    comments: 12,
    liked:   false,
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
// Post card
// ─────────────────────────────────────────────────────────────────────────────

function PostCard({
  author,
  initials,
  content,
  time,
  likes,
  comments,
  liked,
}: {
  author:   string
  initials: string
  content:  string
  time:     string
  likes:    number
  comments: number
  liked:    boolean
}) {
  const [isLiked, setLiked] = useState(liked)
  const [likeCount, setLikeCount] = useState(likes)

  const toggleLike = () => {
    setLiked(prev => !prev)
    setLikeCount(prev => prev + (isLiked ? -1 : 1))
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
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={isLiked ? '#ef4444' : '#94a3b8'}
          />
          <Text style={[pc.actionText, isLiked && { color: '#ef4444' }]}>{likeCount}</Text>
        </Pressable>
        <View style={pc.actionBtn}>
          <Ionicons name="chatbubble-outline" size={18} color="#94a3b8" />
          <Text style={pc.actionText}>{comments}</Text>
        </View>
        <View style={pc.actionBtn}>
          <Ionicons name="share-social-outline" size={18} color="#94a3b8" />
          <Text style={pc.actionText}>Share</Text>
        </View>
      </View>
    </View>
  )
}

const pc = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius:    14,
    marginHorizontal:16,
    marginBottom:    12,
    padding:         16,
    borderWidth:     1,
    borderColor:     '#f1f5f9',
    gap:             10,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  avatar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: '#1a3a1a',
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: { fontSize: 14, fontWeight: '900', color: '#3FE870' },
  meta:       { flex: 1 },
  name:       { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  time:       { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  content:    { fontSize: 14, color: '#334155', lineHeight: 21 },
  actions: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            20,
    paddingTop:     6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  actionText: {
    fontSize:   13,
    fontWeight: '600',
    color:      '#94a3b8',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Menu item row
// ─────────────────────────────────────────────────────────────────────────────

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon:    React.ComponentProps<typeof Ionicons>['name']
  label:   string
  onPress?: () => void
  danger?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [mi.row, pressed && { backgroundColor: '#f8fafc' }]}
    >
      <View style={[mi.iconBox, danger && { backgroundColor: '#fef2f2' }]}>
        <Ionicons name={icon} size={20} color={danger ? '#ef4444' : '#475569'} />
      </View>
      <Text style={[mi.label, danger && { color: '#ef4444' }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
    </Pressable>
  )
}

const mi = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               14,
    paddingHorizontal: 20,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    backgroundColor:   '#ffffff',
  },
  iconBox: {
    width:          40,
    height:         40,
    borderRadius:   11,
    backgroundColor:'#f8fafc',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  label: {
    flex:       1,
    fontSize:   14,
    fontWeight: '600',
    color:      '#334155',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Profile Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts')

  const displayName = user?.full_name ?? 'Juan Dela Cruz'
  const initials    = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const roleLabel   = user?.role === 'hr_admin'
    ? 'HR Admin'
    : user?.role === 'system_admin'
    ? 'System Admin'
    : 'Wellness Member'

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Cover photo ── */}
        <View style={[s.cover, { paddingTop: insets.top }]}>
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={[s.backBtn, { top: insets.top + 10 }]}
          >
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </Pressable>

          {/* Decorative cover blobs */}
          <View style={s.coverBlobTL} />
          <View style={s.coverBlobBR} />
        </View>

        {/* ── Avatar row (floating below cover) ── */}
        <View style={s.avatarRow}>
          <View style={s.avatarOuter}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
            {/* Edit badge */}
            <Pressable style={s.editBadge}>
              <Ionicons name="camera" size={13} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {/* ── Name & role ── */}
        <View style={s.nameBlock}>
          <Text style={s.name}>{displayName}</Text>
          <Text style={s.role}>{roleLabel}</Text>
        </View>

        {/* ── Stats row ── */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>24</Text>
            <Text style={s.statLabel}>Posts</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>1,420</Text>
            <Text style={s.statLabel}>Points</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>#12</Text>
            <Text style={s.statLabel}>Rank</Text>
          </View>
        </View>

        {/* ── Tab toggle ── */}
        <View style={s.tabRow}>
          <Pressable
            onPress={() => setActiveTab('posts')}
            style={[s.tabBtn, activeTab === 'posts' && s.tabBtnActive]}
          >
            <Ionicons
              name="grid-outline"
              size={16}
              color={activeTab === 'posts' ? '#0d2210' : '#94a3b8'}
            />
            <Text style={[s.tabText, activeTab === 'posts' && s.tabTextActive]}>My Posts</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('likes')}
            style={[s.tabBtn, activeTab === 'likes' && s.tabBtnActive]}
          >
            <Ionicons
              name="heart-outline"
              size={16}
              color={activeTab === 'likes' ? '#0d2210' : '#94a3b8'}
            />
            <Text style={[s.tabText, activeTab === 'likes' && s.tabTextActive]}>Likes</Text>
          </Pressable>
        </View>

        {/* ── Feed ── */}
        <View style={s.feed}>
          {activeTab === 'posts' ? (
            MY_POSTS.map(p => (
              <PostCard
                key={p.id}
                author={displayName}
                initials={initials}
                content={p.content}
                time={p.time}
                likes={p.likes}
                comments={p.comments}
                liked={p.liked}
              />
            ))
          ) : (
            LIKED_POSTS.map(p => (
              <PostCard
                key={p.id}
                author={p.author}
                initials={p.initials}
                content={p.content}
                time={p.time}
                likes={p.likes}
                comments={p.comments}
                liked={p.liked}
              />
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { paddingBottom: 20 },

  // Cover
  cover: {
    height:          COVER_HEIGHT,
    backgroundColor: '#0d2210',
    overflow:        'hidden',
    position:        'relative',
  },
  coverBlobTL: {
    position:        'absolute',
    width:           width * 1.0,
    height:          width * 1.0,
    borderRadius:    width * 0.5,
    top:             -width * 0.5,
    left:            -width * 0.2,
    backgroundColor: '#1a4a20',
    opacity:         0.6,
  },
  coverBlobBR: {
    position:        'absolute',
    width:           width * 0.7,
    height:          width * 0.7,
    borderRadius:    width * 0.35,
    bottom:          -width * 0.35,
    right:           -width * 0.1,
    backgroundColor: '#3FE870',
    opacity:         0.12,
  },
  backBtn: {
    position:        'absolute',
    left:            16,
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          10,
  },

  // Avatar row
  avatarRow: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    marginTop:         -(AVATAR_OFFSET),
    marginBottom:      8,
  },
  avatarOuter: {
    position: 'relative',
  },
  avatarCircle: {
    width:           AVATAR_SIZE,
    height:          AVATAR_SIZE,
    borderRadius:    AVATAR_SIZE / 2,
    backgroundColor: '#3FE870',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     4,
    borderColor:     '#f8fafc',
    ...Platform.select({
      ios:     { shadowColor: '#3FE870', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  avatarInitials: {
    fontSize:   32,
    fontWeight: '900',
    color:      '#0d2210',
  },
  editBadge: {
    position:        'absolute',
    bottom:          4,
    right:           4,
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: '#1a3a1a',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     '#f8fafc',
  },
  editProfileBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   '#3FE870',
    borderRadius:      10,
    paddingHorizontal: 14,
    paddingVertical:   9,
    marginBottom:      4,
  },
  editProfileText: {
    fontSize:   13,
    fontWeight: '800',
    color:      '#0d2210',
  },

  // Name block
  nameBlock: {
    paddingHorizontal: 20,
    gap:               3,
    marginBottom:      16,
  },
  name: {
    fontSize:   22,
    fontWeight: '900',
    color:      '#0f172a',
  },
  role: {
    fontSize:  13,
    color:     '#64748b',
    fontWeight:'600',
  },

  // Stats
  statsRow: {
    flexDirection:     'row',
    alignItems:        'center',
    marginHorizontal:  20,
    marginBottom:      20,
    backgroundColor:   '#ffffff',
    borderRadius:      14,
    borderWidth:       1,
    borderColor:       '#f1f5f9',
    paddingVertical:   14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  stat: {
    flex:       1,
    alignItems: 'center',
    gap:        2,
  },
  statNum:   { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  statDivider: {
    width:           1,
    height:          30,
    backgroundColor: '#f1f5f9',
  },

  // Tab toggle
  tabRow: {
    flexDirection:     'row',
    marginHorizontal:  16,
    marginBottom:      16,
    backgroundColor:   '#f1f5f9',
    borderRadius:      12,
    padding:           4,
  },
  tabBtn: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               6,
    paddingVertical:   10,
    borderRadius:      9,
  },
  tabBtnActive: {
    backgroundColor: '#3FE870',
  },
  tabText: {
    fontSize:   13,
    fontWeight: '700',
    color:      '#94a3b8',
  },
  tabTextActive: {
    color: '#0d2210',
  },

  // Feed
  feed: {
    marginBottom: 24,
  },

  // Menu section
  menuSectionLabel: {
    fontSize:          11,
    fontWeight:        '800',
    color:             '#94a3b8',
    letterSpacing:     1.0,
    marginHorizontal:  20,
    marginBottom:      10,
  },
  menuCard: {
    marginHorizontal: 16,
    backgroundColor:  '#ffffff',
    borderRadius:     16,
    overflow:         'hidden',
    borderWidth:      1,
    borderColor:      '#f1f5f9',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
})
