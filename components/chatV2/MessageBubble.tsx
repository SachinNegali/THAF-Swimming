import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import ImageUploadThumbnail from '../../components/chat/ImageUploadThumbnail';
import { colors, fonts } from '../../theme';
import { ChatMessage } from '../../types';
import { Avatar } from '../core/Avatar';
import { Kicker } from '../core/Kicker';
import { MediaViewer } from './MediaViewer';

interface MessageBubbleProps {
  m: ChatMessage;
}

const LIVE_COLOR = '#ff4444';
const AMBER = '#D4A017';

export const MessageBubble = React.memo(({ m }: MessageBubbleProps) => {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const closeViewer = useCallback(() => setViewerIndex(null), []);

  if (m.kind === 'system') {
    return (
      <View style={styles.systemRow}>
        <View style={styles.systemPill}>
          <Text style={styles.systemText}>{m.text} · {m.time}</Text>
        </View>
      </View>
    );
  }

  const mine = !!m.me;

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
      {!mine && <Avatar name={m.from} size={26} tone={m.tone ?? 0} />}
      <View style={[styles.col, mine ? styles.colMine : styles.colOther]}>
        {!mine && (
          <Text style={styles.fromLine}>
            {m.from} · {m.time}
          </Text>
        )}

        {m.kind === 'msg' && (
          <View
            style={[
              styles.textBubble,
              mine ? styles.textBubbleMine : styles.textBubbleOther,
            ]}
          >
            <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{m.text}</Text>
          </View>
        )}

        {m.kind === 'image' && (
          <View style={styles.imageCard}>
            {m.images && m.images.length > 0 ? (
              <View style={styles.imageGrid}>
                {m.images.map((img, idx) => (
                  <ImageUploadThumbnail
                    key={img.imageId}
                    imageId={img.imageId}
                    serverStatus={img.serverStatus}
                    thumbnailUrl={img.thumbnailUrl}
                    optimizedUrl={img.optimizedUrl}
                    width={img.width}
                    height={img.height}
                    mediaType={img.mediaType}
                    localUri={img.localUri ?? null}
                    localStatus={img.localStatus}
                    localError={img.localError ?? null}
                    compact={m.images!.length > 1}
                    onPress={() => setViewerIndex(idx)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Kicker style={styles.imageKicker}>{m.filename || 'IMG.HEIC'}</Kicker>
              </View>
            )}
            {m.caption && <Text style={styles.imageCaption}>{m.caption}</Text>}
          </View>
        )}

        {m.kind === 'image' && m.images && viewerIndex !== null && (
          <MediaViewer
            visible
            attachments={m.images}
            initialIndex={viewerIndex}
            onClose={closeViewer}
          />
        )}

        {m.kind === 'expense' && (
          <View style={styles.expenseCard}>
            <View style={styles.expenseHeader}>
              <Kicker>Expense added</Kicker>
              <View
                style={[
                  styles.statusTag,
                  { backgroundColor: m.status === 'pending' ? AMBER : LIVE_COLOR },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: m.status === 'pending' ? colors.ink : colors.white },
                  ]}
                >
                  {m.status}
                </Text>
              </View>
            </View>
            <View>
              <Text style={styles.expenseTitle}>{m.title}</Text>
              <View style={styles.expenseAmountRow}>
                <Text style={styles.expenseAmount}>{m.amount}</Text>
                <Text style={styles.expenseSplit}>{m.split}</Text>
              </View>
            </View>
            <View style={styles.expenseActions}>
              <Pressable style={styles.payBtn}>
                <Text style={styles.payBtnText}>{m.payCta || 'Pay now'}</Text>
              </Pressable>
              <Pressable style={styles.detailsBtn}>
                <Text style={styles.detailsText}>Details</Text>
              </Pressable>
            </View>
          </View>
        )}

        {m.kind === 'location' && (
          <View style={styles.locationCard}>
            <View style={styles.mapWrap}>
              <Svg width="100%" height="100%" viewBox="0 0 260 90" preserveAspectRatio="none">
                {[...Array(8)].map((_, i) => (
                  <Path
                    key={i}
                    d={`M -20 ${10 + i * 14} Q 60 ${i * 14}, 130 ${14 + i * 14} T 280 ${i * 14}`}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                    fill="none"
                  />
                ))}
                <Circle cx="130" cy="45" r="14" fill="none" stroke={AMBER} strokeOpacity={0.4} />
                <Circle cx="130" cy="45" r="7" fill={AMBER} />
              </Svg>
            </View>
            <View style={styles.locationBody}>
              <Kicker>{m.label}</Kicker>
              <Text style={styles.locationPlace}>{m.place}</Text>
              <Text style={styles.locationDistance}>{m.distance}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  systemRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 6,
  },
  systemPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.n100,
  },
  systemText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.n600,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  col: {
    maxWidth: '75%',
    gap: 4,
  },
  colMine: {
    alignItems: 'flex-end',
  },
  colOther: {
    alignItems: 'flex-start',
  },
  fromLine: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.n500,
    letterSpacing: 0.4,
    paddingLeft: 4,
  },
  textBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  textBubbleMine: {
    backgroundColor: colors.ink,
    borderBottomRightRadius: 4,
  },
  textBubbleOther: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20.3,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  bubbleTextMine: {
    color: colors.white,
  },
  imageCard: {
    width: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: colors.white,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 4,
  },
  imagePlaceholder: {
    aspectRatio: 4 / 3,
    backgroundColor: '#5a5a56',
    justifyContent: 'flex-end',
    padding: 10,
  },
  imageKicker: {
    color: 'rgba(255,255,255,0.8)',
  },
  imageCaption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    color: colors.n700,
    fontFamily: fonts.sans,
  },
  expenseCard: {
    width: 260,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    gap: 10,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  statusTag: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  expenseAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  expenseAmount: {
    fontFamily: fonts.mono,
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.4,
    color: colors.ink,
  },
  expenseSplit: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.n500,
    letterSpacing: 0.6,
  },
  expenseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  payBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.white,
    fontFamily: fonts.sans,
  },
  detailsBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.n300,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  locationCard: {
    width: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
  },
  mapWrap: {
    height: 90,
    backgroundColor: '#1a1a18',
  },
  locationBody: {
    padding: 12,
  },
  locationPlace: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    marginTop: 2,
    fontFamily: fonts.sans,
  },
  locationDistance: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.n500,
    letterSpacing: 0.8,
    marginTop: 4,
  },
});
