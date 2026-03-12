/**
 * Refactored Onboarding — Seegla Brand Guidelines
 * * Features:
 * - Color Sequence: White -> Navy -> White
 * - Highlight Cards instead of numeric stats, aligned with subtext
 * - Dynamic Status Bar (Dark/Light based on slide)
 * - Fix: zIndex + Button Layering to ensure Next works
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  ImageSourcePropType,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const isShortScreen = height < 700;

// ─────────────────────────────────────────────────────────────────────────────
// Brand Colors & Theme (Official PDF Hex Codes)
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
  navy: '#0A2E5C',       
  teal: '#16A085',       
  orangeDark: '#F59E0B', 
  bgGray: '#F7F9FC',     
  white: '#FFFFFF',
  textSecondary: '#64748B',
  border: '#E5E7EB',
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide Data
// ─────────────────────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  bg: string;
  textColor: string;
  subTextColor: string;
  pillBg: string;
  btnBg: string;
  btnTextColor: string;
  pillText: string;
  title: string;
  body: string;
  imageSource: ImageSourcePropType;
  highlights: { iconName: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[];
  ctaText: string;
  cardBg: string;
  cardBorder: string;
  cardTitleColor: string;
  cardSubColor: string;
  cardIconColor: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    bg: COLORS.white, // Slide 1: White
    textColor: COLORS.navy,
    subTextColor: COLORS.textSecondary,
    pillBg: COLORS.teal,
    btnBg: COLORS.navy,
    btnTextColor: COLORS.white,
    pillText: 'Welcome',
    title: 'Your Daily Wellness,\nRewarded',
    body: "Stay healthy, join challenges, and unlock exclusive rewards — all through your company's wellness program.",
    imageSource: require('@/assets/images/onb1.png'), 
    highlights: [
      { iconName: 'fitness-outline', title: 'Stay Healthy', subtitle: 'Track your daily activity' },
      { iconName: 'gift-outline', title: 'Get Rewarded', subtitle: 'Unlock exclusive perks' },
    ],
    ctaText: 'Next',
    cardBg: COLORS.bgGray,
    cardBorder: COLORS.border,
    cardTitleColor: COLORS.navy,
    cardSubColor: COLORS.textSecondary,
    cardIconColor: COLORS.teal,
  },
  {
    id: '2',
    bg: COLORS.navy, // Slide 2: Navy
    textColor: COLORS.white,
    subTextColor: 'rgba(255,255,255,0.75)',
    pillBg: COLORS.orangeDark,
    btnBg: COLORS.teal,
    btnTextColor: COLORS.white,
    pillText: 'Daily Promo Hour',
    title: 'Check In Daily,\nEarn Every Night',
    body: 'Answer 3 quick wellness questions every morning. At 8PM, your exclusive Daily Promo Hour voucher unlocks.',
    imageSource: require('@/assets/images/onb3.png'),
    highlights: [
      { iconName: 'sunny-outline', title: 'Morning', subtitle: 'Quick 3-step check-in' },
      { iconName: 'ticket-outline', title: 'Night', subtitle: '8PM voucher unlocks' },
    ],
    ctaText: 'Next',
    cardBg: 'rgba(255,255,255,0.1)',
    cardBorder: 'rgba(255,255,255,0.2)',
    cardTitleColor: COLORS.white,
    cardSubColor: 'rgba(255,255,255,0.65)',
    cardIconColor: COLORS.orangeDark,
  },
  {
    id: '3',
    bg: COLORS.white, // Slide 3: White
    textColor: COLORS.navy,
    subTextColor: COLORS.textSecondary,
    pillBg: COLORS.teal,
    btnBg: COLORS.navy,
    btnTextColor: COLORS.white,
    pillText: 'Team Pulse',
    title: 'Climb the Ranks,\nInspire Your Team',
    body: 'Join company challenges, build your habit streak, and level up from Beginner to Pro.',
    imageSource: require('@/assets/images/onb2.png'),
    highlights: [
      { iconName: 'trending-up-outline', title: 'Level Up', subtitle: 'From Beginner to Pro' },
      { iconName: 'trophy-outline', title: 'Compete', subtitle: 'Join team challenges' },
    ],
    ctaText: 'Start My Journey',
    cardBg: COLORS.bgGray,
    cardBorder: COLORS.border,
    cardTitleColor: COLORS.navy,
    cardSubColor: COLORS.textSecondary,
    cardIconColor: COLORS.teal,
  },
];

export default function OnboardingScreen() {
  const [activeIdx, setActiveIdx] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const slide = SLIDES[activeIdx];

  const goNext = async () => {
    if (activeIdx === SLIDES.length - 1) {
      await AsyncStorage.setItem('seegla_onboarding_done', 'true');
      router.replace('/login');
    } else {
      flatRef.current?.scrollToIndex({ 
        index: activeIdx + 1, 
        animated: true 
      });
    }
  };

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    if (index !== activeIdx) setActiveIdx(index);
  };

  return (
    <View style={[root.container, { backgroundColor: slide.bg }]}>
      {/* Slide 2 is Navy, so it needs light text. Slides 1 and 3 are White, so they need dark text. */}
      <StatusBar style={activeIdx === 1 ? "light" : "dark"} />

      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item, index }) => (
          <View style={{ width }}>
            <ScrollView 
              contentContainerStyle={root.scrollContent} 
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={root.topRow}>
                <View style={[root.pill, { backgroundColor: item.pillBg }]}>
                  <Text style={root.pillText}>{item.pillText}</Text>
                </View>
                {index < SLIDES.length - 1 && (
                  <Pressable onPress={() => router.replace('/login')} hitSlop={20}>
                    <Text style={[root.skipText, { color: item.textColor }]}>Skip</Text>
                  </Pressable>
                )}
              </View>

              <Text style={[root.title, { color: item.textColor }]}>{item.title}</Text>
              <Text style={[root.body, { color: item.subTextColor }]}>{item.body}</Text>

              <View style={root.imageContainer}>
                <Image source={item.imageSource} style={root.mainImage} resizeMode="cover" />
              </View>

              <View style={root.statsRow}>
                {item.highlights.map((highlight, i) => (
                  <View 
                    key={i} 
                    style={[root.card, { backgroundColor: item.cardBg, borderColor: item.cardBorder }]}
                  >
                    <Ionicons name={highlight.iconName} size={22} color={item.cardIconColor} />
                    <Text style={[root.cardTitle, { color: item.cardTitleColor }]}>{highlight.title}</Text>
                    <Text style={[root.cardSubtitle, { color: item.cardSubColor }]}>{highlight.subtitle}</Text>
                  </View>
                ))}
              </View>
              
              {/* Buffer for fixed button */}
              <View style={{ height: 120 }} />
            </ScrollView>
          </View>
        )}
      />

      {/* Pagination Dots */}
      <View style={root.dots} pointerEvents="none">
        {SLIDES.map((_, i) => (
          <View 
            key={i} 
            style={[
              root.dot, 
              { backgroundColor: i === activeIdx ? slide.textColor : 'rgba(150,150,150,0.3)' }, 
              i === activeIdx && { width: 24 }
            ]} 
          />
        ))}
      </View>

      {/* Fixed Button Container */}
      <View style={root.buttonContainer}>
        <Pressable
          onPress={goNext}
          style={({ pressed }) => [
            root.btn,
            { backgroundColor: slide.btnBg, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[root.btnText, { color: slide.btnTextColor }]}>{slide.ctaText}</Text>
          {activeIdx < SLIDES.length - 1 && <Ionicons name="arrow-forward" size={18} color={slide.btnTextColor} />}
        </Pressable>
      </View>
    </View>
  );
}

const root = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 80 : 60, flexGrow: 1 },
  
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pill: { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  pillText: { fontSize: 10, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.5 },
  skipText: { fontSize: 14, fontWeight: '700', opacity: 0.7 },
  
  title: { fontSize: isShortScreen ? 24 : 32, fontWeight: '900', lineHeight: isShortScreen ? 32 : 40, marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '500', marginBottom: 24 },
  
  imageContainer: { 
    width: '100%', 
    height: isShortScreen ? 160 : 220, 
    borderRadius: 24, 
    overflow: 'hidden', 
    backgroundColor: '#FFF', 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    marginBottom: 20 
  },
  mainImage: { width: '100%', height: '100%' },
  
  statsRow: { flexDirection: 'row', gap: 12 },
  card: { flex: 1, borderRadius: 16, padding: 16, borderWidth: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800', marginTop: 10, marginBottom: 2 },
  cardSubtitle: { fontSize: 12, fontWeight: '600' },
  
  dots: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 24, flexDirection: 'row', gap: 6, zIndex: 50 },
  dot: { height: 5, borderRadius: 2.5, width: 8 },
  
  buttonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 32,
    left: 24,
    right: 24,
    zIndex: 999,      
    elevation: 10,    
  },
  btn: { height: 60, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 16, fontWeight: '800' },
});