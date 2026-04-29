import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Buddy } from '../../types';
import { BuddyMarker } from './BuddyMarker';

interface BuddyDotsProps {
  buddies: Buddy[];
  onTap?: (b: Buddy) => void;
}

export const BuddyDots = React.memo(({ buddies, onTap }: BuddyDotsProps) => (
  <View style={styles.layer} pointerEvents="box-none">
    {buddies.map((b) => (
      <BuddyMarker key={b.id} buddy={b} onPress={onTap} />
    ))}
  </View>
));

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
