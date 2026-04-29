import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { IconArrowRight, IconPlus } from '../../icons/Icons';
import { colors, fonts } from '../../theme';

interface ComposerProps {
  onPlus: () => void;
  onSend?: (text: string) => void;
}

export const Composer = React.memo(({ onPlus, onSend }: ComposerProps) => {
  const [msg, setMsg] = useState('');
  const canSend = msg.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSend?.(msg.trim());
    setMsg('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <Pressable onPress={onPlus} style={styles.plusBtn}>
          <IconPlus size={18} color={colors.n500} />
        </Pressable>
        <TextInput
          value={msg}
          onChangeText={setMsg}
          placeholder="Message the pack…"
          placeholderTextColor={colors.n500}
          style={styles.input}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnIdle]}
        >
          <IconArrowRight size={16} color={canSend ? colors.white : colors.n500} />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: colors.n100,
    backgroundColor: colors.paper,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 22,
    padding: 4,
    paddingLeft: 14,
  },
  plusBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 10,
    paddingHorizontal: 4,
    maxHeight: 120,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.ink,
  },
  sendBtnIdle: {
    backgroundColor: colors.n200,
  },
});
