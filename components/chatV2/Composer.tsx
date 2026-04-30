import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { IconArrowRight, IconPlus, IconX } from '../../icons/Icons';
import { colors, fonts } from '../../theme';

export interface ComposerAttachment {
  uri: string;
}

interface ComposerProps {
  onPlus: () => void;
  onSend?: (text: string) => void;
  attachments?: ComposerAttachment[];
  onRemoveAttachment?: (index: number) => void;
}

export const Composer = React.memo(
  ({ onPlus, onSend, attachments = [], onRemoveAttachment }: ComposerProps) => {
    const [msg, setMsg] = useState('');
    const hasText = msg.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    const canSend = hasText || hasAttachments;

    const handleSend = () => {
      if (!canSend) return;
      onSend?.(msg.trim());
      setMsg('');
    };

    return (
      <View style={styles.container}>
        {hasAttachments && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.previewStrip}
            contentContainerStyle={styles.previewContent}
          >
            {attachments.map((att, idx) => (
              <View key={`${att.uri}-${idx}`} style={styles.previewItem}>
                <Image source={{ uri: att.uri }} style={styles.previewImage} contentFit="cover" />
                {onRemoveAttachment && (
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => onRemoveAttachment(idx)}
                    hitSlop={6}
                  >
                    <IconX size={10} color={colors.white} />
                  </Pressable>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.bar}>
          <Pressable onPress={onPlus} style={styles.plusBtn}>
            <IconPlus size={18} color={colors.n500} />
          </Pressable>
          <TextInput
            value={msg}
            onChangeText={setMsg}
            placeholder={hasAttachments ? 'Add a caption…' : 'Message the pack…'}
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
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: colors.n100,
    backgroundColor: colors.paper,
  },
  previewStrip: {
    marginBottom: 8,
    maxHeight: 76,
  },
  previewContent: {
    gap: 8,
    paddingRight: 8,
  },
  previewItem: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.n100,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
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
