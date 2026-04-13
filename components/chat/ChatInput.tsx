import { Colors, SPACING } from '@/constants/theme';
import { useSendDMMessage, useSendGroupMessage } from '@/hooks/api/useChats';
import {
  pickImages,
  startImageUploads,
  type SelectedImage,
} from '@/hooks/useMediaUpload';
import { useThemeColor } from '@/hooks/use-theme-color';
import { queryKeys } from '@/lib/react-query/queryClient';
import { store } from '@/store';
import type { ImageMessage, ListItem } from '@/types/chat';
import type { Message, PaginatedResponse } from '@/types/api';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import React, { memo, useCallback, useState } from 'react';
import {
  Platform,
  ScrollView,
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
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);

  const bgColor = useThemeColor({}, 'background');
  const inputBg = useThemeColor({}, 'surfaceLight');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'textDim');

  const sendMessage = useSendGroupMessage();
  const sendDMMessage = useSendDMMessage();
  const qc = useQueryClient();

  // ─── Image Picker ─────────────────────────────────────
  const handlePickImages = useCallback(async () => {
    const images = await pickImages();
    if (images.length > 0) {
      setSelectedImages((prev) => [...prev, ...images]);
    }
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Send ─────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = text.trim();
    const hasImages = selectedImages.length > 0;
    if ((!trimmed && !hasImages) || sending) return;

    setSending(true);
    const imagesToSend = [...selectedImages];
    setText('');
    setSelectedImages([]);

    try {
      // ── DM mode: use the dedicated DM endpoint ──
      if (recipientId && !groupId) {
        // Send text first if present
        if (trimmed) {
          const response = await sendDMMessage.mutateAsync({
            recipientId,
            data: { content: trimmed },
          });
          const realGroupId = response?.group ?? response?.data?.groupId;
          if (realGroupId) {
            // Upload images to the resolved group
            if (imagesToSend.length > 0) {
              await sendWithImages(realGroupId, imagesToSend, '');
            }
            router.replace({
              pathname: '/chat/[id]',
              params: { id: realGroupId },
            });
          }
        } else if (imagesToSend.length > 0) {
          // Only images, no text — still need to resolve the DM first
          const response = await sendDMMessage.mutateAsync({
            recipientId,
            data: { content: '' },
          });
          const realGroupId = response?.group ?? response?.data?.groupId;
          if (realGroupId) {
            await sendWithImages(realGroupId, imagesToSend, '');
            router.replace({
              pathname: '/chat/[id]',
              params: { id: realGroupId },
            });
          }
        }
        return;
      }

      // ── Regular group message ──
      if (!groupId) {
        console.warn('[ChatInput] No groupId available');
        setText(trimmed);
        setSelectedImages(imagesToSend);
        return;
      }

      // Text-only message
      if (!hasImages) {
        await sendMessage.mutateAsync({
          groupId,
          data: { content: trimmed },
        });
        return;
      }

      // Images (with optional text)
      // Send text as a regular message if present
      if (trimmed) {
        await sendMessage.mutateAsync({
          groupId,
          data: { content: trimmed },
        });
      }
      await sendWithImages(groupId, imagesToSend, '');
    } catch (err) {
      console.warn('[ChatInput] Send failed:', err);
      setText(trimmed);
      setSelectedImages(imagesToSend);
    } finally {
      setSending(false);
    }
  };

  /**
   * Start image uploads and inject an optimistic image message into the cache.
   */
  const sendWithImages = async (
    chatId: string,
    images: SelectedImage[],
    caption: string,
  ) => {
    const { messageId, records } = await startImageUploads(chatId, images);
    const currentUserId = store.getState().auth.user?._id ?? '';

    // Inject optimistic image message into React Query cache
    type MessagesCache = { pages: PaginatedResponse<Message>[]; pageParams: unknown[] };

    const optimisticMessage: Message = {
      _id: `upload-${messageId}`,
      group: chatId,
      sender: currentUserId,
      content: caption,
      type: 'image',
      isDeleted: false,
      readBy: [],
      deliveredTo: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Extra fields for the upload pipeline (cast as needed)
      ...(({ _uploadMessageId: messageId }) as any),
    };

    qc.setQueryData<MessagesCache>(
      queryKeys.groups.messages(chatId),
      (old) => {
        if (!old?.pages?.length) {
          return {
            pages: [{ data: [optimisticMessage], pagination: {} as any }],
            pageParams: [undefined],
          };
        }
        const firstPage = old.pages[0];
        return {
          ...old,
          pages: [
            { ...firstPage, data: [...firstPage.data, optimisticMessage] },
            ...old.pages.slice(1),
          ],
        };
      },
    );
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: bgColor, borderColor }]}>
      {/* ─── Selected Images Preview ─────────────────────── */}
      {selectedImages.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.previewStrip}
          contentContainerStyle={styles.previewContent}
        >
          {selectedImages.map((img, index) => (
            <View key={`${img.uri}-${index}`} style={styles.previewItem}>
              <Image
                source={{ uri: img.uri }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveImage(index)}
              >
                <Text style={styles.removeText}>x</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ─── Input Row ───────────────────────────────────── */}
      <View style={styles.row}>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TouchableOpacity onPress={handlePickImages}>
            <Text style={{ fontSize: 24, color: iconColor }}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickImages}>
            <Text style={{ fontSize: 24, color: iconColor }}>📎</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            style={[styles.input, { color: textColor }]}
            placeholder={
              selectedImages.length > 0
                ? 'Add a caption...'
                : 'Type a message...'
            }
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
  // ─── Preview strip ──────────────────────────────────
  previewStrip: {
    marginBottom: SPACING.sm,
    maxHeight: 80,
  },
  previewContent: {
    gap: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  previewItem: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
});
