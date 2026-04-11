import { BottomSheet } from '@/components/ui/BottomSheet';
import { useCreateGroup } from '@/hooks/api/useChats';
import { useSearchUsers, type UserSearchResult } from '@/hooks/api/useUser';
import { useDebounce } from '@/hooks/useDebounce';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface CreateGroupBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  initialUsers: UserSearchResult[];
}

export function CreateGroupBottomSheet({
  visible,
  onClose,
  initialUsers,
}: CreateGroupBottomSheetProps) {
  const isDark = useColorScheme() === 'dark';
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  const debouncedSearch = useDebounce(searchQuery, 400);
  const { data: searchData, isFetching: isSearching } = useSearchUsers(debouncedSearch);
  const { mutate: createGroup, isPending: isCreating } = useCreateGroup();

  const searchResults = searchData?.users ?? [];
  
  // Combine initial users and search results, prioritizing selected status
  const displayedUsers = useMemo(() => {
    if (debouncedSearch.trim().length >= 3) {
      return searchResults;
    }
    return initialUsers;
  }, [debouncedSearch, searchResults, initialUsers]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    if (selectedUserIds.length === 0) {
      alert('Please select at least one user');
      return;
    }

    createGroup(
      {
        name: groupName.trim(),
        memberIds: selectedUserIds,
        type: 'group',
      },
      {
        onSuccess: () => {
          onClose();
          setGroupName('');
          setSelectedUserIds([]);
          setSearchQuery('');
        },
      }
    );
  };

  const renderUserItem = ({ item }: { item: UserSearchResult }) => {
    const isSelected = selectedUserIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.userRow, isDark && styles.userRowDark]}
        onPress={() => toggleUser(item.id)}
      >
        <View style={styles.avatarContainer}>
          {item.picture ? (
            <Image source={{ uri: item.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, isDark && styles.avatarFallbackDark]}>
              <Text style={styles.avatarFallbackText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isSelected && (
            <View style={styles.checkBadge}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, isDark && styles.textLight]}>{item.name}</Text>
          <Text style={styles.userHandle}>@{item.userId}</Text>
        </View>
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
            isDark && styles.checkboxDark,
          ]}
        >
          {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['90%']}
      backgroundStyle={isDark ? styles.bottomSheetDark : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textLight]}>Create Group</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="E.g. Weekend Trip"
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={groupName}
            onChangeText={setGroupName}
          />
          {/* <Input
            placeholder="E.g. Weekend Trip"
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={groupName}
            onChangeText={setGroupName}
          /> */}
        </View>

        <View style={styles.searchSection}>
          <Text style={styles.label}>Add Users</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Search by name or @username..."
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isSearching ? (
          <ActivityIndicator style={styles.loader} color="#2b6cee" />
        ) : (
          <FlatList
            data={displayedUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchQuery.trim().length >= 3
                  ? 'No users found'
                  : 'Search for users to add'}
              </Text>
            }
          />
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!groupName.trim() || selectedUserIds.length === 0 || isCreating) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!groupName.trim() || selectedUserIds.length === 0 || isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              Create Group ({selectedUserIds.length})
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetDark: {
    backgroundColor: '#1a2232',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 0
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0d121b',
  },
  closeButtonText: {
    color: '#2b6cee',
    fontSize: 15,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 10,
  },
  searchSection: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0d121b',
  },
  inputDark: {
    backgroundColor: '#101622',
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  userRowDark: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(43, 108, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackDark: {
    backgroundColor: 'rgba(43, 108, 238, 0.2)',
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2b6cee',
  },
  checkBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: '#2b6cee',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  checkIcon: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0d121b',
  },
  userHandle: {
    fontSize: 13,
    color: '#6b7280',
  },
  textLight: {
    color: '#ffffff',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDark: {
    borderColor: '#374151',
  },
  checkboxSelected: {
    backgroundColor: '#2b6cee',
    borderColor: '#2b6cee',
  },
  checkboxTick: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#2b6cee',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#2b6cee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
});
