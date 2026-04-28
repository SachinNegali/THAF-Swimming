import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface ToggleProps {
  on: boolean;
  onChange: (next: boolean) => void;
}

const TRACK_WIDTH = 44;
const KNOB_SIZE = 20;
const TRAVEL = TRACK_WIDTH - KNOB_SIZE - 6;

export const Toggle = React.memo(({ on, onChange }: ToggleProps) => {
  const anim = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: on ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [on, anim]);

  const trackBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.n300, colors.ink],
  });
  const knobLeft = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 3 + TRAVEL],
  });

  return (
    <Pressable onPress={() => onChange(!on)}>
      <Animated.View style={[styles.track, { backgroundColor: trackBg }]}>
        <Animated.View style={[styles.knob, { left: knobLeft }]} />
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
