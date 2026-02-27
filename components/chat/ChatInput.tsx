import { Colors, SPACING } from '@/constants/theme';
import { useSendGroupMessage } from '@/hooks/api/useChats';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { memo, useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ChatInputProps {
  groupId: string;
}

const ChatInput = memo(({ groupId }: ChatInputProps) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [e2eeReady, setE2eeReady] = useState(false);

  const bgColor = useThemeColor({}, 'background');
  const inputBg = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'textDim');

  const sendPlain = useSendGroupMessage();

  // Check E2EE availability lazily (no static crypto import)
  useEffect(() => {
    (async () => {
      try {
        const { CryptoService } = await import('@/lib/crypto');
        setE2eeReady(CryptoService.isInitialized());
      } catch {
        setE2eeReady(false);
      }
    })();
  }, []);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText('');

    try {
      if (e2eeReady) {
        // E2EE path: encrypt via SenderKey then POST (loaded dynamically)
        const { CryptoService } = await import('@/lib/crypto');
        const { apiClient } = await import('@/lib/api/client');
        const { endpoints } = await import('@/lib/api/endpoints');

        const { ciphertext } = await CryptoService.encryptGroupMessage(
          groupId,
          trimmed,
        );

        await apiClient.post(endpoints.encryptedMessages.send(groupId), {
          ciphertext,
          type: 'text',
          isGroup: true,
        });
      } else {
        // Plaintext fallback
        await sendPlain.mutateAsync({
          groupId,
          data: { content: trimmed },
        });
      }
    } catch (err) {
      console.warn('[ChatInput] Send failed:', err);
      // Restore text so user can retry
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

      {/* E2EE indicator */}
      {e2eeReady && (
        <View style={styles.e2eeRow}>
          <Text style={styles.e2eeText}>🔒 End-to-end encrypted</Text>
        </View>
      )}

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
  e2eeRow: {
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  e2eeText: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '600',
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
