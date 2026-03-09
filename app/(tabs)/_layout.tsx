import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';

// Center Promo button
function PromoTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[promoBtn.wrap, focused && promoBtn.wrapActive]}>
      <Ionicons name="flame" size={26} color="#fff" />
    </View>
  );
}

const promoBtn = StyleSheet.create({
  wrap: {
    width:           54,
    height:          54,
    borderRadius:    27,
    backgroundColor: '#FF6B00',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Platform.OS === 'ios' ? 14 : 8,
    shadowColor:     '#FF6B00',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.45,
    shadowRadius:    8,
    elevation:       8,
  },
  wrapActive: {
    backgroundColor: '#e55f00',
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   '#3FE870',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown:             false,
        tabBarButton:            HapticTab,
        tabBarStyle: {
          borderTopWidth:  1,
          borderTopColor:  '#f1f5f9',
          backgroundColor: '#ffffff',
          height:          Platform.OS === 'ios' ? 84 : 64,
          paddingBottom:   Platform.OS === 'ios' ? 24 : 8,
          paddingTop:      4,
        },
        tabBarLabelStyle: {
          fontSize:   10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Center Promo button */}
      <Tabs.Screen
        name="promo"
        options={{
          title: '',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <PromoTabIcon focused={focused} />
          ),
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="pulse"
        options={{
          title: 'Pulse',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="gift-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden */}
      <Tabs.Screen name="index"   options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
