import {
  useAddEmergencyContact,
  useDeleteEmergencyContact,
  useProfile,
  useUpdateEmergencyContact,
  useUpdateProfile,
} from '@/hooks/api/useProfile';
import { useThemeColor } from '@/hooks/use-theme-color';
import type {
  Address,
  BloodGroup,
  EmergencyContact,
  ProfileFieldError,
} from '@/types/profile';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AddressForm from './AddressForm';
import BloodGroupSelector from './BloodGroupSelector';
import EmergencyContactSheet from './EmergencyContactSheet';
import EmergencyContactsList from './EmergencyContactsList';

export const MedicalEmergencySection: React.FC = () => {
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const addContact = useAddEmergencyContact();
  const updateContact = useUpdateEmergencyContact();
  const deleteContact = useDeleteEmergencyContact();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'textMuted');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const danger = useThemeColor({}, 'danger');
  const tint = useThemeColor({}, 'tint');

  if (profileQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={tint} />
      </View>
    );
  }

  if (profileQuery.isError) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.errorText, { color: danger }]}>
          {profileQuery.error?.message ?? 'Failed to load profile'}
        </Text>
      </View>
    );
  }

  const profile = profileQuery.data;
  if (!profile) return null;

  const handleBloodGroupChange = (next: BloodGroup | null) => {
    updateProfile.mutate({ bloodGroup: next });
  };

  const handleSaveAddress = (address: Address) => {
    updateProfile.mutate({ address });
  };

  const openAddSheet = () => {
    setEditingContact(null);
    setSheetOpen(true);
  };

  const openEditSheet = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingContact(null);
    // Clear any previous submission error so it doesn't bleed into the next open.
    addContact.reset();
    updateContact.reset();
  };

  const handleContactSubmit = (data: {
    name: string;
    phone: string;
    relation?: string;
  }) => {
    if (editingContact) {
      updateContact.mutate(
        { contactId: editingContact._id, data },
        { onSuccess: () => closeSheet() },
      );
    } else {
      addContact.mutate(data, { onSuccess: () => closeSheet() });
    }
  };

  const isSubmittingContact =
    addContact.isPending || updateContact.isPending;

  // Surface server field errors to whichever sub-form is currently active.
  const contactServerErrors: ProfileFieldError[] | undefined = editingContact
    ? updateContact.error?.fieldErrors
    : addContact.error?.fieldErrors;

  const addressServerErrors = updateProfile.error?.fieldErrors;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: muted }]}>
        Medical &amp; Emergency
      </Text>

      <View style={[styles.card, { borderColor: border }]}>
        <BloodGroupSelector
          value={profile.bloodGroup}
          onChange={handleBloodGroupChange}
          saving={updateProfile.isPending}
        />
      </View>

      <View style={[styles.card, { borderColor: border }]}>
        <Text style={[styles.subTitle, { color: text }]}>Emergency contacts</Text>
        <EmergencyContactsList
          contacts={profile.emergencyContacts}
          onAdd={openAddSheet}
          onEdit={openEditSheet}
          onDelete={(id) => deleteContact.mutate(id)}
          deletingId={deleteContact.isPending ? deleteContact.variables ?? null : null}
        />
      </View>

      <View style={[styles.card, { borderColor: border }]}>
        <Text style={[styles.subTitle, { color: text }]}>Address</Text>
        <AddressForm
          value={profile.address}
          saving={updateProfile.isPending}
          onSave={handleSaveAddress}
          serverErrors={addressServerErrors}
        />
      </View>

      <EmergencyContactSheet
        visible={sheetOpen}
        onClose={closeSheet}
        onSubmit={handleContactSubmit}
        saving={isSubmittingContact}
        contact={editingContact}
        serverErrors={contactServerErrors}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  centered: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MedicalEmergencySection;
