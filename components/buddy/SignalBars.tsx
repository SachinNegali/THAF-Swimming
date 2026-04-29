import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

interface SignalBarsProps {
  n: number;
}

export const SignalBars = React.memo(({ n }: SignalBarsProps) => (
  <View style={styles.row}>
    {[3, 6, 9, 12].map((h, i) => (
      <View
        key={i}
        style={[
          styles.bar,
          { height: h, backgroundColor: i < n ? colors.ink : colors.n300 },
        ]}
      />
    ))}
  </View>
));

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 12,
  },
  bar: {
    width: 3,
    borderRadius: 1,
  },
});
