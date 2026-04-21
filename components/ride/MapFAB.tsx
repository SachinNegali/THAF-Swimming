import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface MapFABProps {
  onPress: () => void;
  onPressActions: () => void;
}

export default function MapFAB({ onPress, onPressActions }: MapFABProps) {
  return (
    <View style={{ gap: 6, position: 'absolute', bottom: 10, right: 16, zIndex: 10 }}>
    <Pressable
      style={styles.fab}
      onPress={onPress}
    //   activeOpacity={0.2}
    >
      <Ionicons name="people" size={20} color="white" />
    </Pressable>
    <Pressable
      style={styles.fab}
      onPress={onPressActions}
    //   activeOpacity={0.2}
    >
      <Ionicons name="flash" size={20} color="white" />
    </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    // position: 'absolute',
    // bottom: Platform.OS === 'ios' ? 110 : 90,
    // bottom: 10,
    // right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    bottom: 80,
    backgroundColor: '#3d3d3d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00000066',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#c1c1c1',
  },
});
