/**
 * Dashboard — Home tab
 *
 * Features:
 * - Premium Soft-UI Design
 * - Header Rank Badge (Beginner/Veteran/Pro)
 * - Interactive Water Tracker (+ / - buttons)
 * - Advanced Activity Tracker (Walk/Run/Bike/Meditate)
 * - Countdown, Pause, Resume, and Finish features
 */

import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Pedometer } from 'expo-sensors'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const { width } = Dimensions.get('window')

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
  bgGray: '#F4F7FA',   // Slightly cooler gray for premium soft-ui background
  white: '#FFFFFF',
  textPrimary: '#1E2356',
  textSecondary: '#64748B',
  border: '#E5E7EB',
  disabledText: '#94A3B8'
}

const RANK_UI: Record<string, { label: string, bg: string, text: string, border: string }> = {
  beginner: { label: 'Beginner', bg: COLORS.lightGreen, text: '#15803d', border: COLORS.green },
  veteran:  { label: 'Veteran', bg: COLORS.lightTeal, text: '#0e7490', border: COLORS.teal },
  pro:      { label: 'Pro', bg: '#FFF8E1', text: '#b45309', border: COLORS.orangeDark },
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TodayMetrics {
  steps:            number
  exercise_minutes: number
  calories:         number
  wellness_score:   number
  water_glasses:    number
}

type ActivityType = 'walk' | 'run' | 'bike' | 'meditate'
type TrackerState = 'idle' | 'countdown' | 'tracking' | 'paused'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getFirstName(name: string | undefined): string {
  return name?.split(' ')[0] ?? 'Jenzele'
}

function formatTimer(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile Drawer (Updated to Seegla Brand Colors)
// ─────────────────────────────────────────────────────────────────────────────

const DRAWER_WIDTH = width * 0.8

function ProfileDrawer({ visible, onClose, user }: { visible: boolean, onClose: () => void, user: any }) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start()
    } else {
      slideAnim.setValue(DRAWER_WIDTH)
    }
  }, [visible])

  const handleClose = () => {
    Animated.timing(slideAnim, { toValue: DRAWER_WIDTH, duration: 220, useNativeDriver: true }).start(() => onClose())
  }

  const handleLogOut = async () => {
    handleClose()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const authorName = user?.full_name ?? 'Juan Dela Cruz'
  const initials   = authorName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const role       = user?.wellness_rank ?? 'Wellness Member'

  const handleViewProfile = () => {
    handleClose()
    setTimeout(() => router.push('/(tabs)/profile'), 250)
  }

  const MENU_ITEMS = [
    { icon: 'person-outline' as const, label: 'View Profile', onPress: handleViewProfile },
    { icon: 'settings-outline' as const, label: 'Settings & Privacy', onPress: undefined },
    { icon: 'newspaper-outline' as const, label: 'Activity Log', onPress: undefined },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', onPress: undefined },
  ]

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={dr.overlay}>
        <Pressable style={dr.backdrop} onPress={handleClose} />
        <Animated.View style={[dr.drawer, { transform: [{ translateX: slideAnim }] }]}>
          
          {/* Profile Section */}
          <View style={dr.profileSection}>
            <View style={dr.avatarWrap}>
              <View style={dr.avatarCircle}>
                <Text style={dr.avatarInitials}>{initials}</Text>
              </View>
              <View style={dr.editBadge}>
                <Ionicons name="pencil" size={11} color={COLORS.white} />
              </View>
            </View>
            <Text style={dr.profileName}>{authorName}</Text>
            <Text style={dr.profileRole}>{role}</Text>
          </View>
          
          <View style={dr.divider} />
          
          {/* Menu Items */}
          <ScrollView style={dr.menuScroll} showsVerticalScrollIndicator={false}>
            {MENU_ITEMS.map((item) => (
              <Pressable 
                key={item.label} 
                onPress={item.onPress} 
                style={({ pressed }) => [dr.menuItem, pressed && { backgroundColor: COLORS.bgGray }]}
              >
                <View style={dr.menuIconBox}>
                  <Ionicons name={item.icon} size={20} color={COLORS.navy} />
                </View>
                <Text style={dr.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.disabledText} />
              </Pressable>
            ))}
          </ScrollView>

          {/* Logout Section */}
          <View style={dr.footer}>
            <View style={dr.divider} />
            <Pressable onPress={handleLogOut} style={({ pressed }) => [dr.logoutBtn, pressed && { opacity: 0.75 }]}>
              <View style={dr.logoutIconBox}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <Text style={dr.logoutText}>Log Out</Text>
            </Pressable>
          </View>

        </Animated.View>
      </View>
    </Modal>
  )
}

const dr = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'transparent' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer: { 
    width: DRAWER_WIDTH, 
    backgroundColor: COLORS.white, 
    height: '100%', 
    elevation: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.1, shadowRadius: 16 }
    })
  },
  
  // Profile Header
  profileSection: { 
    alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 64 : 48, 
    paddingBottom: 24, 
    paddingHorizontal: 20, 
    gap: 6, 
    backgroundColor: COLORS.bgGray 
  },
  avatarWrap: { marginBottom: 8 },
  avatarCircle: { 
    width: 76, 
    height: 76, 
    borderRadius: 38, 
    backgroundColor: COLORS.teal, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 3, 
    borderColor: COLORS.white,
    ...Platform.select({ 
      ios: { shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }, 
      android: { elevation: 4 } 
    }),
  },
  avatarInitials: { fontSize: 26, fontWeight: '900', color: COLORS.white },
  editBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: COLORS.navy, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: COLORS.white 
  },
  profileName: { fontSize: 17, fontWeight: '900', color: COLORS.navy, textAlign: 'center' },
  profileRole: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  
  divider: { height: 1, backgroundColor: COLORS.border },
  
  // Menu
  menuScroll: { flex: 1 },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14, 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  menuIconBox: { 
    width: 38, 
    height: 38, 
    borderRadius: 10, 
    backgroundColor: COLORS.bgGray, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexShrink: 0 
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  
  // Footer
  footer: { paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 },
  logoutIconBox: { 
    width: 38, 
    height: 38, 
    borderRadius: 10, 
    backgroundColor: '#FEF2F2', // Very light red for danger action
    alignItems: 'center', 
    justifyContent: 'center', 
    flexShrink: 0 
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#EF4444' }, // Red for destructive action
})
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard screen
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user } = useAuth()
  const [metrics,      setMetrics]      = useState<TodayMetrics>({ steps: 0, exercise_minutes: 0, calories: 0, wellness_score: 0, water_glasses: 0 })
  const [totalPoints,  setTotalPoints]  = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDrawer,   setShowDrawer]   = useState(false)

  // Interactive Water State
  const [localWater, setLocalWater] = useState(0)

  // Advanced Tracker State
  const [activityType, setActivityType] = useState<ActivityType>('walk')
  const [trackerState, setTrackerState] = useState<TrackerState>('idle')
  const [countdownVal, setCountdownVal] = useState(3)
  const [trackSecs,    setTrackSecs]    = useState(0)
  const [currentSteps, setCurrentSteps] = useState(0)
  
  const savedStepsRef = useRef(0)
  const [stepSubscription, setStepSubscription] = useState<Pedometer.Subscription | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    if (!user) return
    const [metricsRes, pointsRes] = await Promise.all([
      supabase.from('health_metrics').select('*').eq('user_id', user.id).eq('metric_date', today).maybeSingle(),
      supabase.from('user_points').select('total_points').eq('user_id', user.id).maybeSingle(),
    ])
    if (metricsRes.data) {
      const data = metricsRes.data as any
      setMetrics({
        steps:            data.steps ?? 0,
        exercise_minutes: data.exercise_minutes ?? 0,
        calories:         data.calories ?? 0,
        wellness_score:   data.wellness_score ?? 0,
        water_glasses:    data.water_glasses ?? 0,
      })
      setLocalWater(data.water_glasses ?? 0)
    }
    if (pointsRes.data) setTotalPoints((pointsRes.data as any).total_points ?? 0)
  }, [user, today])

  useEffect(() => { load() }, [load])

  const onRefresh = async () => {
    setIsRefreshing(true)
    await load()
    setIsRefreshing(false)
  }

  // Handle Interactive Water
  const handleWaterChange = (delta: number) => {
    setLocalWater(prev => {
      const newVal = Math.max(0, Math.min(8, prev + delta))
      // TODO: Optionally trigger an instant debounced Supabase update here
      return newVal
    })
  }

  // ── Tracker Logistics ──
  const startPedometer = async () => {
    if (activityType === 'walk' || activityType === 'run') {
      const isAvailable = await Pedometer.isAvailableAsync()
      if (isAvailable) {
        const sub = Pedometer.watchStepCount(result => {
          setCurrentSteps(savedStepsRef.current + result.steps)
        })
        setStepSubscription(sub)
      }
    }
  }

  const stopPedometer = () => {
    if (stepSubscription) {
      stepSubscription.remove()
      setStepSubscription(null)
      savedStepsRef.current = currentSteps 
    }
  }

  // Handle Countdown & Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (trackerState === 'countdown') {
      interval = setInterval(() => {
        setCountdownVal((prev) => {
          if (prev <= 1) {
            setTrackerState('tracking')
            startPedometer()
            return 3 
          }
          return prev - 1
        })
      }, 1000)
    } else if (trackerState === 'tracking') {
      interval = setInterval(() => {
        setTrackSecs((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [trackerState])

  // Tracker Controls
  const initiateActivity = () => {
    setCountdownVal(3)
    setTrackerState('countdown')
  }

  const togglePause = () => {
    if (trackerState === 'tracking') {
      stopPedometer()
      setTrackerState('paused')
    } else if (trackerState === 'paused') {
      startPedometer()
      setTrackerState('tracking')
    }
  }

  const finishActivity = () => {
    stopPedometer()
    setTrackerState('idle')
    
    let finalKm = 0
    if (activityType === 'bike') finalKm = trackSecs * 0.0055
    else finalKm = currentSteps * 0.000762

    let message = `Awesome job! You tracked ${formatTimer(trackSecs)}.`
    if (activityType !== 'meditate') {
      message = `Awesome job! You tracked ${formatTimer(trackSecs)} and covered ${finalKm.toFixed(2)} km.`
    }

    Alert.alert('Activity Saved! 🎉', message)
    
    setTrackSecs(0)
    setCurrentSteps(0)
    savedStepsRef.current = 0
  }

  if (!user) return null

  // Demo Fallbacks
  const steps    = metrics.steps || 7234
  const actMins  = metrics.exercise_minutes || 42
  const calories = metrics.calories || 480
  const pts      = totalPoints || 1240
  const initial  = user.full_name?.charAt(0).toUpperCase() ?? 'J'

  // Calculate live distance for tracker
  let liveKm = 0
  if (activityType === 'bike') liveKm = trackSecs * 0.0055 
  else liveKm = currentSteps * 0.000762 

  // Steps Progress
  const stepsPercentage = Math.min(steps / 10000, 1)

  // Rank Display
  const currentRankLabel = user.wellness_rank ? user.wellness_rank.toLowerCase() : 'veteran'
  const rankConfig = RANK_UI[currentRankLabel] || RANK_UI.beginner

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      
      {/* ── Navy Header Background ── */}
      <View style={styles.headerBg}>
        <View style={styles.headerContent}>
          
          <View style={styles.headerTopRow}>
            <Text style={styles.greetingText}>Hello, </Text>
            <View style={styles.headerActions}>
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 5 Days</Text>
              </View>
              <View style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
              </View>
              <Pressable onPress={() => setShowDrawer(true)} style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </Pressable>
            </View>
          </View>

          {/* User Name & Rank Badge */}
          <View style={styles.nameRankRow}>
            <Text style={styles.userName}>{getFirstName(user.full_name)}</Text>
            <View style={[styles.headerRankChip, { backgroundColor: rankConfig.bg, borderColor: rankConfig.border }]}>
              <Text style={[styles.headerRankText, { color: rankConfig.text }]}>{rankConfig.label}</Text>
            </View>
          </View>

          <View style={styles.headerBottomRow}>
            <Text style={styles.deptText}>TechCorp PH · IT Dept</Text>
            <View style={styles.pointsWrapper}>
              <Ionicons name="star" size={16} color={COLORS.orangeDark} />
              <Text style={styles.pointsText}>{pts.toLocaleString()} pts</Text>
            </View>
          </View>

        </View>
      </View>

      {/* ── Main Scroll Content ── */}
      <ScrollView
        style={{ backgroundColor: COLORS.bgGray }} 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.teal} />}
      >
        <View style={styles.cardsContainer}>

          {/* 1. Daily Check-in Card */}
       {/* Compact Daily Check-in Card */}
       <View style={styles.checkInCard}>
            <View style={styles.checkInRow}>
              <View style={styles.checkIconWrap}>
                <Ionicons name="checkmark" size={18} color={COLORS.green} />
              </View>
              <View style={styles.checkInTextWrap}>
                <Text style={styles.cardTitle}>Daily Check-in Complete</Text>
                <Text style={styles.cardSub}>Feeling great today 😊</Text>
              </View>
              <View style={styles.ptsBadge}>
                <Text style={styles.ptsBadgeText}>+10 pts</Text>
              </View>
            </View>
          </View>

          {/* 2. Daily Promo Hour (Gradient Card) */}
          <LinearGradient colors={[COLORS.purple, COLORS.teal]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promoGradient}>
            <View style={styles.promoHeader}>
              <View style={styles.promoHeaderLeft}>
                <Text style={styles.giftIcon}>🎁</Text>
                <Text style={styles.promoLabel}>DAILY PROMO HOUR</Text>
              </View>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>Tonight 8 PM</Text>
              </View>
            </View>
            <Text style={styles.promoTitle}>Tonight's reward is ready 🎉</Text>
            <Text style={styles.promoSub}>You checked in today — voucher unlocks at 8PM.</Text>
            <View style={styles.rewardBoxes}>
              <View style={styles.rewardBox}><Text style={styles.rewardBoxText}>₱20{'\n'}GCash</Text></View>
              <View style={styles.rewardBox}><Text style={styles.rewardBoxText}>₱25{'\n'}Grab</Text></View>
              <View style={styles.rewardBox}><Text style={styles.rewardBoxText}>Free{'\n'}Coffee</Text></View>
              <Pressable style={styles.unlockBox}>
                <Text style={styles.unlockBoxText}>Unlock{'\n'}→</Text>
              </Pressable>
            </View>
          </LinearGradient>


          {/* 4. Advanced Live Tracker (with Meditate) */}
          <View style={[styles.trackerCard, trackerState !== 'idle' && styles.trackerCardActive]}>
            
            <View style={styles.trackerHeader}>
              <Text style={styles.sectionTitle}>Record Activity</Text>
              {(trackerState === 'tracking' || trackerState === 'countdown') && <View style={styles.liveDot} />}
            </View>

            {trackerState === 'idle' && (
              <>
                <View style={styles.activitySelector}>
                  {(['walk', 'run', 'bike', 'meditate'] as ActivityType[]).map((type) => {
                    const isSelected = activityType === type
                    let iconName = 'walk'
                    if (type === 'bike') iconName = 'bicycle'
                    if (type === 'run') iconName = 'flash'
                    if (type === 'meditate') iconName = 'heart'

                    return (
                      <Pressable
                        key={type}
                        onPress={() => setActivityType(type)}
                        style={[styles.activityBtn, isSelected && styles.activityBtnSelected]}
                      >
                        <Ionicons name={iconName as any} size={16} color={isSelected ? COLORS.white : COLORS.textSecondary} />
                        <Text style={[styles.activityBtnText, isSelected && styles.activityBtnTextSelected]}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
                
                <Pressable onPress={initiateActivity} style={styles.primaryActionBtn}>
                  <Text style={styles.primaryActionText}>
                    Start {activityType.charAt(0).toUpperCase() + activityType.slice(1)}
                  </Text>
                </Pressable>
              </>
            )}

            {trackerState === 'countdown' && (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownTitle}>Get Ready...</Text>
                <Text style={styles.countdownNumber}>{countdownVal}</Text>
              </View>
            )}

            {(trackerState === 'tracking' || trackerState === 'paused') && (
              <View style={styles.activeTrackerContainer}>
                
                <Text style={styles.liveTimer}>{formatTimer(trackSecs)}</Text>
                <Text style={styles.liveTimerLabel}>ELAPSED TIME</Text>
                
                {/* Only show metrics if NOT meditating */}
                {activityType !== 'meditate' && (
                  <View style={styles.liveStatsRow}>
                    <View style={styles.liveStatItem}>
                      <Text style={styles.liveStatValue}>{liveKm.toFixed(2)}</Text>
                      <Text style={styles.liveStatLabel}>km</Text>
                    </View>
                    
                    {activityType !== 'bike' && (
                      <>
                        <View style={styles.liveStatDivider} />
                        <View style={styles.liveStatItem}>
                          <Text style={styles.liveStatValue}>{currentSteps}</Text>
                          <Text style={styles.liveStatLabel}>steps</Text>
                        </View>
                      </>
                    )}
                  </View>
                )}

                {/* Actions */}
                <View style={[styles.trackerControlsRow, activityType === 'meditate' && { marginTop: 24 }]}>
                  <Pressable 
                    onPress={togglePause} 
                    style={[styles.controlBtn, trackerState === 'paused' ? styles.btnResume : styles.btnPause]}
                  >
                    <Ionicons name={trackerState === 'paused' ? "play" : "pause"} size={18} color={trackerState === 'paused' ? COLORS.white : COLORS.orangeDark} />
                    <Text style={[styles.controlBtnText, trackerState === 'paused' ? { color: COLORS.white } : { color: COLORS.orangeDark }]}>
                      {trackerState === 'paused' ? 'Resume' : 'Pause'}
                    </Text>
                  </Pressable>

                  <Pressable onPress={finishActivity} style={[styles.controlBtn, styles.btnFinish]}>
                    <Ionicons name="stop" size={18} color={COLORS.white} />
                    <Text style={[styles.controlBtnText, { color: COLORS.white }]}>Finish</Text>
                  </Pressable>
                </View>
              </View>

              
            )}

            

          </View>

                    {/* 3. Refactored Premium "Today's Progress" */}
                    <View style={styles.progressCard}>
            <Text style={styles.sectionTitle}>Today's Progress</Text>
            
            {/* Main Progress Ring */}
            <View style={styles.mainProgressCenter}>
              <View style={[styles.largeCircleOuter, { borderColor: `${COLORS.teal}22` }]}>
                <View style={[styles.largeCircleInner, { 
                  borderColor: COLORS.teal, 
                  borderTopColor: stepsPercentage > 0.25 ? COLORS.teal : 'transparent',
                  borderRightColor: stepsPercentage > 0.5 ? COLORS.teal : 'transparent',
                  borderBottomColor: stepsPercentage > 0.75 ? COLORS.teal : 'transparent'
                }]}>
                  <Text style={styles.largeStepsLabel}>Daily Steps</Text>
                  <Text style={styles.largeStepsText}>{steps.toLocaleString()}</Text>
                  <Text style={styles.largeStepsSub}>/ 10,000 steps</Text>
                  <View style={styles.pctBadge}>
                    <Text style={styles.pctText}>{Math.floor(stepsPercentage * 100)}%</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Horizontal Mini Cards */}
            <View style={styles.miniStatsRow}>
              {/* Active Mins */}
              <View style={styles.miniCard}>
                <View style={[styles.miniIconBox, { backgroundColor: COLORS.lightGreen }]}>
                  <Ionicons name="time" size={16} color={COLORS.green} />
                </View>
                <Text style={styles.miniCardTitle}>Active</Text>
                <Text style={styles.miniCardValue}>{actMins} <Text style={styles.miniCardUnit}>m</Text></Text>
                {/* Mini bar */}
                <View style={styles.miniBarTrack}>
                  <View style={[styles.miniBarFill, { width: `${Math.min((actMins/60)*100, 100)}%`, backgroundColor: COLORS.green }]} />
                </View>
              </View>

              {/* Tappable Water */}
              <View style={styles.miniCard}>
                <View style={[styles.miniIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="water" size={16} color="#0284C7" />
                </View>
                <Text style={styles.miniCardTitle}>Water</Text>
                <Text style={styles.miniCardValue}>{localWater} <Text style={styles.miniCardUnit}>/8</Text></Text>
                {/* Stepper Controls */}
                <View style={styles.stepperControls}>
                  <Pressable onPress={() => handleWaterChange(-1)} style={styles.stepperBtn}>
                    <Ionicons name="remove" size={14} color="#0284C7" />
                  </Pressable>
                  <Pressable onPress={() => handleWaterChange(1)} style={styles.stepperBtn}>
                    <Ionicons name="add" size={14} color="#0284C7" />
                  </Pressable>
                </View>
              </View>

              {/* Calories */}
              <View style={styles.miniCard}>
                <View style={[styles.miniIconBox, { backgroundColor: '#FFF8E1' }]}>
                  <Ionicons name="flame" size={16} color={COLORS.orangeDark} />
                </View>
                <Text style={styles.miniCardTitle}>Burned</Text>
                <Text style={styles.miniCardValue}>{calories} <Text style={styles.miniCardUnit}>kcal</Text></Text>
                {/* Mini graph simulation */}
                <View style={styles.miniGraph}>
                  <View style={[styles.graphBar, { height: 8 }]} />
                  <View style={[styles.graphBar, { height: 16 }]} />
                  <View style={[styles.graphBar, { height: 12 }]} />
                  <View style={[styles.graphBar, { height: 22 }]} />
                </View>
              </View>

            </View>
          </View>


        </View>
      </ScrollView>

      {/* ── Profile Drawer ── */}
      <ProfileDrawer visible={showDrawer} onClose={() => setShowDrawer(false)} user={user} />
    </SafeAreaView>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.navy },
  
  // Header Styles
  headerBg: {
    backgroundColor: COLORS.navy,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16, 
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '500',
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.orange,
  },
  iconBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.teal,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  nameRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
  },
  headerRankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerRankText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deptText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  pointsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.orangeDark,
  },

  // Scroll Content
  scroll: { 
    paddingBottom: 40,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },

  // Daily Check-in Card (Soft UI update)
  // Daily Check-in Card Specifics
  checkInCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,     // Reduced from 20
    padding: 12,          // Reduced from 16
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  checkInRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10               // Reduced from 14
  },
  checkIconWrap: { 
    width: 36,            // Reduced from 50
    height: 36,           // Reduced from 50
    borderRadius: 12,     // Reduced from 16
    backgroundColor: COLORS.lightGreen, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  checkInTextWrap: { 
    flex: 1,
  },
  cardTitle: { 
    fontSize: 14,         // Reduced from 15
    fontWeight: '700', 
    color: COLORS.navy, 
    marginBottom: 2,      // Reduced from 4
  },
  cardSub: { 
    fontSize: 11,         // Reduced from 12
    color: COLORS.textSecondary, 
  },
  ptsBadge: { 
    backgroundColor: '#FFF8E1', 
    paddingHorizontal: 8, // Reduced from 10
    paddingVertical: 4,   // Reduced from 6
    borderRadius: 12, 
  },
  ptsBadgeText: { 
    fontSize: 11,         // Reduced from 12
    fontWeight: '700', 
    color: COLORS.orangeDark, 
  },
  // Promo Card
  promoGradient: { 
    borderRadius: 20, 
    padding: 20, 
    ...Platform.select({
      ios: { shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 4 },
    })
  },
  promoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  promoHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  giftIcon: { fontSize: 16 },
  promoLabel: { fontSize: 11, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  timeBadge: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  timeBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.orange },
  promoTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  promoSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 20 },
  rewardBoxes: { flexDirection: 'row', gap: 10 },
  rewardBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' },
  rewardBoxText: { color: COLORS.white, fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
  unlockBox: { flex: 1, backgroundColor: COLORS.bgGray, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  unlockBoxText: { color: COLORS.purple, fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 18 },

  // New "Today's Progress" Design
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  mainProgressCenter: {
    alignItems: 'center',
    marginVertical: 24,
  },
  largeCircleOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeCircleInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeStepsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  largeStepsText: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: -1,
  },
  largeStepsSub: {
    fontSize: 12,
    color: COLORS.disabledText,
    fontWeight: '500',
    marginTop: 2,
  },
  pctBadge: {
    backgroundColor: COLORS.lightTeal,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  pctText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.teal,
  },
  
  // Mini Horizontal Cards
  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  miniIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  miniCardTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  miniCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 8,
  },
  miniCardUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.disabledText,
  },
  
  // Custom Card Internals
  miniBarTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    padding: 4,
  },
  stepperBtn: {
    backgroundColor: COLORS.white,
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  miniGraph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 22,
  },
  graphBar: {
    flex: 1,
    backgroundColor: COLORS.orangeDark,
    borderRadius: 2,
    opacity: 0.8,
  },

  // Advanced Activity Tracker
  trackerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },
  trackerCardActive: {
    backgroundColor: COLORS.navy, // Dark mode for active tracker stands out beautifully
    borderColor: COLORS.navy,
  },
  trackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  
  // Tracker - Idle
  activitySelector: {
    flexDirection: 'row',
    backgroundColor: '#F4F7FA',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  activityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 10,
  },
  activityBtnSelected: {
    backgroundColor: COLORS.teal,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  activityBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityBtnTextSelected: {
    color: COLORS.white,
  },
  primaryActionBtn: {
    backgroundColor: COLORS.teal,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Tracker - Countdown
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  countdownTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  countdownNumber: {
    fontSize: 84,
    fontWeight: '900',
    color: COLORS.teal,
  },
  
  // Tracker - Live
  activeTrackerContainer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  liveTimer: {
    fontSize: 56,
    fontWeight: '900',
    color: COLORS.white,
    fontVariant: ['tabular-nums'], 
  },
  liveTimerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    marginBottom: 24,
  },
  liveStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 32,
  },
  liveStatItem: {
    alignItems: 'center',
  },
  liveStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
  },
  liveStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Tracker - Controls
  trackerControlsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
  },
  btnPause: {
    backgroundColor: '#FFF8E1',
  },
  btnResume: {
    backgroundColor: COLORS.teal,
  },
  btnFinish: {
    backgroundColor: '#EF4444', 
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
})