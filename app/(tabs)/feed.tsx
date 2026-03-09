/**
 * Social Vitality Feed
 *
 * - Header: "Vitality Feed 🌱" + search + bell
 * - Stories row
 * - Filter chips (All / Tips / Recipes / Photos / Activity)
 * - FlatList of PostCards with images
 * - Floating "Add Post" button → modal sheet
 * - NO HabitLauncher (moved to Dashboard only)
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  FlatList,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import PostCard, {
  CommunityPost,
  ReactionCounts,
} from '@/components/vitality/post-card'
import PostSkeleton from '@/components/vitality/post-skeleton'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_ORG = '00000000-0000-0000-0000-000000000000'

const FILTERS = [
  { id: 'all',      label: 'All'      },
  { id: 'tip',      label: 'Tips'     },
  { id: 'recipe',   label: 'Recipes'  },
  { id: 'photo',    label: 'Photos'   },
  { id: 'activity', label: 'Activity' },
]

const POST_TYPES = [
  { id: 'activity', label: 'Activity', emoji: '🏃' },
  { id: 'photo',    label: 'Photo',    emoji: '📷' },
  { id: 'tip',      label: 'Tip',      emoji: '💡' },
  { id: 'recipe',   label: 'Recipe',   emoji: '🥗' },
  { id: 'blog',     label: 'Update',   emoji: '📝' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Add Post Modal
// ─────────────────────────────────────────────────────────────────────────────

function AddPostModal({
  visible,
  onClose,
  onPosted,
  userId,
  orgId,
}: {
  visible:  boolean
  onClose:  () => void
  onPosted: () => void
  userId:   string
  orgId:    string
}) {
  const [postType,  setPostType]  = useState('activity')
  const [content,   setContent]   = useState('')
  const [imageUrl,  setImageUrl]  = useState('')
  const [tags,      setTags]      = useState('')
  const [loading,   setLoading]   = useState(false)

  const reset = () => {
    setPostType('activity')
    setContent('')
    setImageUrl('')
    setTags('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Empty post', 'Write something to share with your team.')
      return
    }
    setLoading(true)
    try {
      const tagList = tags
        .split(/[,#\s]+/)
        .map((t) => t.replace('#', '').trim())
        .filter(Boolean)

      const { error } = await supabase.from('community_posts').insert({
        user_id:        userId,
        org_id:         orgId,
        post_type:      postType,
        content:        content.trim(),
        image_url:      imageUrl.trim() || null,
        tags:           tagList.length > 0 ? tagList : null,
        points_awarded: 0,
      })

      if (error) {
        Alert.alert('Error', error.message)
      } else {
        reset()
        onClose()
        onPosted()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={m.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Handle + header */}
        <View style={m.handle} />
        <View style={m.header}>
          <Pressable onPress={handleClose} style={m.closeBtn}>
            <Ionicons name="close" size={22} color="#64748b" />
          </Pressable>
          <Text style={m.title}>New Post</Text>
          <Pressable
            onPress={handlePost}
            disabled={loading || !content.trim()}
            style={({ pressed }) => [
              m.postBtn,
              (!content.trim() || loading) && m.postBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={m.postBtnText}>Post</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={m.scroll} keyboardShouldPersistTaps="handled">
          {/* Post type selector */}
          <Text style={m.label}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={m.typeRow}>
            {POST_TYPES.map((pt) => (
              <Pressable
                key={pt.id}
                onPress={() => setPostType(pt.id)}
                style={[m.typeChip, postType === pt.id && m.typeChipActive]}
              >
                <Text style={m.typeEmoji}>{pt.emoji}</Text>
                <Text style={[m.typeLabel, postType === pt.id && m.typeLabelActive]}>
                  {pt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Content */}
          <Text style={m.label}>What's on your mind?</Text>
          <TextInput
            style={m.textArea}
            placeholder="Share a wellness tip, achievement, or update with your team..."
            placeholderTextColor="#c4cdd8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
            maxLength={500}
          />
          <Text style={m.charCount}>{content.length}/500</Text>

          {/* Image URL */}
          <Text style={m.label}>Photo URL (optional)</Text>
          <View style={m.inputRow}>
            <Ionicons name="image-outline" size={17} color="#94a3b8" />
            <TextInput
              style={m.urlInput}
              placeholder="https://..."
              placeholderTextColor="#c4cdd8"
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            {imageUrl.trim().length > 0 && (
              <Pressable onPress={() => setImageUrl('')}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </Pressable>
            )}
          </View>

          {/* Preview */}
          {imageUrl.trim().length > 0 && (
            <Image
              source={{ uri: imageUrl.trim() }}
              style={m.imagePreview}
              resizeMode="cover"
            />
          )}

          {/* Tags */}
          <Text style={m.label}>Tags (comma-separated)</Text>
          <View style={m.inputRow}>
            <Ionicons name="pricetag-outline" size={17} color="#94a3b8" />
            <TextInput
              style={m.urlInput}
              placeholder="#MorningWalk, #BGC, #Wellness"
              placeholderTextColor="#c4cdd8"
              value={tags}
              onChangeText={setTags}
            />
          </View>

          {/* Tips */}
          <View style={m.tipBox}>
            <Ionicons name="bulb-outline" size={15} color="#3FE870" />
            <Text style={m.tipText}>
              Posts that earn 5+ reactions give you +50 pts bonus!
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const m = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#ffffff' },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: '#e2e8f0',
    alignSelf:       'center',
    marginTop:       10,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  closeBtn: {
    width:          36,
    height:         36,
    borderRadius:   10,
    backgroundColor:'#f8fafc',
    alignItems:     'center',
    justifyContent: 'center',
  },
  title:          { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  postBtn: {
    backgroundColor:   '#1a3a1a',
    borderRadius:      99,
    paddingHorizontal: 18,
    paddingVertical:   8,
  },
  postBtnDisabled: { backgroundColor: '#e2e8f0' },
  postBtnText:     { fontSize: 13, fontWeight: '800', color: '#ffffff' },

  scroll: { padding: 16, gap: 8, paddingBottom: 40 },
  label:  { fontSize: 12, fontWeight: '700', color: '#475569', letterSpacing: 0.3, marginBottom: 4, marginTop: 8 },

  typeRow:       { gap: 8, paddingBottom: 4 },
  typeChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    borderRadius:      99,
    borderWidth:       1.5,
    borderColor:       '#e2e8f0',
    backgroundColor:   '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical:   8,
  },
  typeChipActive: {
    borderColor:     '#3FE870',
    backgroundColor: '#f0fdf4',
  },
  typeEmoji:     { fontSize: 16 },
  typeLabel:     { fontSize: 13, fontWeight: '600', color: '#64748b' },
  typeLabelActive:{ color: '#16a34a', fontWeight: '700' },

  textArea: {
    borderWidth:       1,
    borderColor:       '#e2e8f0',
    borderRadius:      14,
    padding:           14,
    fontSize:          15,
    color:             '#0f172a',
    backgroundColor:   '#f8fafc',
    minHeight:         120,
    lineHeight:        22,
  },
  charCount: {
    fontSize:  11,
    color:     '#94a3b8',
    textAlign: 'right',
    marginTop: 4,
  },
  inputRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    borderWidth:       1,
    borderColor:       '#e2e8f0',
    borderRadius:      12,
    paddingHorizontal: 14,
    paddingVertical:   Platform.OS === 'ios' ? 13 : 10,
    backgroundColor:   '#f8fafc',
  },
  urlInput: {
    flex:      1,
    fontSize:  14,
    color:     '#0f172a',
    padding:   0,
  },
  imagePreview: {
    width:        '100%',
    height:       180,
    borderRadius: 12,
    marginTop:    8,
  },
  tipBox: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   '#f0fdf4',
    borderRadius:      10,
    padding:           12,
    borderWidth:       1,
    borderColor:       '#bbf7d0',
    marginTop:         12,
  },
  tipText: { flex: 1, fontSize: 12, color: '#15803d', lineHeight: 18 },
})

// ─────────────────────────────────────────────────────────────────────────────
// Feed header (ListHeaderComponent — stories + filter chips)
// ─────────────────────────────────────────────────────────────────────────────

function FeedHeader({
  activeFilter,
  onFilterChange,
  onAddPost,
}: {
  activeFilter:   string
  onFilterChange: (id: string) => void
  onAddPost:      () => void
}) {
  return (
    <View>
      {/* Stories row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.storiesScroll}
        contentContainerStyle={styles.storiesRow}
      >
        {/* Your Story → opens Add Post */}
        <Pressable style={styles.storyItem} onPress={onAddPost}>
          <View style={[styles.storyAvatar, styles.storyAvatarAdd]}>
            <Ionicons name="add" size={22} color="#3FE870" />
          </View>
          <Text style={styles.storyLabel}>Your Story</Text>
        </Pressable>

        {['Maria S.', 'Carlo R.', 'Pia Cruz', 'Team BDO'].map((name, i) => (
          <View key={name} style={styles.storyItem}>
            <View style={[styles.storyAvatar, { backgroundColor: ['#1a3a1a','#260A2F','#1a2a3a','#2a1500'][i] }]}>
              <Text style={styles.storyAvatarText}>{name.charAt(0)}</Text>
            </View>
            <Text style={styles.storyLabel}>{name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterStrip}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => onFilterChange(f.id)}
            style={[
              styles.filterChip,
              activeFilter === f.id && styles.filterChipActive,
            ]}
          >
            <Text style={[
              styles.filterChipText,
              activeFilter === f.id && styles.filterChipTextActive,
            ]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyFeed({ onAddPost }: { onAddPost: () => void }) {
  return (
    <Pressable onPress={onAddPost} style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="camera-outline" size={28} color="#94a3b8" />
      </View>
      <Text style={styles.emptyTitle}>Be the first to post!</Text>
      <Text style={styles.emptyBody}>
        Share a tip, recipe, or achievement with your team.
      </Text>
      <View style={styles.emptyBtn}>
        <Text style={styles.emptyBtnText}>+ Add Post</Text>
      </View>
    </Pressable>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Feed screen
// ─────────────────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const { user, isLoading: authLoading } = useAuth()

  const effectiveOrg = user?.org_id || DEMO_ORG

  const [posts,          setPosts]          = useState<CommunityPost[]>([])
  const [reactionCounts, setReactionCounts] = useState<Record<string, ReactionCounts>>({})
  const [myReactions,    setMyReactions]    = useState<Record<string, string[]>>({})
  const [isLoading,      setIsLoading]      = useState(true)
  const [isRefreshing,   setIsRefreshing]   = useState(false)
  const [reactPending,   setReactPending]   = useState<string | null>(null)
  const [activeFilter,   setActiveFilter]   = useState('all')
  const [showAddPost,    setShowAddPost]    = useState(false)

  // ── Load posts ─────────────────────────────────────────────────────────────
  const loadPosts = useCallback(async (refresh = false) => {
    if (!user) return
    if (refresh) setIsRefreshing(true)
    else         setIsLoading(true)

    try {
      let query = supabase
        .from('community_posts')
        .select('*, users(full_name, wellness_rank, avatar_url, department)')
        .order('created_at', { ascending: false })
        .limit(30)

      if (effectiveOrg !== DEMO_ORG) {
        query = query.eq('org_id', effectiveOrg)
      }
      if (activeFilter !== 'all') {
        query = query.eq('post_type', activeFilter)
      }

      const { data: postsData } = await query
      const fetched = (postsData ?? []) as CommunityPost[]
      setPosts(fetched)

      if (fetched.length === 0) return

      const ids = fetched.map((p) => p.id)
      const { data: reactions } = await supabase
        .from('post_reactions')
        .select('post_id, reaction_type, user_id')
        .in('post_id', ids)

      const counts: Record<string, ReactionCounts> = {}
      const mine:   Record<string, string[]>       = {}

      ids.forEach((id) => { counts[id] = { like: 0, helpful: 0, inspiring: 0 } })
      reactions?.forEach((r: { post_id: string; reaction_type: string; user_id: string }) => {
        if (counts[r.post_id]) {
          counts[r.post_id][r.reaction_type as keyof ReactionCounts]++
        }
        if (r.user_id === user.id) {
          mine[r.post_id] = [...(mine[r.post_id] ?? []), r.reaction_type]
        }
      })

      setReactionCounts(counts)
      setMyReactions(mine)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [user, effectiveOrg, activeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authLoading) loadPosts()
  }, [authLoading, activeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── React handler ──────────────────────────────────────────────────────────
  const handleReact = async (postId: string, type: 'like' | 'helpful' | 'inspiring') => {
    if (!user) return
    const key = `${postId}-${type}`
    if (reactPending === key) return
    setReactPending(key)

    const alreadyReacted = myReactions[postId]?.includes(type)

    setReactionCounts((prev) => ({
      ...prev,
      [postId]: {
        ...(prev[postId] ?? { like: 0, helpful: 0, inspiring: 0 }),
        [type]: (prev[postId]?.[type] ?? 0) + (alreadyReacted ? -1 : 1),
      },
    }))
    setMyReactions((prev) => ({
      ...prev,
      [postId]: alreadyReacted
        ? (prev[postId] ?? []).filter((r) => r !== type)
        : [...(prev[postId] ?? []), type],
    }))

    try {
      if (alreadyReacted) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('reaction_type', type)
      } else {
        await supabase.from('post_reactions').insert({
          post_id:       postId,
          user_id:       user.id,
          org_id:        effectiveOrg,
          reaction_type: type,
        })

        const { count } = await supabase
          .from('post_reactions')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId)

        if ((count ?? 0) >= 5) {
          const { data: awarded } = await supabase
            .from('community_posts')
            .update({ points_awarded: 50 })
            .eq('id', postId)
            .eq('points_awarded', 0)
            .select('user_id')
            .maybeSingle()

          if (awarded?.user_id) {
            await supabase.from('points_transactions').insert({
              user_id:          awarded.user_id,
              org_id:           effectiveOrg,
              points:           50,
              transaction_type: 'earned',
              description:      'Community post earned 5+ reactions',
              reference_id:     postId,
            })
            const { data: pts } = await supabase
              .from('user_points')
              .select('total_points, available_points')
              .eq('user_id', awarded.user_id)
              .maybeSingle()
            if (pts) {
              await supabase.from('user_points')
                .update({
                  total_points:     ((pts as any).total_points ?? 0) + 50,
                  available_points: ((pts as any).available_points ?? 0) + 50,
                })
                .eq('user_id', awarded.user_id)
            }
            setPosts((prev) =>
              prev.map((p) => p.id === postId ? { ...p, points_awarded: 50 } : p)
            )
          }
        }
      }
    } catch {
      setReactionCounts((prev) => ({
        ...prev,
        [postId]: {
          ...(prev[postId] ?? { like: 0, helpful: 0, inspiring: 0 }),
          [type]: (prev[postId]?.[type] ?? 0) + (alreadyReacted ? 1 : -1),
        },
      }))
      setMyReactions((prev) => ({
        ...prev,
        [postId]: alreadyReacted
          ? [...(prev[postId] ?? []), type]
          : (prev[postId] ?? []).filter((r) => r !== type),
      }))
    }

    setReactPending(null)
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <SafeAreaView style={styles.centerFill}>
        <ActivityIndicator size="large" color="#3FE870" />
      </SafeAreaView>
    )
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.centerFill}>
        <Ionicons name="lock-closed-outline" size={40} color="#94a3b8" />
        <Text style={styles.authGateText}>Please sign in to view Vitality.</Text>
      </SafeAreaView>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>

      {/* ── Screen header ── */}
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>Vitality Feed 🌱</Text>
          <Text style={styles.screenSub}>What's your team up to?</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerIcon}>
            <Ionicons name="search-outline" size={20} color="#0f172a" />
          </Pressable>
          <Pressable style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={20} color="#0f172a" />
            <View style={styles.notifDot} />
          </Pressable>
        </View>
      </View>

      {/* ── FlatList with stories + filter chips + posts ── */}
      <FlatList<CommunityPost>
        data={isLoading ? [] : posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadPosts(true)}
            tintColor="#3FE870"
          />
        }
        ListHeaderComponent={
          <FeedHeader
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onAddPost={() => setShowAddPost(true)}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonBlock}>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </View>
          ) : (
            <EmptyFeed onAddPost={() => setShowAddPost(true)} />
          )
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            counts={reactionCounts[item.id] ?? { like: 0, helpful: 0, inspiring: 0 }}
            myReactions={myReactions[item.id] ?? []}
            onReact={handleReact}
          />
        )}
      />

      {/* ── FAB: Add Post ── */}
      <Pressable
        onPress={() => setShowAddPost(true)}
        style={({ pressed }) => [
          styles.fab,
          pressed && { transform: [{ scale: 0.93 }], opacity: 0.9 },
        ]}
      >
        <Ionicons name="add" size={26} color="#0d2210" />
        <Text style={styles.fabText}>Add Post</Text>
      </Pressable>

      {/* ── Add Post Modal ── */}
      {user && (
        <AddPostModal
          visible={showAddPost}
          onClose={() => setShowAddPost(false)}
          onPosted={() => loadPosts(true)}
          userId={user.id}
          orgId={user.org_id || DEMO_ORG}
        />
      )}
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

  // Screen header
  screenHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 18,
    paddingTop:        12,
    paddingBottom:     10,
    backgroundColor:   '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  screenTitle: {
    fontSize:   20,
    fontWeight: '900',
    color:      '#0f172a',
  },
  screenSub: {
    fontSize:  12,
    color:     '#94a3b8',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  headerIcon: {
    width:           36,
    height:          36,
    borderRadius:    10,
    backgroundColor: '#f8fafc',
    alignItems:      'center',
    justifyContent:  'center',
  },
  notifDot: {
    position:        'absolute',
    top:             6,
    right:           6,
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: '#3FE870',
    borderWidth:     1.5,
    borderColor:     '#f8fafc',
  },

  // Stories
  storiesScroll: {
    backgroundColor: '#ffffff',
    height:          101,
  },
  storiesRow: {
    paddingHorizontal: 14,
    paddingTop:        12,
    gap:               14,
    alignItems:        'flex-start',
  },
  storyItem:   { alignItems: 'center', gap: 5, width: 66 },
  storyAvatar: {
    width:          54,
    height:         54,
    borderRadius:   27,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    2,
    borderColor:    '#3FE870',
    backgroundColor:'#f0fdf4',
  },
  storyAvatarAdd: {
    backgroundColor: '#ffffff',
    borderStyle:     'dashed',
    borderColor:     '#3FE870',
  },
  storyAvatarText: {
    fontSize:   18,
    fontWeight: '800',
    color:      '#ffffff',
  },
  storyLabel: {
    fontSize:   10,
    fontWeight: '600',
    color:      '#475569',
    textAlign:  'center',
    lineHeight: 14,
  },

  centerFill: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            12,
  },
  authGateText: {
    fontSize:  14,
    color:     '#94a3b8',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop:        8,
    paddingBottom:     100,
  },

  // Filter chips
  filterStrip: {
    gap:               8,
    paddingHorizontal: 14,
    paddingBottom:     12,
    paddingTop:        8,
    backgroundColor:   '#ffffff',
  },
  filterChip: {
    borderRadius:      99,
    backgroundColor:   '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical:   6,
  },
  filterChipActive: {
    backgroundColor: '#3FE870',
  },
  filterChipText: {
    fontSize:   12,
    fontWeight: '600',
    color:      '#64748b',
  },
  filterChipTextActive: {
    color:      '#0d2210',
    fontWeight: '800',
  },

  // Skeleton
  skeletonBlock: {
    paddingTop: 4,
  },

  // Empty state
  emptyContainer: {
    alignItems:        'center',
    justifyContent:    'center',
    marginTop:         24,
    marginHorizontal:  8,
    borderRadius:      20,
    borderWidth:       2,
    borderColor:       '#e2e8f0',
    borderStyle:       'dashed',
    backgroundColor:   '#ffffff',
    paddingVertical:   48,
    paddingHorizontal: 24,
    gap:               10,
  },
  emptyIcon: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: '#f1f5f9',
    alignItems:      'center',
    justifyContent:  'center',
  },
  emptyTitle: {
    fontSize:   17,
    fontWeight: '800',
    color:      '#334155',
  },
  emptyBody: {
    fontSize:   13,
    color:      '#94a3b8',
    textAlign:  'center',
    lineHeight: 19,
  },
  emptyBtn: {
    backgroundColor:   '#3FE870',
    borderRadius:      99,
    paddingHorizontal: 18,
    paddingVertical:   9,
    marginTop:         4,
  },
  emptyBtnText: {
    fontSize:   13,
    fontWeight: '800',
    color:      '#0d2210',
  },

  // FAB
  fab: {
    position:          'absolute',
    bottom:            Platform.OS === 'ios' ? 32 : 20,
    right:             20,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   '#3FE870',
    borderRadius:      99,
    paddingHorizontal: 20,
    paddingVertical:   13,
    shadowColor:       '#3FE870',
    shadowOffset:      { width: 0, height: 4 },
    shadowOpacity:     0.4,
    shadowRadius:      10,
    elevation:         8,
  },
  fabText: {
    fontSize:   14,
    fontWeight: '800',
    color:      '#0d2210',
  },
})
