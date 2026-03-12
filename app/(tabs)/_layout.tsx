import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticTab } from '@/components/haptic-tab';

// ─────────────────────────────────────────────────────────────────────────────
// Brand Colors
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
  navy: '#1E2356',      // Added Navy for the "Burger" layout
  teal: '#00C4C7',
  purple: '#6244CB',
  inactive: '#94A3B8',  // Slate gray looks great on dark backgrounds
  white: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.08)', // Subtle light border for dark background
};

// ─────────────────────────────────────────────────────────────────────────────
// Center Promo Button
// ─────────────────────────────────────────────────────────────────────────────
function PromoTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={promoBtn.wrap}>
      <LinearGradient
        colors={[COLORS.purple, COLORS.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={promoBtn.circle}
      >
        <Ionicons name="gift-outline" size={26} color={COLORS.white} />
      </LinearGradient>
    </View>
  );
}

const promoBtn = StyleSheet.create({
  wrap: {
    // Pushes the circle up so it sits higher than the standard icons
    marginBottom: Platform.OS === 'ios' ? 14 : 20, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', // Changed shadow to black for better depth on navy background
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Tab Layout
// ─────────────────────────────────────────────────────────────────────────────
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   COLORS.teal,
        tabBarInactiveTintColor: COLORS.inactive,
        headerShown:             false,
        tabBarButton:            HapticTab,
        tabBarStyle: {
          borderTopWidth:  1,
          borderTopColor:  COLORS.border,
          backgroundColor: COLORS.navy, // Changed to Navy for the Burger layout
          height:          Platform.OS === 'ios' ? 88 : 68,
          paddingBottom:   Platform.OS === 'ios' ? 28 : 10,
          paddingTop:      8,
        },
        tabBarLabelStyle: {
          fontSize:   10,
          fontWeight: '700',
          marginTop:  2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Center Promo button */}
      <Tabs.Screen
        name="promo"
        options={{
          title: 'Promo', 
          tabBarIcon: ({ focused }) => (
            <PromoTabIcon focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="pulse"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ribbon-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen name="index"   options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}