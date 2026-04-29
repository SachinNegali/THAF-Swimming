import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

interface MediaGridProps {
  count?: number;
}

const TONES = ['#2d2d2a', '#3d3d39', '#4f4f49', '#5f5f58', '#6f6f68', '#7f7f78', '#8f8f88', '#9f9f97', '#afafa8'];

export const MediaGrid = React.memo(({ count = 9 }: MediaGridProps) => (
  <View style={styles.grid}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={[styles.tile, { backgroundColor: TONES[i % TONES.length] }]}>
        {i === 2 && (
          <View style={styles.playOverlay}>
            <Svg width="22" height="22" viewBox="0 0 20 20" fill={colors.white}>
              <Path d="M6 4l10 6-10 6z" />
            </Svg>
          </View>
        )}
      </View>
    ))}
  </View>
));

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  tile: {
    width: '32.66%',
    aspectRatio: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
