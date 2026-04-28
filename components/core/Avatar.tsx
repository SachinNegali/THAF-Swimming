import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../../theme';

interface AvatarProps {
  name?: string;
  size?: number;
  tone?: number;
  src?: string;
}

const TONES = [
  { bg: '#1C1C1A', fg: '#fff' },
  { bg: '#E8E8E1', fg: '#1C1C1A' },
  { bg: '#2D2D2A', fg: '#F1F1EA' },
  { bg: '#3A3A37', fg: '#F1F1EA' },
];

export const Avatar = React.memo(({ name = 'U', size = 32, tone = 0, src }: AvatarProps) => {
  const { bg, fg } = TONES[tone % TONES.length];
  const initial = useMemo(() => name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase(), [name]);

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: src ? '#ddd' : bg }]}>
      {src ? (
        <Image source={{ uri: src }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <Text style={[styles.text, { color: fg, fontSize: size * 0.38 }]}>{initial}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  text: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    letterSpacing: -0.16,
  },
});