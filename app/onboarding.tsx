/**
 * Refactored Onboarding — Final Touch-Fix Version
 * Fix: zIndex + Button Layering to ensure Next works
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
  stats: { iconName: keyof typeof Ionicons.glyphMap; value: string; label: string }[];
  ctaText: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    bg: '#D2E3C8',
    textColor: '#3A4D39',
    subTextColor: '#4F6F52',
    pillBg: '#86A789',
    btnBg: '#3A4D39',
    btnTextColor: '#FFFFFF',
    pillText: 'Health Tracking',
    title: 'Track Your\nWellness Journey',
    body: 'Monitor steps, sleep, hydration, and mental health — all in one dashboard.',
    imageSource: require('@/assets/images/onb1.png'),
    stats: [
      { iconName: 'walk-outline', value: '8,420', label: 'Steps' },
      { iconName: 'stats-chart-outline', value: '87', label: 'Score' },
    ],
    ctaText: 'Next',
  },
  {
    id: '2',
    bg: '#86A789',
    textColor: '#FFFFFF',
    subTextColor: '#D2E3C8',
    pillBg: '#3A4D39',
    btnBg: '#FFFFFF',
    btnTextColor: '#3A4D39',
    pillText: 'Team Vitality',
    title: 'Grow Together\nas a Team',
    body: 'Join company challenges and build a culture of wellness with your team.',
    imageSource: require('@/assets/images/onb2.png'),
    stats: [
      { iconName: 'people-outline', value: '124', label: 'Members' },
      { iconName: 'flame-outline', value: '14d', label: 'Streak' },
    ],
    ctaText: 'Next',
  },
  {
    id: '3',
    bg: '#4F6F52',
    textColor: '#FFFFFF',
    subTextColor: '#D2E3C8',
    pillBg: '#A9B388',
    btnBg: '#3A4D39',
    btnTextColor: '#FFFFFF',
    pillText: 'Earn Rewards',
    title: 'Healthy Habits\nEarn Real Perks',
    body: 'Convert wellness points into GCash, Grab vouchers, and real rewards.',
    imageSource: require('@/assets/images/onb3.png'),
    stats: [
      { iconName: 'diamond-outline', value: '2,450', label: 'Points' },
      { iconName: 'gift-outline', value: '₱1.2k', label: 'Claimed' },
    ],
    ctaText: 'Start My Journey',
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
      // Direct call to scroll to the next index
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
      <StatusBar style={activeIdx === 0 ? "dark" : "light"} />

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
                {item.stats.map((stat, i) => (
                  <View key={i} style={[root.card, item.bg !== '#D2E3C8' && root.cardDark]}>
                    <Ionicons name={stat.iconName} size={18} color={item.bg !== '#D2E3C8' ? '#D2E3C8' : '#3A4D39'} />
                    <Text style={[root.cardValue, { color: item.bg !== '#D2E3C8' ? '#FFF' : '#3A4D39' }]}>{stat.value}</Text>
                    <Text style={[root.cardLabel, { color: item.bg !== '#D2E3C8' ? 'rgba(255,255,255,0.6)' : '#4F6F52' }]}>{stat.label}</Text>
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
          <View key={i} style={[root.dot, { backgroundColor: i === activeIdx ? slide.textColor : 'rgba(0,0,0,0.1)' }, i === activeIdx && { width: 24 }]} />
        ))}
      </View>

      {/* Fixed Button Container — CRITICAL: This is the last item in the JSX to stay on top */}
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
  scrollContent: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 100 : 80, flexGrow: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pill: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { fontSize: 10, fontWeight: '800', color: '#FFF', textTransform: 'uppercase' },
  skipText: { fontSize: 14, fontWeight: '700', opacity: 0.8 },
  title: { fontSize: isShortScreen ? 24 : 30, fontWeight: '900', lineHeight: isShortScreen ? 30 : 38, marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '500', marginBottom: 20 },
  imageContainer: { width: '100%', height: isShortScreen ? 160 : 220, borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFF', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 20 },
  mainImage: { width: '100%', height: '100%' },
  statsRow: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, borderRadius: 14, padding: 12, backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  cardDark: { backgroundColor: 'rgba(0, 0, 0, 0.15)', borderColor: 'rgba(255, 255, 255, 0.2)' },
  cardValue: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  cardLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  dots: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 45, left: 24, flexDirection: 'row', gap: 6, zIndex: 50 },
  dot: { height: 4, borderRadius: 2, width: 8 },
  buttonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 32,
    left: 24,
    right: 24,
    zIndex: 999,      // Ensures it is physically on top
    elevation: 10,    // Android specific layering
  },
  btn: { height: 60, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 16, fontWeight: '800' },
});