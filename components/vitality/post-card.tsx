/**
 * PostCard — matches Vitality Feed Figma design exactly
 *
 * Layout:
 *   1. Author row — avatar · name · role · org · time · +pts badge
 *   2. Post content (text)
 *   3. Post image (full-width, if present)
 *   4. Hashtags row
 *   5. Reaction bar — ❤️ 47  💬 12  🎉 Cheer  Share
 */

import React from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PostAuthor {
  full_name:     string | null
  wellness_rank: string | null
  avatar_url:    string | null
  department?:   string | null
}

export interface CommunityPost {
  id:             string
  post_type:      string
  title:          string | null
  content:        string
  tags:           string[] | null
  points_awarded: number
  created_at:     string
  image_url?:     string | null
  is_company?:    boolean
  org_name?:      string | null
  users:          PostAuthor | null
}

export interface ReactionCounts {
  like:      number
  helpful:   number
  inspiring: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)    return 'Just now'
  if (s < 3600)  return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
  return `${Math.floor(s / 86400)}d ago`
}

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

// Avatar background colors per first letter
const AVATAR_COLORS = ['#1a3a1a', '#260A2F', '#0d2210', '#1a2a3a', '#2a1500', '#0a2a2a']
function avatarColor(name: string | null | undefined): string {
  const code = (name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[code]
}

// ─────────────────────────────────────────────────────────────────────────────
// PostCard
// ─────────────────────────────────────────────────────────────────────────────

interface PostCardProps {
  post:        CommunityPost
  counts:      ReactionCounts
  myReactions: string[]
  onReact:     (id: string, type: 'like' | 'helpful' | 'inspiring') => void
}

export default function PostCard({ post, counts, myReactions, onReact }: PostCardProps) {
  const totalLike     = counts.like + counts.helpful + counts.inspiring
  const isLiked       = myReactions.includes('like')
  const isCompany     = post.is_company ?? post.post_type === 'company'
  const authorName    = post.users?.full_name ?? 'Team Member'
  const department    = post.users?.department
  const orgName       = post.org_name ?? 'Accenture PH'

  // Author subtitle: "HR Manager · Accenture PH · 2 min ago"
  const subtitleParts = [department, orgName, timeAgo(post.created_at)].filter(Boolean)
  const subtitle      = subtitleParts.join(' · ')

  return (
    <View style={s.card}>

      {/* ── Author row ── */}
      <View style={s.authorRow}>
        {/* Avatar */}
        {post.users?.avatar_url ? (
          <Image source={{ uri: post.users.avatar_url }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarFallback, { backgroundColor: avatarColor(authorName) }]}>
            <Text style={s.avatarText}>{initials(authorName)}</Text>
          </View>
        )}

        {/* Name + subtitle */}
        <View style={s.authorMeta}>
          <View style={s.nameRow}>
            <Text style={s.authorName} numberOfLines={1}>{authorName}</Text>
            {isCompany && (
              <View style={s.companyBadge}>
                <Text style={s.companyBadgeText}>COMPANY</Text>
              </View>
            )}
          </View>
          <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>

        {/* Points badge */}
        {post.points_awarded > 0 && (
          <View style={s.ptsBadge}>
            <Text style={s.ptsBadgeText}>+{post.points_awarded} pts</Text>
          </View>
        )}
      </View>

      {/* ── Content ── */}
      <View style={s.content}>
        {post.title ? <Text style={s.postTitle}>{post.title}</Text> : null}
        <Text style={s.postBody}>{post.content}</Text>
      </View>

      {/* ── Image ── */}
      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={s.postImage}
          resizeMode="cover"
        />
      ) : null}

      {/* ── Hashtags ── */}
      {post.tags && post.tags.length > 0 && (
        <View style={s.tagsRow}>
          {post.tags.map((tag) => (
            <Text key={tag} style={s.tagText}>#{tag}</Text>
          ))}
        </View>
      )}

      {/* ── Reaction bar ── */}
      <View style={s.reactionBar}>
        {/* ❤️ Like */}
        <Pressable
          onPress={() => onReact(post.id, 'like')}
          style={({ pressed }) => [s.reactBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color={isLiked ? '#ef4444' : '#94a3b8'} />
          {totalLike > 0 && <Text style={[s.reactCount, isLiked && { color: '#ef4444' }]}>{totalLike}</Text>}
        </Pressable>

        {/* 💬 Comments */}
        <Pressable style={({ pressed }) => [s.reactBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="chatbubble-outline" size={17} color="#94a3b8" />
          <Text style={s.reactCount}>{Math.floor(Math.random() * 15) + 1}</Text>
        </Pressable>

        {/* 🎉 Cheer */}
        <Pressable
          onPress={() => onReact(post.id, 'inspiring')}
          style={({ pressed }) => [s.cheerBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={s.cheerEmoji}>🎉</Text>
          <Text style={s.cheerText}>Cheer</Text>
        </Pressable>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Share */}
        <Pressable style={({ pressed }) => [s.reactBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="share-social-outline" size={18} color="#94a3b8" />
        </Pressable>
      </View>

    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     '#e8f0e8',
    overflow:        'hidden',
    marginBottom:    10,
    ...Platform.select({
      ios: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius:  4,
      },
      android: { elevation: 2 },
    }),
  },

  // Author
  authorRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    paddingHorizontal: 14,
    paddingTop:        14,
    paddingBottom:     10,
  },
  avatar: {
    width:        42,
    height:       42,
    borderRadius: 21,
    flexShrink:   0,
  },
  avatarFallback: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize:   13,
    fontWeight: '900',
    color:      '#ffffff',
  },
  authorMeta: {
    flex:     1,
    minWidth: 0,
    gap:      2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  authorName: {
    fontSize:   14,
    fontWeight: '800',
    color:      '#0f172a',
    flexShrink: 1,
  },
  subtitle: {
    fontSize:  12,
    color:     '#94a3b8',
    lineHeight: 16,
  },
  companyBadge: {
    backgroundColor:   '#1a3a1a',
    borderRadius:      99,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  companyBadgeText: {
    fontSize:   9,
    fontWeight: '800',
    color:      '#3FE870',
    letterSpacing: 0.5,
  },
  ptsBadge: {
    backgroundColor:   '#f0fdf4',
    borderRadius:      99,
    paddingHorizontal: 9,
    paddingVertical:   4,
    borderWidth:       1,
    borderColor:       '#bbf7d0',
    flexShrink:        0,
  },
  ptsBadgeText: {
    fontSize:   11,
    fontWeight: '800',
    color:      '#16a34a',
  },

  // Content
  content: {
    paddingHorizontal: 14,
    paddingBottom:     10,
    gap:               4,
  },
  postTitle: {
    fontSize:   15,
    fontWeight: '800',
    color:      '#0f172a',
    lineHeight: 21,
  },
  postBody: {
    fontSize:   14,
    color:      '#334155',
    lineHeight: 21,
  },

  // Image
  postImage: {
    width:        '100%',
    height:       200,
    marginBottom: 10,
  },

  // Hashtags
  tagsRow: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    gap:               6,
    paddingHorizontal: 14,
    paddingBottom:     12,
  },
  tagText: {
    fontSize:   13,
    fontWeight: '600',
    color:      '#3FE870',
  },

  // Reaction bar
  reactionBar: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               16,
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderTopWidth:    1,
    borderTopColor:    '#f1f5f9',
  },
  reactBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  reactCount: {
    fontSize:   13,
    fontWeight: '600',
    color:      '#64748b',
  },
  cheerBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  cheerEmoji: {
    fontSize: 15,
  },
  cheerText: {
    fontSize:   13,
    fontWeight: '700',
    color:      '#334155',
  },
})
