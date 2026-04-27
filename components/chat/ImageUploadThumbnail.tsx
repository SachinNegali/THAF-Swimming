/**
 * ImageUploadThumbnail
 *
 * Renders a single image attachment with an upload status overlay.
 * Shows progress bar while uploading, processing spinner, or error retry.
 */

import { Colors } from '@/constants/theme';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { restartUploadFromScratch } from '@/services/upload/UploadManager';
import { getUpload } from '@/stores/uploadStore';
import type { MessageImageEntry } from '@/types/api';
import type { UploadStatus } from '@/types/upload';
import { Image } from 'expo-image';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  imageId: string;
  /** Server-reported status (from message.metadata.images[]). */
  serverStatus: MessageImageEntry['status'];
  thumbnailUrl: string | null;
  optimizedUrl: string | null;
  width: number | null;
  height: number | null;
  mediaType?: 'image' | 'video';
  /** Present only on the sender's device while uploading. */
  localUri?: string | null;
  localStatus?: UploadStatus;
  localError?: string | null;
  compact?: boolean;
  onPress?: () => void;
}

const ImageUploadThumbnail = memo(
  ({
    imageId,
    serverStatus,
    thumbnailUrl,
    width,
    height,
    mediaType = 'image',
    localUri,
    localStatus,
    localError,
    compact,
    onPress,
  }: Props) => {
    const progress = useUploadProgress(
      localStatus === 'uploading' ? imageId : null,
    );

    // Prefer the processed server thumbnail once it's ready, fall back to
    // the sender's local file while the upload is in flight.
    const source = thumbnailUrl
      ? { uri: thumbnailUrl }
      : localUri
        ? { uri: localUri }
        : undefined;

    const aspectRatio =
      width && height ? Math.min(width / height, 2.5) : 4 / 3;
    const imageHeight = compact ? 100 : 160;
    const imageWidth = imageHeight * aspectRatio;

    const handleRetry = () => {
      const record = getUpload(imageId);
      if (record) restartUploadFromScratch(record);
    };

    // Resolved state: server "completed" trumps everything. Otherwise the
    // sender's local status drives the overlay; recipients fall back to the
    // server status.
    const isCompleted = serverStatus === 'completed';
    const isFailed =
      serverStatus === 'failed' || localStatus === 'failed';
    const displayStatus: UploadStatus | 'server-processing' = isCompleted
      ? 'completed'
      : isFailed
        ? 'failed'
        : localStatus ?? 'server-processing';

    const isVideo = mediaType === 'video';
    // Allow opening as soon as the server has finished processing.
    const canOpen = isCompleted && !!onPress;

    return (
      <Pressable
        style={[styles.container, { width: imageWidth, height: imageHeight }]}
        onPress={canOpen ? onPress : undefined}
        disabled={!canOpen}
      >
        {source ? (
          <Image
            source={source}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.image, styles.emptyTile]}>
            {isVideo ? <Text style={styles.videoFallback}>VIDEO</Text> : null}
          </View>
        )}

        {isCompleted && isVideo && (
          <View style={styles.playBadge} pointerEvents="none">
            <Text style={styles.playGlyph}>▶</Text>
          </View>
        )}

        {!isCompleted && (
          <View style={styles.overlay}>
            {displayStatus === 'uploading' && (
              <>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
                <Text style={styles.overlayText}>{progress}%</Text>
              </>
            )}

            {(displayStatus === 'queued' ||
              displayStatus === 'requesting-url') && (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.overlayText}>Waiting...</Text>
              </>
            )}

            {(displayStatus === 'completing' ||
              displayStatus === 'server-processing') && (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.overlayText}>Processing...</Text>
              </>
            )}

            {displayStatus === 'failed' && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                disabled={!localUri}
              >
                <Text style={styles.retryIcon}>!</Text>
                <Text style={styles.overlayText}>
                  {localUri ? 'Tap to retry' : 'Failed'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Pressable>
    );
  },
);

export default ImageUploadThumbnail;

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    marginVertical: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyTile: {
    backgroundColor: '#e2e8f0',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  overlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    width: '60%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  retryButton: {
    alignItems: 'center',
    gap: 4,
  },
  retryIcon: {
    color: Colors.light.danger,
    fontSize: 24,
    fontWeight: 'bold',
  },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 3,
  },
  videoFallback: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: '40%',
  },
});
