/**
 * ImageUploadThumbnail
 *
 * Renders a single image attachment with an upload status overlay.
 * Shows progress bar while uploading, processing spinner, or error retry.
 */

import { Colors, SPACING } from '@/constants/theme';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { restartUploadFromScratch } from '@/services/upload/UploadManager';
import { getUpload } from '@/stores/uploadStore';
import type { UploadStatus } from '@/types/upload';
import { Image } from 'expo-image';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  imageId: string;
  localUri: string;
  status: UploadStatus;
  thumbnailUrl: string | null;
  optimizedUrl: string | null;
  width: number | null;
  height: number | null;
  error: string | null;
  compact?: boolean;
}

const ImageUploadThumbnail = memo(
  ({ imageId, localUri, status, thumbnailUrl, width, height, error, compact }: Props) => {
    const progress = useUploadProgress(
      status === 'uploading' ? imageId : null,
    );

    // Pick the best image source
    const source = thumbnailUrl
      ? { uri: thumbnailUrl }
      : { uri: localUri };

    const aspectRatio =
      width && height ? Math.min(width / height, 2.5) : 4 / 3;
    const imageHeight = compact ? 100 : 160;
    const imageWidth = imageHeight * aspectRatio;

    const handleRetry = () => {
      const record = getUpload(imageId);
      if (record) restartUploadFromScratch(record);
    };

    return (
      <View style={[styles.container, { width: imageWidth, height: imageHeight }]}>
        <Image
          source={source}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />

        {/* ─── Status overlay ──────────────────────────── */}
        {status !== 'completed' && (
          <View style={styles.overlay}>
            {status === 'uploading' && (
              <>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
                <Text style={styles.overlayText}>{progress}%</Text>
              </>
            )}

            {(status === 'queued' || status === 'requesting-url') && (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.overlayText}>Waiting...</Text>
              </>
            )}

            {status === 'completing' && (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.overlayText}>Processing...</Text>
              </>
            )}

            {status === 'failed' && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
              >
                <Text style={styles.retryIcon}>!</Text>
                <Text style={styles.overlayText}>Tap to retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
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
});
