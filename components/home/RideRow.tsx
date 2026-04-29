import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { Ride } from '../../types';
import { Avatar } from '../core/Avatar';

interface RideRowProps {
  r: Ride;
  onPress: () => void;
  index?: number;
}

export const RideRow = React.memo(({ r, onPress, index = 0 }: RideRowProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;


  console.log('RECOMMENDED...r', r);

  const from = r?.startLocation?.name;
  const to = r?.destination?.name;
  const {title, startDate, participants, endDate} = r

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300 + index * 80, delay, useNativeDriver: true }),
      Animated.timing(translateAnim, { toValue: 0, duration: 300 + index * 80, delay, useNativeDriver: true }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateAnim }] }}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.container, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
        <View style={styles.topRow}>
          <View style={styles.leftContent}>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{r.tag}</Text>
              </View>
              <View style={[styles.tag, styles.outlinedTag]}>
                <Text style={styles.tagText}>{r.level}</Text>
              </View>
            </View>
            {/* <Text style={styles.title}>{r.title}</Text> */}
            <Text style={styles.title}>{title}</Text>
            
            <View style={styles.routeRow}>
              {/* <Text style={styles.routeText}>{r.from}</Text> */}
              <Text style={styles.routeText}>{from}</Text>
              
              <Text style={styles.routeArrow}> → </Text>
              {/* <Text style={styles.routeText}>{r.to}</Text> */}
              <Text style={styles.routeText}>{to}</Text>
            </View>
          </View>
          <View style={styles.rightContent}>
            <Text style={styles.date}>{new Date(startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            })}</Text>
            <Text style={styles.dateLabel}>Departs</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>D</Text>
              <Text style={styles.metricValue}>{r.dist}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>T</Text>
              <Text style={styles.metricValue}>{r.days}d</Text>
              {/* <Text style={styles.metricValue}>{diffInDays}d</Text> */}
            </View>
          </View>
          <View style={styles.spots}>
            <View style={styles.avatars}>
              {[0, 1, 2].map(i => (
                <View key={i} style={{ marginLeft: i > 0 ? -8 : 0 }}>
                  <Avatar name={`R${i+1}`} size={20} tone={i} />
                </View>
              ))}
            </View>
            <Text style={styles.spotsText}>
              {/* {r.spots}<Text style={{ color: colors.n500 }}>/{r.total}</Text> */}
              {participants.length}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
  },
  tagRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: colors.n100,
    borderRadius: 999,
    marginRight: 6,
  },
  outlinedTag: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.n200,
  },
  tagText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: 'uppercase',
    color: colors.n600,
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.255,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  routeText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.44,
    color: colors.n500,
  },
  routeArrow: {
    color: colors.n500,
    opacity: 0.5,
    fontSize: 11,
  },
  rightContent: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: 0.26,
    color: colors.ink,
  },
  dateLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.08,
    color: colors.n500,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.n100,
  },
  metrics: {
    flexDirection: 'row',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metricLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.n500,
    marginRight: 4,
  },
  metricValue: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.ink,
  },
  spots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  spotsText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.ink,
  },
});