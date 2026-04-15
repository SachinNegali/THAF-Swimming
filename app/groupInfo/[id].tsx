import ExpensesTab from '@/components/groupInfo/ExpensesTab';
import { useGroup, useGroupMessages } from '@/hooks/api/useChats';
import { selectUser } from '@/store/selectors';
import type { Message } from '@/types/api';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSelector } from 'react-redux';
import { BottomActions } from '../../components/groupInfo/BottomActions';
import { GroupIdentity, type GroupIdentityMember } from '../../components/groupInfo/GroupIdentity';
import { Header } from '../../components/groupInfo/Header';
import { MediaGallery, type MediaItem } from '../../components/groupInfo/MediaGallery';
import { Colors } from '../../constants/theme';

function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light,
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];
  if (colorFromProps) return colorFromProps;
  return Colors[theme][colorName];
}

export default function GroupInfoScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const mutedColor = useThemeColor({}, 'textMuted');

  const { id, name: nameParam, isDm: isDmParam } = useLocalSearchParams<{
    id: string;
    name?: string;
    isDm?: string;
  }>();
  const groupId = id ?? '';

  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id ?? '';

  const { data: group, isLoading: groupLoading } = useGroup(groupId, !!groupId);
  const { data: messagePages } = useGroupMessages(groupId, undefined, undefined, !!groupId);

  const isDm = (group?.type ?? (isDmParam === '1' ? 'dm' : undefined)) === 'dm';

  const displayName = useMemo(() => {
    if (group?.name) return group.name;
    if (isDm && currentUserId && group?.members?.length) {
      const other = group.members.find((m) => m.userId !== currentUserId);
      const first = other?.user?.fName ?? '';
      const last = other?.user?.lName ?? '';
      const full = `${first} ${last}`.trim();
      if (full) return full;
    }
    return nameParam ?? 'Group';
  }, [group, isDm, currentUserId, nameParam]);

  const members = useMemo<GroupIdentityMember[]>(() => {
    if (!group?.members) return [];
    return group.members.map((m) => {
      const first = m.user?.fName ?? '';
      const last = m.user?.lName ?? '';
      const full = `${first} ${last}`.trim();
      const isMe = m.userId === currentUserId;
      return {
        id: m.userId || m._id || `${first}-${last}`,
        name: isMe ? 'You' : full || m.user?.email || 'Member',
      };
    });
  }, [group?.members, currentUserId]);

  const mediaItems = useMemo<MediaItem[]>(() => {
    const pages = messagePages?.pages ?? [];
    const messages: Message[] = pages.flatMap((p) => p.data ?? []);
    const out: MediaItem[] = [];
    for (const msg of messages) {
      if (msg.type !== 'image') continue;
      const images = msg.metadata?.images ?? [];
      for (const img of images) {
        const url = img.thumbnailUrl ?? img.optimizedUrl;
        if (url) out.push({ id: img.imageId, url });
      }
    }
    return out;
  }, [messagePages]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <Header title={displayName} onBack={() => router.back()} />
      {groupLoading && !group ? (
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={[styles.loadingText, { color: mutedColor }]}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          <GroupIdentity
            name={displayName}
            createdAt={group?.createdAt}
            members={members}
          />
          <MediaGallery items={mediaItems} />
          {groupId && !isDm ? <ExpensesTab groupId={groupId} /> : null}
        </ScrollView>
      )}
      <BottomActions
        hidden={isDm}
        onAddExpense={
          !isDm && groupId
            ? () => router.push(`/chat/${groupId}`)
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
});
