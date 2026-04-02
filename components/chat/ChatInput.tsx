import { Colors, SPACING } from '@/constants/theme';
import { useSendDMMessage, useSendGroupMessage } from '@/hooks/api/useChats';
import { useThemeColor } from '@/hooks/use-theme-color';
import { router } from 'expo-router';
import React, { memo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ChatInputProps {
  /** Real group/DM ID — undefined when in pending-DM mode */
  groupId?: string;
  /** Set when this is a pending DM that hasn't been created yet */
  recipientId?: string;
}

const ChatInput = memo(({ groupId, recipientId }: ChatInputProps) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const bgColor = useThemeColor({}, 'background');
  const inputBg = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'textDim');

  const sendMessage = useSendGroupMessage();
  const sendDMMessage = useSendDMMessage();

  console.log("FIX SHIT......!! IN INPUT", groupId, "recipientId", recipientId)
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText('');

    try {
      // ── DM mode: use the dedicated DM endpoint ──
      if (recipientId && !groupId) {
        console.log("FIX SHIT......!! IN INPUT INSIDEE DM")
        const response = await sendDMMessage.mutateAsync({
          recipientId,
          data: { content: trimmed },
        });

        // The backend returns { group: groupId, data: message }
        const realGroupId = response?.group ?? response?.data?.groupId;

        if (realGroupId) {
          // Navigate to the real group chat
          console.log("FIX SHIT......!! IN INPUT INSIDEE DM BEFORE ROUTER", realGroupId)
          router.replace({
            pathname: '/chat/[id]',
            params: { id: realGroupId },
          });
          console.log("FIX SHIT......!! IN INPUT INSIDEE DM AFTER ROUTER", realGroupId)
        }
        return;
      }

      // ── Regular group message ──
      if (!groupId) {
        console.log("FIX SHIT......!! IN INPUT INSIDEE GROUP NO GROUPID")
        console.warn('[ChatInput] No groupId available');
        setText(trimmed);
        return;
      }
      console.log("FIX SHIT......!! IN INPUT INSIDEE GROUP HAS GROUPID ")
      await sendMessage.mutateAsync({
        groupId,
        data: { content: trimmed },
      });
    } catch (err) {
      console.warn('[ChatInput] Send failed:', err);
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.row}>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TouchableOpacity>
            <Text style={{ fontSize: 24, color: iconColor }}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={{ fontSize: 24, color: iconColor }}>📎</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            style={[styles.input, { color: textColor }]}
            placeholder="Type a message..."
            placeholderTextColor={placeholderColor}
            editable={!sending}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.inputAction,
              { backgroundColor: `${primaryColor}20` },
            ]}
          >
            <Text style={{ color: primaryColor }}>$</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: primaryColor, opacity: sending ? 0.5 : 1 },
          ]}
          onPress={handleSend}
          disabled={sending}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>↑</Text>
        </TouchableOpacity>
      </View>

      {/* iOS Home Indicator spacer */}
      <View style={styles.homeIndicator} />
    </View>
  );
});

export default ChatInput;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingLeft: SPACING.md,
    paddingRight: 4,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  inputAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIndicator: {
    width: 130,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
  },
});
