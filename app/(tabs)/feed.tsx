/**
 * Social Vitality Feed
 *
 * - Header: "Vitality Feed 🌱" + search + bell
 * - Stories row
 * - Filter chips
 * - FlatList of PostCards with images
 * - Facebook-style "Add Post" Modal WITH Native Camera & Gallery
 */

import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker' // <-- ADDED

import PostCard, {
  CommunityPost,
  ReactionCounts,
} from '@/components/vitality/post-card'
import PostSkeleton from '@/components/vitality/post-skeleton'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

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

const FEELINGS = [
  { id: 'happy', emoji: '😊', label: 'happy' },
  { id: 'pumped', emoji: '🚀', label: 'pumped' },
  { id: 'tired', emoji: '😴', label: 'tired' },
  { id: 'strong', emoji: '💪', label: 'strong' },
  { id: 'hungry', emoji: '🤤', label: 'hungry' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Facebook-style Add Post Modal (With Camera/Gallery)
// ─────────────────────────────────────────────────────────────────────────────

function AddPostModal({
  visible,
  onClose,
  onPosted,
  user,
}: {
  visible:  boolean
  onClose:  () => void
  onPosted: () => void
  user:     any
}) {
  const [postType,  setPostType]  = useState('activity')
  const [feeling,   setFeeling]   = useState<string | null>(null)
  const [content,   setContent]   = useState('')
  const [localImageUri, setLocalImageUri] = useState<string | null>(null)
  const [tags,      setTags]      = useState('')
  const [loading,   setLoading]   = useState(false)

  const reset = () => {
    setPostType('activity')
    setFeeling(null)
    setContent('')
    setLocalImageUri(null)
    setTags('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // ── Image Picker Functions ──
  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri)
      setPostType('photo') // Auto-switch category to photo
    }
  }

  const takePhotoWithCamera = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take a photo.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri)
      setPostType('photo') // Auto-switch category to photo
    }
  }

  // ── Post Submission ──
  const handlePost = async () => {
    if (!content.trim() && !localImageUri) {
      Alert.alert('Empty post', 'Write something or add a photo to share.')
      return
    }
    
    setLoading(true)
    
    try {
      let finalImageUrl = null

      // If there is an image, upload to Supabase Storage first
      if (localImageUri) {
        // NOTE: This assumes you have a Supabase bucket named 'post-images'.
        // React Native uses form data to upload files from local URIs.
        const ext = localImageUri.substring(localImageUri.lastIndexOf('.') + 1)
        const fileName = `${user.id}-${Date.now()}.${ext}`
        
        const formData = new FormData()
        formData.append('file', {
          uri: localImageUri,
          name: fileName,
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        } as any)

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-images') // Make sure this bucket exists and is public!
          .upload(fileName, formData)

        if (uploadError) {
          throw new Error('Failed to upload image.')
        }

        // Get the public URL for the newly uploaded image
        const { data: publicUrlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName)
          
        finalImageUrl = publicUrlData.publicUrl
      }

      // Format tags
      const tagList = tags
        .split(/[,#\s]+/)
        .map((t) => t.replace('#', '').trim())
        .filter(Boolean)

      // Insert into database
      const { error } = await supabase.from('community_posts').insert({
        user_id:        user.id,
        org_id:         user.org_id || DEMO_ORG,
        post_type:      postType,
        content:        content.trim(),
        image_url:      finalImageUrl, // Using the hosted URL, not the local file URI
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
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const authorName = user?.full_name?.split(' ')[0] ?? 'User'
  const initial = authorName.charAt(0).toUpperCase()
  const feelingObj = FEELINGS.find(f => f.id === feeling)

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
        {/* Header */}
        <View style={m.header}>
          <Pressable onPress={handleClose} style={m.headerIconBtn}>
            <Ionicons name="close" size={24} color={COLORS.navy} />
          </Pressable>
          <Text style={m.title}>Create Post</Text>
          <Pressable
            onPress={handlePost}
            disabled={loading || (!content.trim() && !localImageUri)}
            style={({ pressed }) => [
              m.postBtn,
              (!content.trim() && !localImageUri || loading) && m.postBtnDisabled,
              pressed && { opacity: 0.8 },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={[m.postBtnText, (!content.trim() && !localImageUri) && m.postBtnTextDisabled]}>Post</Text>
            )}
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={m.scrollContent}>
          
          {/* User Info & Feeling Row */}
          <View style={m.userRow}>
            <View style={m.avatar}>
              <Text style={m.avatarText}>{initial}</Text>
            </View>
            <View style={m.userInfoText}>
              <Text style={m.userName}>
                {authorName} 
                {feelingObj && <Text style={m.feelingText}> is feeling {feelingObj.emoji} {feelingObj.label}</Text>}
              </Text>
              
              {/* Privacy / Type Tag */}
              <View style={m.privacyTag}>
                <Ionicons name="people" size={10} color={COLORS.textSecondary} />
                <Text style={m.privacyText}>All Organization</Text>
              </View>
            </View>
          </View>

          {/* Feeling Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={m.feelingScroll}>
            {FEELINGS.map(f => (
              <Pressable 
                key={f.id} 
                onPress={() => setFeeling(f.id === feeling ? null : f.id)}
                style={[m.feelingChip, feeling === f.id && m.feelingChipActive]}
              >
                <Text style={m.feelingEmoji}>{f.emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Main Text Input */}
          <TextInput
            style={m.textArea}
            placeholder={`What's on your mind, ${authorName}?`}
            placeholderTextColor={COLORS.disabledText}
            multiline
            autoFocus
            value={content}
            onChangeText={setContent}
          />

          {/* Image Preview (Now Local URI) */}
          {localImageUri && (
            <View style={m.imageSection}>
              <View style={m.imageWrapper}>
                <Image source={{ uri: localImageUri }} style={m.imagePreview} resizeMode="cover" />
                <Pressable style={m.removeImageBtn} onPress={() => setLocalImageUri(null)}>
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </Pressable>
              </View>
            </View>
          )}

        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={m.bottomBar}>
          
          {/* Post Type Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={m.bottomTypesScroll} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
            {POST_TYPES.map((pt) => (
              <Pressable
                key={pt.id}
                onPress={() => setPostType(pt.id)}
                style={[m.typeChip, postType === pt.id && m.typeChipActive]}
              >
                <Text style={m.typeEmoji}>{pt.emoji}</Text>
                <Text style={[m.typeLabel, postType === pt.id && m.typeLabelActive]}>{pt.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={m.actionRow}>
            <Text style={m.actionLabel}>Add to your post</Text>
            <View style={m.actionIcons}>
              {/* Photo Library */}
              <Pressable style={m.actionBtn} onPress={pickImageFromGallery}>
                <Ionicons name="images" size={24} color={COLORS.green} />
              </Pressable>
              {/* Camera */}
              <Pressable style={m.actionBtn} onPress={takePhotoWithCamera}>
                <Ionicons name="camera" size={26} color={COLORS.teal} />
              </Pressable>
              {/* UI Placeholders */}
              <Pressable style={m.actionBtn}>
                <Ionicons name="person-add" size={22} color={COLORS.purple} />
              </Pressable>
              <Pressable style={m.actionBtn}>
                <Ionicons name="location" size={22} color={COLORS.orangeDark} />
              </Pressable>
            </View>
          </View>
        </View>

      </KeyboardAvoidingView>
    </Modal>
  )
}

const m = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.white },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIconBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  postBtn: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  postBtnDisabled: { backgroundColor: COLORS.bgGray },
  postBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  postBtnTextDisabled: { color: COLORS.disabledText },

  scrollContent: { padding: 16, paddingBottom: 40 },
  
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.teal,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  userInfoText: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.navy, lineHeight: 20 },
  feelingText: { fontWeight: '400', color: COLORS.textSecondary },
  privacyTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 2,
  },
  privacyText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },

  feelingScroll: { gap: 8, marginBottom: 16 },
  feelingChip: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bgGray,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  feelingChipActive: { backgroundColor: COLORS.lightTeal, borderColor: COLORS.teal },
  feelingEmoji: { fontSize: 18 },

  textArea: {
    fontSize: 18,
    color: COLORS.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },

  imageSection: { marginBottom: 20 },
  imageWrapper: { width: '100%', position: 'relative', borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 300 },
  removeImageBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },

  bottomBar: {
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  bottomTypesScroll: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.bgGray },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, backgroundColor: COLORS.bgGray,
  },
  typeChipActive: { backgroundColor: COLORS.navy },
  typeEmoji: { fontSize: 14 },
  typeLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  typeLabelActive: { color: COLORS.white },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12,
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  actionIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionBtn: { padding: 4 },
})

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen Component (Unchanged logic, utilizing updated modal)
// ─────────────────────────────────────────────────────────────────────────────

// [The rest of your FeedHeader, EmptyFeed, FeedScreen, and styles remain exactly the same as previously generated]

function FeedHeader({ activeFilter, onFilterChange, onAddPost }: any) {
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll} contentContainerStyle={styles.storiesRow}>
        <Pressable style={styles.storyItem} onPress={onAddPost}>
          <View style={[styles.storyAvatar, styles.storyAvatarAdd]}>
            <Ionicons name="add" size={22} color={COLORS.teal} />
          </View>
          <Text style={styles.storyLabel}>Your Story</Text>
        </Pressable>
        {['Maria S.', 'Carlo R.', 'Pia Cruz', 'Team BDO'].map((name, i) => (
          <View key={name} style={styles.storyItem}>
            <View style={[styles.storyAvatar, { backgroundColor: [COLORS.navy, COLORS.purple, COLORS.teal, COLORS.orangeDark][i % 4] }]}>
              <Text style={styles.storyAvatarText}>{name.charAt(0)}</Text>
            </View>
            <Text style={styles.storyLabel}>{name}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterStrip}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => onFilterChange(f.id)}
            style={[styles.filterChip, activeFilter === f.id && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, activeFilter === f.id && styles.filterChipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

function EmptyFeed({ onAddPost }: { onAddPost: () => void }) {
  return (
    <Pressable onPress={onAddPost} style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="camera-outline" size={28} color={COLORS.disabledText} />
      </View>
      <Text style={styles.emptyTitle}>Be the first to post!</Text>
      <Text style={styles.emptyBody}>Share a tip, recipe, or achievement with your team.</Text>
      <View style={styles.emptyBtn}>
        <Text style={styles.emptyBtnText}>+ Add Post</Text>
      </View>
    </Pressable>
  )
}

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

      if (effectiveOrg !== DEMO_ORG) query = query.eq('org_id', effectiveOrg)
      if (activeFilter !== 'all') query = query.eq('post_type', activeFilter)

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
      reactions?.forEach((r: any) => {
        if (counts[r.post_id]) counts[r.post_id][r.reaction_type as keyof ReactionCounts]++
        if (r.user_id === user.id) mine[r.post_id] = [...(mine[r.post_id] ?? []), r.reaction_type]
      })

      setReactionCounts(counts)
      setMyReactions(mine)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [user, effectiveOrg, activeFilter])

  useEffect(() => {
    if (!authLoading) loadPosts()
  }, [authLoading, activeFilter])

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
      [postId]: alreadyReacted ? (prev[postId] ?? []).filter((r) => r !== type) : [...(prev[postId] ?? []), type],
    }))

    try {
      if (alreadyReacted) {
        await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', user.id).eq('reaction_type', type)
      } else {
        await supabase.from('post_reactions').insert({ post_id: postId, user_id: user.id, org_id: effectiveOrg, reaction_type: type })
      }
    } catch {
      // Logic revert handled here if needed
    }
    setReactPending(null)
  }

  if (authLoading) return <SafeAreaView style={styles.centerFill}><ActivityIndicator size="large" color={COLORS.teal} /></SafeAreaView>
  if (!user) return <SafeAreaView style={styles.centerFill}><Ionicons name="lock-closed-outline" size={40} color={COLORS.disabledText} /><Text style={styles.authGateText}>Please sign in.</Text></SafeAreaView>

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>Vitality Feed 🌱</Text>
          <Text style={styles.screenSub}>What's your team up to?</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerIcon}><Ionicons name="search-outline" size={20} color={COLORS.white} /></Pressable>
          <Pressable style={styles.headerIcon}><Ionicons name="notifications-outline" size={20} color={COLORS.white} /><View style={styles.notifDot} /></Pressable>
        </View>
      </View>

      <FlatList<CommunityPost>
        style={{ backgroundColor: COLORS.bgGray }}
        data={isLoading ? [] : posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadPosts(true)} tintColor={COLORS.teal} />}
        ListHeaderComponent={<FeedHeader activeFilter={activeFilter} onFilterChange={setActiveFilter} onAddPost={() => setShowAddPost(true)} />}
        ListEmptyComponent={isLoading ? <View style={styles.skeletonBlock}><PostSkeleton /><PostSkeleton /></View> : <EmptyFeed onAddPost={() => setShowAddPost(true)} />}
        renderItem={({ item }) => <PostCard post={item} counts={reactionCounts[item.id] ?? { like: 0, helpful: 0, inspiring: 0 }} myReactions={myReactions[item.id] ?? []} onReact={handleReact} />}
      />

      <Pressable onPress={() => setShowAddPost(true)} style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.93 }], opacity: 0.9 }]}>
        <Ionicons name="add" size={26} color={COLORS.white} />
        <Text style={styles.fabText}>Add Post</Text>
      </Pressable>

      {user && (
        <AddPostModal visible={showAddPost} onClose={() => setShowAddPost(false)} onPosted={() => loadPosts(true)} user={user} />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.navy },
  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10, backgroundColor: COLORS.navy },
  screenTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  screenSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.orangeDark, borderWidth: 1.5, borderColor: COLORS.navy },
  storiesScroll: { backgroundColor: COLORS.white, height: 101 },
  storiesRow: { paddingHorizontal: 14, paddingTop: 12, gap: 14, alignItems: 'flex-start' },
  storyItem: { alignItems: 'center', gap: 5, width: 66 },
  storyAvatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.teal, backgroundColor: COLORS.lightTeal },
  storyAvatarAdd: { backgroundColor: COLORS.white, borderStyle: 'dashed', borderColor: COLORS.teal },
  storyAvatarText: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  storyLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center', lineHeight: 14 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  authGateText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  listContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 100 },
  filterStrip: { gap: 8, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 8, backgroundColor: COLORS.white },
  filterChip: { borderRadius: 99, backgroundColor: COLORS.bgGray, paddingHorizontal: 14, paddingVertical: 6 },
  filterChipActive: { backgroundColor: COLORS.teal },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.white, fontWeight: '800' },
  skeletonBlock: { paddingTop: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 24, marginHorizontal: 8, borderRadius: 20, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', backgroundColor: COLORS.white, paddingVertical: 48, paddingHorizontal: 24, gap: 10 },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.bgGray, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  emptyBody: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19 },
  emptyBtn: { backgroundColor: COLORS.teal, borderRadius: 99, paddingHorizontal: 18, paddingVertical: 9, marginTop: 4 },
  emptyBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.white },
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 32 : 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.teal, borderRadius: 99, paddingHorizontal: 20, paddingVertical: 13, shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  fabText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
})