/**
 * MediaViewer
 *
 * Fullscreen modal for viewing chat images and videos. Supports
 * horizontal swiping between siblings (the images[] of one message)
 * and a "Save to Photos" action that downloads from the AWS URL and
 * persists to the device's media library.
 */

import type { ImageAttachment } from '@/types/chat';
import { Image } from 'expo-image';
import { downloadAsync, cacheDirectory } from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  attachments: ImageAttachment[];
  initialIndex: number;
  onClose: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const MediaViewer = memo(({ visible, attachments, initialIndex, onClose }: Props) => {
  const listRef = useRef<FlatList<ImageAttachment>>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setActiveIndex(initialIndex);
  }, [visible, initialIndex]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      setActiveIndex(idx);
    },
    [],
  );

  const active = attachments[activeIndex];
  const total = attachments.length;

  const handleSave = useCallback(async () => {
    if (!active?.optimizedUrl || saving) return;
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Allow access to your photo library to save media.',
        );
        return;
      }

      const ext = inferExtension(active);
      const target = `${cacheDirectory ?? ''}${active.imageId}.${ext}`;
      const { uri } = await downloadAsync(active.optimizedUrl, target);
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', `${active.mediaType === 'video' ? 'Video' : 'Image'} saved to your library.`);
    } catch (err) {
      console.warn('[MediaViewer] save failed', err);
      Alert.alert('Save failed', 'Could not save this media. Try again.');
    } finally {
      setSaving(false);
    }
  }, [active, saving]);

  const renderItem = useCallback(
    ({ item, index }: { item: ImageAttachment; index: number }) => (
      <View style={styles.page}>
        <MediaPage attachment={item} active={index === activeIndex && visible} />
      </View>
    ),
    [activeIndex, visible],
  );

  const keyExtractor = useCallback((a: ImageAttachment) => a.imageId, []);

  const initialScrollIndex = useMemo(() => initialIndex, [initialIndex]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          {/* ─── Header ─── */}
          <View style={styles.header}>
            <Pressable hitSlop={12} onPress={onClose} style={styles.iconBtn}>
              <Text style={styles.iconText}>✕</Text>
            </Pressable>
            <Text style={styles.counter}>
              {total > 1 ? `${activeIndex + 1} / ${total}` : ''}
            </Text>
            <Pressable
              hitSlop={12}
              onPress={handleSave}
              style={[styles.iconBtn, saving && styles.iconBtnDisabled]}
              disabled={saving || !active?.optimizedUrl}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </Pressable>
          </View>

          {/* ─── Pager ─── */}
          <FlatList
            ref={listRef}
            data={attachments}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialScrollIndex}
            getItemLayout={(_, i) => ({
              length: SCREEN_W,
              offset: SCREEN_W * i,
              index: i,
            })}
            onMomentumScrollEnd={onScrollEnd}
            // Avoid re-mounting all pages on close/reopen
            removeClippedSubviews
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
});

export default MediaViewer;

// ─── Per-page renderer ─────────────────────────────────────

interface PageProps {
  attachment: ImageAttachment;
  active: boolean;
}

const MediaPage = memo(({ attachment, active }: PageProps) => {
  if (attachment.mediaType === 'video' && attachment.optimizedUrl) {
    return <VideoPage url={attachment.optimizedUrl} active={active} />;
  }

  const uri = attachment.optimizedUrl ?? attachment.thumbnailUrl ?? attachment.localUri ?? null;
  if (!uri) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.media}
      contentFit="contain"
      transition={150}
    />
  );
});

const VideoPage = memo(({ url, active }: { url: string; active: boolean }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  return (
    <VideoView
      player={player}
      style={styles.media}
      contentFit="contain"
      allowsFullscreen
      allowsPictureInPicture={false}
      nativeControls
    />
  );
});

// ─── Helpers ───────────────────────────────────────────────

function inferExtension(a: ImageAttachment): string {
  if (a.mimeType) {
    const sub = a.mimeType.split('/')[1];
    if (sub) return sub.split(';')[0];
  }
  // Fallback from URL pathname
  try {
    const u = a.optimizedUrl ?? '';
    const path = u.split('?')[0];
    const dot = path.lastIndexOf('.');
    if (dot !== -1) return path.slice(dot + 1).toLowerCase();
  } catch {}
  return a.mediaType === 'video' ? 'mp4' : 'jpg';
}

// ─── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 2,
  },
  iconBtn: {
    minWidth: 56,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDisabled: {
    opacity: 0.5,
  },
  iconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  counter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  page: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: SCREEN_W,
    height: SCREEN_H * 0.85,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
