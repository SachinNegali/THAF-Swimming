import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import { Image } from 'expo-image';
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
import { IconDownload, IconX } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import type { ImageAttachment } from '../../types/chat';
import { Kicker } from '../core/Kicker';

interface Props {
  visible: boolean;
  attachments: ImageAttachment[];
  initialIndex: number;
  onClose: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const MediaViewer = memo(({ visible, attachments, initialIndex, onClose }: Props) => {
  const listRef = useRef<FlatList<ImageAttachment>>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setActiveIndex(initialIndex);
  }, [visible, initialIndex]);

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setActiveIndex(idx);
  }, []);

  const active = attachments[activeIndex];
  const total = attachments.length;
  const isVideo = active?.mediaType === 'video';

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
      Alert.alert('Saved', `${isVideo ? 'Video' : 'Image'} saved to your library.`);
    } catch (err) {
      console.warn('[MediaViewerV2] save failed', err);
      Alert.alert('Save failed', 'Could not save this media. Try again.');
    } finally {
      setSaving(false);
    }
  }, [active, saving, isVideo]);

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

  const canSave = !!active?.optimizedUrl;

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
          <View style={styles.header}>
            <Pressable hitSlop={12} onPress={onClose} style={styles.iconBtn}>
              <IconX size={16} color={colors.white} />
            </Pressable>

            <View style={styles.meta}>
              <Kicker style={styles.metaKicker}>
                {isVideo ? 'Video' : 'Image'}
              </Kicker>
              {total > 1 && (
                <Text style={styles.counter}>
                  {activeIndex + 1} / {total}
                </Text>
              )}
            </View>

            <Pressable
              hitSlop={12}
              onPress={handleSave}
              style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
              disabled={saving || !canSave}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.ink} />
              ) : (
                <>
                  <IconDownload size={14} color={colors.ink} />
                  <Text style={styles.saveText}>Save</Text>
                </>
              )}
            </Pressable>
          </View>

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
            removeClippedSubviews
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
});

interface PageProps {
  attachment: ImageAttachment;
  active: boolean;
}

const MediaPage = memo(({ attachment, active }: PageProps) => {
  if (attachment.mediaType === 'video') {
    const url = attachment.optimizedUrl ?? attachment.localUri ?? null;
    if (!url) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.white} />
        </View>
      );
    }
    return <VideoPage url={url} active={active} />;
  }

  const uri =
    attachment.optimizedUrl ?? attachment.thumbnailUrl ?? attachment.localUri ?? null;
  if (!uri) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.white} />
      </View>
    );
  }

  return (
    <Image source={{ uri }} style={styles.media} contentFit="contain" transition={150} />
  );
});

const VideoPage = memo(({ url, active }: { url: string; active: boolean }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (active) player.play();
    else player.pause();
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

function inferExtension(a: ImageAttachment): string {
  if (a.mimeType) {
    const sub = a.mimeType.split('/')[1];
    if (sub) return sub.split(';')[0];
  }
  try {
    const u = a.optimizedUrl ?? '';
    const path = u.split('?')[0];
    const dot = path.lastIndexOf('.');
    if (dot !== -1) return path.slice(dot + 1).toLowerCase();
  } catch {}
  return a.mediaType === 'video' ? 'mp4' : 'jpg';
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    alignItems: 'center',
    gap: 2,
  },
  metaKicker: {
    color: 'rgba(255,255,255,0.55)',
  },
  counter: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.white,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
    letterSpacing: -0.13,
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

export default MediaViewer;
