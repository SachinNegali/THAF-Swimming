import { Colors, SPACING } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ImageMessage, TextMessage } from '@/types/chat';
import { Image } from 'expo-image';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ImageUploadThumbnail from './ImageUploadThumbnail';

interface ChatBubbleProps {
  item: TextMessage | ImageMessage;
  isDm: boolean;
}

const ChatBubble = memo(({ item, isDm }: ChatBubbleProps) => {
  const backgroundColor = useThemeColor({ light: '#f1f5f9', dark: '#2d3e5a' }, 'surfaceLight');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const secondaryTextColor = useThemeColor({}, 'textMuted');

  const renderImageContent = (msg: ImageMessage, captionColor: string) => {
    if (!msg.images?.length) return null;
    return (
      <View>
        <View style={styles.imageGrid}>
          {msg.images.map((img) => (
            <ImageUploadThumbnail
              key={img.imageId}
              imageId={img.imageId}
              serverStatus={img.serverStatus}
              thumbnailUrl={img.thumbnailUrl}
              optimizedUrl={img.optimizedUrl}
              width={img.width}
              height={img.height}
              localUri={img.localUri ?? null}
              localStatus={img.localStatus}
              localError={img.localError ?? null}
              compact={msg.images.length > 1}
            />
          ))}
        </View>
        {msg.caption ? (
          <Text style={[styles.bubbleText, { color: captionColor, marginTop: 4 }]}>
            {msg.caption}
          </Text>
        ) : null}
      </View>
    );
  };

  // ─── My Bubble ──────────���─────────────────────────────
  if (item.isMe) {
    return (
      <View style={styles.myMessageContainer}>
        <View style={[styles.myBubble, { backgroundColor: primaryColor }]}>
          {item.type === 'image' ? (
            renderImageContent(item, item.isMe ? '#fff' : textColor)
          ) : (
            <Text style={[styles.bubbleText, { color: '#fff' }]}>
              {item.content}
            </Text>
          )}
        </View>
        {'status' in item && (
          <Text style={[styles.statusText, { color: secondaryTextColor }]}>
            Read {item.timestamp}
          </Text>
        )}
      </View>
    );
  }

  // ─── Their Bubble ─────────���───────────────────────────
  return (
    <View style={styles.theirMessageContainer}>
      {isDm ? <></> : <Image source={{ uri: item.senderAvatar }} style={styles.avatar} />}
      <View style={styles.theirContent}>
        <Text style={[styles.senderName, { color: secondaryTextColor }]}>
          {item.senderName}
        </Text>
        <View style={[styles.theirBubble, { backgroundColor: '#fff' }]}>
          {item.type === 'image' ? (
            renderImageContent(item, item.isMe ? '#fff' : textColor)
          ) : (
            <Text style={[styles.bubbleText, { color: textColor }]}>
              {item.content}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
});

export default ChatBubble;

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  // Their message
  theirMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    maxWidth: '75%',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  theirContent: {
    gap: 2,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  theirBubble: {
    borderRadius: 8,
    borderBottomLeftRadius: 2,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#c1c1c166'
  },

  // My message
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    maxWidth: '75%',
  },
  myBubble: {
    borderRadius: 8,
    borderBottomRightRadius: 2,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },

  // Shared
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  chatImage: {
    width: 200,
    height: 140,
    borderRadius: 12,
    marginVertical: 4,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 4,
  },
  statusText: {
    fontSize: 10,
    marginTop: 2,
    marginRight: 4,
  },
});
