import { useCreateGroup } from '@/hooks/api/useChats';
import { useSearchUsers, type UserSearchResult } from '@/hooks/api/useUser';
import { useDebounce } from '@/hooks/useDebounce';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { IconCheck, IconSearch, IconX } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { BottomSheet } from '../core/BottomSheetWrapper';
import { PrimaryButton } from '../core/form/PrimaryButton';
import { Kicker } from '../core/Kicker';

interface CreateGroupSheetProps {
  visible: boolean;
  onClose: () => void;
  initialUsers: UserSearchResult[];
}

export const CreateGroupSheet = React.memo(
  ({ visible, onClose, initialUsers }: CreateGroupSheetProps) => {
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const debouncedSearch = useDebounce(searchQuery, 400);
    const { data: searchData, isFetching: isSearching } =
      useSearchUsers(debouncedSearch);
    const { mutate: createGroup, isPending: isCreating } = useCreateGroup();

    const searchResults = searchData?.users ?? [];

    const displayedUsers = useMemo(() => {
      if (debouncedSearch.trim().length >= 3) return searchResults;
      return initialUsers;
    }, [debouncedSearch, searchResults, initialUsers]);

    const selectedUsers = useMemo(() => {
      const map = new Map<string, UserSearchResult>();
      [...initialUsers, ...searchResults].forEach((u) => map.set(u.id, u));
      return selectedIds
        .map((id) => map.get(id))
        .filter((u): u is UserSearchResult => !!u);
    }, [selectedIds, initialUsers, searchResults]);

    const reset = () => {
      setGroupName('');
      setSearchQuery('');
      setSelectedIds([]);
    };

    const handleClose = () => {
      reset();
      onClose();
    };

    const toggleUser = (id: string) => {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    };

    const canSubmit =
      groupName.trim().length > 0 && selectedIds.length > 0 && !isCreating;

    const handleSubmit = () => {
      if (!canSubmit) return;
      createGroup(
        {
          name: groupName.trim(),
          memberIds: selectedIds,
          type: 'group',
        },
        {
          onSuccess: () => {
            reset();
            onClose();
          },
        },
      );
    };

    const showMinChars =
      debouncedSearch.trim().length > 0 && debouncedSearch.trim().length < 3;

    return (
      <BottomSheet visible={visible} onClose={handleClose} snapPoints={['92%']} scrollable>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerBody}>
              <Kicker>New group</Kicker>
              <Text style={styles.headerTitle}>
                Bring the <Text style={styles.headerTitleItalic}>pack</Text> together
              </Text>
            </View>
            <Pressable onPress={handleClose} style={styles.iconBtn} hitSlop={8}>
              <IconX size={14} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Group name</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="E.g. Spiti Circuit"
              placeholderTextColor={colors.n500}
              value={groupName}
              onChangeText={setGroupName}
              maxLength={40}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Add members</Text>
            <View style={styles.searchWrap}>
              <IconSearch size={14} color={colors.n500} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or @username"
                placeholderTextColor={colors.n500}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <IconX size={12} color={colors.n500} />
                </Pressable>
              )}
            </View>
          </View>

          {selectedUsers.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.label}>
                Selected · {selectedUsers.length}
              </Text>
              <View style={styles.chipRow}>
                {selectedUsers.map((u) => (
                  <Pressable
                    key={u.id}
                    style={styles.chip}
                    onPress={() => toggleUser(u.id)}
                  >
                    <Text style={styles.chipText} numberOfLines={1}>
                      {u.name}
                    </Text>
                    <IconX size={10} color={colors.white} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.listSection}>
            <Text style={styles.label}>
              {debouncedSearch.trim().length >= 3 ? 'Results' : 'Suggested'}
            </Text>

            {isSearching ? (
              <View style={styles.empty}>
                <ActivityIndicator color={colors.ink} />
              </View>
            ) : showMinChars ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  Type at least 3 characters
                </Text>
              </View>
            ) : displayedUsers.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {debouncedSearch.trim().length >= 3
                    ? 'No users found'
                    : 'Search for users to add'}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {displayedUsers.map((u) => {
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <Pressable
                      key={u.id}
                      onPress={() => toggleUser(u.id)}
                      style={({ pressed }) => [
                        styles.userRow,
                        isSelected && styles.userRowSelected,
                        pressed && styles.userRowPressed,
                      ]}
                    >
                      {u.picture ? (
                        <Image source={{ uri: u.picture }} style={styles.userAvatar} />
                      ) : (
                        <View style={styles.userAvatarFallback}>
                          <Text style={styles.userAvatarText}>
                            {u.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.userBody}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {u.name}
                        </Text>
                        <Text style={styles.userHandle} numberOfLines={1}>
                          @{u.userId}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.tick,
                          isSelected && styles.tickActive,
                        ]}
                      >
                        {isSelected && <IconCheck size={12} color={colors.white} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.submit,
                !canSubmit && styles.submitDisabled,
                pressed && canSubmit && { transform: [{ scale: 0.98 }] },
              ]}
            >
              {isCreating ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitText}>
                  {selectedIds.length > 0
                    ? `Create group · ${selectedIds.length} member${selectedIds.length > 1 ? 's' : ''}`
                    : 'Create group'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.72,
    color: colors.ink,
    fontFamily: fonts.sans,
    marginTop: 4,
  },
  headerTitleItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.n500,
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    fontFamily: fonts.sans,
    padding: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: 200,
  },
  chipText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.sans,
    fontWeight: '500',
  },
  listSection: {
    marginBottom: 16,
  },
  list: {
    gap: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  userRowSelected: {
    backgroundColor: colors.white,
    borderColor: colors.n200,
  },
  userRowPressed: {
    backgroundColor: colors.paper2,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  userBody: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  userHandle: {
    fontSize: 12,
    color: colors.n500,
    fontFamily: fonts.mono,
    marginTop: 2,
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.n300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  empty: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.n500,
    fontFamily: fonts.sans,
  },
  footer: {
    marginTop: 8,
  },
  submit: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    backgroundColor: colors.n300,
  },
  submitText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.15,
    fontFamily: fonts.sans,
  },
});
