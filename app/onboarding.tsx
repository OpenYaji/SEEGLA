/**
 * Onboarding — 3-slide carousel
 *
 * Slide 1 (Green):  Track Your Wellness Journey
 * Slide 2 (Purple): Grow Together as a Team
 * Slide 3 (Dark):   Healthy Habits Earn Real Perks
 *
 * Each slide has a category pill, image area, 2 stat cards, and Next/CTA button.
 */

import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  ListRenderItem,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = Dimensions.get('window')

// ─────────────────────────────────────────────────────────────────────────────
// Slide definitions
// ─────────────────────────────────────────────────────────────────────────────

interface StatCard {
  icon:  string   // emoji
  value: string
  label: string
}

interface Slide {
  id:          string
  bg:          string          // background color
  pillText:    string
  pillColor:   string
  pillBg:      string
  title:       string
  body:        string
  imageIcon:   keyof typeof Ionicons.glyphMap
  imageIconColor: string
  imageBg:     string
  stats:       StatCard[]
  btnText:     string
  btnColor:    string
  btnTextColor:string
  dotColor:    string
  skipColor:   string
}

const SLIDES: Slide[] = [
  {
    id:           '1',
    bg:           '#0d2210',
    pillText:     'Health Tracking',
    pillColor:    '#3FE870',
    pillBg:       'rgba(63,232,112,0.15)',
    title:        'Track Your\nWellness Journey',
    body:         'Monitor steps, sleep, hydration, and mental health — all in one beautiful dashboard built for your workday.',
    imageIcon:    'footsteps-outline',
    imageIconColor: '#3FE870',
    imageBg:      'rgba(63,232,112,0.12)',
    stats: [
      { icon: '🏃', value: '8,420', label: 'Steps Today' },
      { icon: '⭐', value: '87',    label: 'Wellness Score' },
    ],
    btnText:      'Next →',
    btnColor:     '#3FE870',
    btnTextColor: '#0d2210',
    dotColor:     '#3FE870',
    skipColor:    'rgba(255,255,255,0.45)',
  },
  {
    id:           '2',
    bg:           '#260A2F',
    pillText:     'Team Vitality',
    pillColor:    '#FFC091',
    pillBg:       'rgba(255,192,145,0.18)',
    title:        'Grow Together\nas a Team',
    body:         'Join company challenges, cheer on teammates, and build a culture of wellness across your entire organization.',
    imageIcon:    'people-outline',
    imageIconColor: '#FFC091',
    imageBg:      'rgba(255,192,145,0.12)',
    stats: [
      { icon: '👥', value: '124', label: 'Active Colleagues' },
      { icon: '🔥', value: '14d', label: 'Team Streak' },
    ],
    btnText:      'Next →',
    btnColor:     '#FFC091',
    btnTextColor: '#260A2F',
    dotColor:     '#FFC091',
    skipColor:    'rgba(255,255,255,0.4)',
  },
  {
    id:           '3',
    bg:           '#1a1208',
    pillText:     'Earn Rewards',
    pillColor:    '#FFC091',
    pillBg:       'rgba(255,192,145,0.15)',
    title:        'Healthy Habits\nEarn Real Perks',
    body:         'Convert your wellness points into GCash, Grab vouchers, and exclusive Filipino brand rewards.\nMag-ingat, mag-earn!',
    imageIcon:    'trophy-outline',
    imageIconColor: '#f59e0b',
    imageBg:      'rgba(245,158,11,0.1)',
    stats: [
      { icon: '💎', value: '2,450',  label: 'Points Earned' },
      { icon: '🎁', value: '₱1.2k', label: 'Rewards Claimed' },
    ],
    btnText:      'Start My Journey 🌱',
    btnColor:     '#FFC091',
    btnTextColor: '#1a1208',
    dotColor:     '#FFC091',
    skipColor:    'rgba(255,255,255,0.4)',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Stat card component
// ─────────────────────────────────────────────────────────────────────────────

function SlideStatCard({ stat, bg }: { stat: StatCard; bg: string }) {
  return (
    <View style={[sc.card, { backgroundColor: bg }]}>
      <Text style={sc.icon}>{stat.icon}</Text>
      <Text style={sc.value}>{stat.value}</Text>
      <Text style={sc.label}>{stat.label}</Text>
    </View>
  )
}

const sc = StyleSheet.create({
  card: {
    flex:              1,
    borderRadius:      14,
    paddingVertical:   16,
    paddingHorizontal: 14,
    gap:               4,
  },
  icon: {
    fontSize: 22,
  },
  value: {
    fontSize:   22,
    fontWeight: '900',
    color:      '#ffffff',
    marginTop:  4,
  },
  label: {
    fontSize:  12,
    color:     'rgba(255,255,255,0.55)',
    fontWeight:'500',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Individual slide
// ─────────────────────────────────────────────────────────────────────────────

function SlideItem({ slide, onNext, isLast, onSkip }: {
  slide:  Slide
  onNext: () => void
  isLast: boolean
  onSkip: () => void
}) {
  return (
    <View style={[sl.root, { width, backgroundColor: slide.bg }]}>
      {/* Skip */}
      {!isLast && (
        <Pressable onPress={onSkip} style={sl.skip}>
          <Text style={[sl.skipText, { color: slide.skipColor }]}>Skip</Text>
        </Pressable>
      )}

      {/* Category pill */}
      <View style={[sl.pill, { backgroundColor: slide.pillBg, borderColor: slide.pillColor + '55' }]}>
        <Text style={[sl.pillText, { color: slide.pillColor }]}>{slide.pillText}</Text>
      </View>

      {/* Title */}
      <Text style={sl.title}>{slide.title}</Text>

      {/* Body */}
      <Text style={sl.body}>{slide.body}</Text>

      {/* Image area */}
      <View style={[sl.imageBox, { backgroundColor: slide.imageBg }]}>
        <Ionicons name={slide.imageIcon} size={72} color={slide.imageIconColor} />
      </View>

      {/* Stat cards */}
      <View style={sl.statsRow}>
        {slide.stats.map((stat, i) => (
          <SlideStatCard
            key={i}
            stat={stat}
            bg="rgba(255,255,255,0.07)"
          />
        ))}
      </View>

      {/* CTA button */}
      <Pressable
        onPress={onNext}
        style={({ pressed }) => [
          sl.btn,
          { backgroundColor: slide.btnColor },
          pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
        ]}
      >
        <Text style={[sl.btnText, { color: slide.btnTextColor }]}>
          {slide.btnText}
        </Text>
      </Pressable>
    </View>
  )
}

const sl = StyleSheet.create({
  root: {
    flex:              1,
    paddingHorizontal: 24,
    paddingTop:        Platform.OS === 'ios' ? 64 : 48,
    paddingBottom:     Platform.OS === 'ios' ? 48 : 32,
    gap:               18,
  },
  skip: {
    alignSelf:       'flex-end',
    paddingVertical:  4,
  },
  skipText: {
    fontSize:   14,
    fontWeight: '600',
  },
  pill: {
    alignSelf:         'flex-start',
    borderRadius:      99,
    borderWidth:       1,
    paddingHorizontal: 12,
    paddingVertical:   5,
  },
  pillText: {
    fontSize:   12,
    fontWeight: '700',
  },
  title: {
    fontSize:   28,
    fontWeight: '900',
    color:      '#ffffff',
    lineHeight: 35,
    marginTop:  4,
  },
  body: {
    fontSize:   14,
    color:      'rgba(255,255,255,0.6)',
    lineHeight: 22,
  },
  imageBox: {
    width:          '100%',
    height:         150,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap:           12,
  },
  btn: {
    borderRadius:    16,
    paddingVertical: 16,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       'auto',
  },
  btnText: {
    fontSize:   16,
    fontWeight: '800',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding screen
// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const [activeIdx, setActiveIdx] = useState(0)
  const flatRef = useRef<FlatList>(null)

  const isLast = activeIdx === SLIDES.length - 1
  const slide  = SLIDES[activeIdx]

  const goNext = async () => {
    if (isLast) {
      await AsyncStorage.setItem('seegla_onboarding_done', 'true')
      router.replace('/login')
    } else {
      flatRef.current?.scrollToIndex({ index: activeIdx + 1, animated: true })
    }
  }

  const skip = async () => {
    await AsyncStorage.setItem('seegla_onboarding_done', 'true')
    router.replace('/login')
  }

  const onScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width)
    setActiveIdx(Math.min(Math.max(idx, 0), SLIDES.length - 1))
  }

  const renderItem: ListRenderItem<Slide> = ({ item, index }) => (
    <SlideItem
      slide={item}
      onNext={goNext}
      isLast={index === SLIDES.length - 1}
      onSkip={skip}
    />
  )

  return (
    <View style={[root.wrap, { backgroundColor: slide.bg }]}>
      <StatusBar style="light" />

      {/* Dot indicators — top */}
      <View style={root.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              root.dot,
              i === activeIdx
                ? [root.dotActive, { backgroundColor: slide.dotColor }]
                : root.dotInactive,
            ]}
          />
        ))}
      </View>

      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      />
    </View>
  )
}

const root = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  dots: {
    position:      'absolute',
    top:           Platform.OS === 'ios' ? 56 : 40,
    left:          24,
    flexDirection: 'row',
    gap:           6,
    zIndex:        10,
  },
  dot: {
    height:       4,
    borderRadius: 2,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width:           8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
})
