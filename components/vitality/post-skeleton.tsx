/**
 * PostSkeleton — animated loading placeholder that matches the PostCard shape.
 * Uses Reanimated 4's useSharedValue + withRepeat for the pulse.
 */

import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'

function SkeletonRect({
  width,
  height,
  radius = 8,
  style,
  opacity,
}: {
  width:   number | `${number}%`
  height:  number
  radius?: number
  style?:  object
  opacity: Animated.SharedValue<number>
}) {
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: '#e2e8f0' },
        style,
        animStyle,
      ]}
    />
  )
}

export default function PostSkeleton() {
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.card}>
      {/* Accent stripe */}
      <SkeletonRect width="100%" height={4} radius={0} opacity={opacity} />

      <View style={styles.body}>
        {/* Author row */}
        <View style={styles.authorRow}>
          <SkeletonRect width={44} height={44} radius={22} opacity={opacity} />
          <View style={styles.authorMeta}>
            <SkeletonRect width={128} height={13} opacity={opacity} style={{ marginBottom: 6 }} />
            <SkeletonRect width={80}  height={10} opacity={opacity} />
          </View>
          <SkeletonRect width={64} height={24} radius={12} opacity={opacity} />
        </View>

        {/* Content lines */}
        <View style={styles.contentBlock}>
          <SkeletonRect width="100%" height={12} opacity={opacity} style={{ marginBottom: 6 }} />
          <SkeletonRect width="83%"  height={12} opacity={opacity} style={{ marginBottom: 6 }} />
          <SkeletonRect width="66%"  height={12} opacity={opacity} />
        </View>

        {/* Reaction buttons */}
        <View style={styles.reactionRow}>
          <SkeletonRect width="31%" height={36} radius={10} opacity={opacity} />
          <SkeletonRect width="31%" height={36} radius={10} opacity={opacity} />
          <SkeletonRect width="31%" height={36} radius={10} opacity={opacity} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius:   16,
    borderWidth:    1,
    borderColor:    '#e2e8f0',
    backgroundColor:'#ffffff',
    overflow:       'hidden',
    marginBottom:   12,
  },
  body: {
    padding: 16,
  },
  authorRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    marginBottom:   12,
  },
  authorMeta: {
    flex: 1,
  },
  contentBlock: {
    marginBottom: 12,
  },
  reactionRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    gap:            8,
    marginTop:      4,
  },
})
