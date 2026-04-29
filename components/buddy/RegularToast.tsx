import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { Avatar } from '../core/Avatar';

interface RegularToastProps {
  fromName: string;
  fromCs: string;
  message: string;
  tone?: number;
  onDismiss: () => void;
  duration?: number;
}

export const RegularToast = React.memo(({ fromName, fromCs, message, tone = 0, onDismiss, duration = 3500 }: RegularToastProps) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.toast}>
        <Avatar name={fromName} size={26} tone={tone} />
        <View style={styles.body}>
          <Text style={styles.cs}>{fromCs}</Text>
          <Text numberOfLines={1} style={styles.msg}>{message}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 70,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  body: {
    minWidth: 0,
    flexShrink: 1,
  },
  cs: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.n500,
  },
  msg: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.07,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
});
