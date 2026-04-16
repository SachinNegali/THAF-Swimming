import { useThemeColor } from '@/hooks/use-theme-color';
import {
  EMERGENCY_CONTACT_LIMIT,
  type EmergencyContact,
} from '@/types/profile';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  contacts: EmergencyContact[];
  onAdd: () => void;
  onEdit: (contact: EmergencyContact) => void;
  onDelete: (contactId: string) => void;
  deletingId?: string | null;
}

export const EmergencyContactsList: React.FC<Props> = ({
  contacts,
  onAdd,
  onEdit,
  onDelete,
  deletingId,
}) => {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'textMuted');
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');

  const atLimit = contacts.length >= EMERGENCY_CONTACT_LIMIT;

  const confirmDelete = (contact: EmergencyContact) => {
    Alert.alert(
      'Remove contact',
      `Remove ${contact.name} from your emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onDelete(contact._id),
        },
      ],
    );
  };

  return (
    <View>
      {contacts.length === 0 ? (
        <Text style={[styles.emptyState, { color: muted }]}>
          No emergency contacts — add one
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {contacts.map((c) => {
            const isDeleting = deletingId === c._id;
            return (
              <View
                key={c._id}
                style={[
                  styles.card,
                  { backgroundColor: surface, borderColor: border, opacity: isDeleting ? 0.5 : 1 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: text }]}>{c.name}</Text>
                  <Text style={[styles.phone, { color: muted }]}>{c.phone}</Text>
                  {c.relation ? (
                    <Text style={[styles.relation, { color: muted }]}>
                      {c.relation}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => onEdit(c)}
                    disabled={isDeleting}
                    style={styles.actionBtn}
                    accessibilityLabel={`Edit ${c.name}`}
                  >
                    <Text style={[styles.actionText, { color: tint }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(c)}
                    disabled={isDeleting}
                    style={styles.actionBtn}
                    accessibilityLabel={`Delete ${c.name}`}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color={danger} />
                    ) : (
                      <Text style={[styles.actionText, { color: danger }]}>
                        Delete
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        onPress={onAdd}
        disabled={atLimit}
        activeOpacity={0.7}
        style={[
          styles.addBtn,
          {
            backgroundColor: tint,
            opacity: atLimit ? 0.5 : 1,
          },
        ]}
        accessibilityLabel="Add emergency contact"
        accessibilityHint={
          atLimit
            ? `You've reached the ${EMERGENCY_CONTACT_LIMIT}-contact limit. Remove one to add another.`
            : undefined
        }
      >
        <Text style={styles.addBtnText}>
          {atLimit
            ? `Limit reached (${EMERGENCY_CONTACT_LIMIT}/${EMERGENCY_CONTACT_LIMIT})`
            : 'Add contact'}
        </Text>
      </TouchableOpacity>
      {atLimit && (
        <Text style={[styles.limitHint, { color: muted }]}>
          You can store up to {EMERGENCY_CONTACT_LIMIT} emergency contacts.
          Remove one to add another.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    fontStyle: 'italic',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  name: { fontSize: 15, fontWeight: '700' },
  phone: { fontSize: 13, marginTop: 2 },
  relation: { fontSize: 12, marginTop: 2 },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionText: { fontSize: 13, fontWeight: '700' },
  addBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  limitHint: {
    marginTop: 8,
    marginLeft: 4,
    fontSize: 12,
  },
});

export default EmergencyContactsList;
