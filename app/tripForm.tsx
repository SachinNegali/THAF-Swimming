import CalendarBottomSheet from '@/components/explore/CalendarBottomSheet';
import TripFilterForm from '@/components/explore/TripFilterForm';
import { Button } from '@/components/ui';
import { useCreateTrip, useTrip, useUpdateTrip } from '@/hooks/api/useTrips';
import type { CreateTripRequest, UpdateTripRequest } from '@/types/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function TripFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isUpdate = !!id;

  // ─── Queries & Mutations ──────────────────────────────
  const { data: existingTrip, isLoading: isLoadingTrip } = useTrip(id || '', isUpdate);
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();

  // ─── Form state ───────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [toLocation, setToLocation] = useState('');
  const [toCoords, setToCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calendarMode, setCalendarMode] = useState<'start' | 'end'>('start');
  const [calendarOpen, setCalendarOpen] = useState(false);

  // ─── Sync data for Update mode ────────────────────────
  useEffect(() => {
    if (isUpdate && existingTrip) {
      setTitle(existingTrip.title);
      setDescription(existingTrip.description || '');
      setFromLocation(existingTrip.startLocation?.name || '');
      setFromCoords({
        lat: existingTrip.startLocation?.coordinates?.lat ?? 0,
        lng: existingTrip.startLocation?.coordinates?.lng ?? 0,
      });
      setToLocation(existingTrip.destination?.name || '');
      setToCoords({
        lat: existingTrip.destination?.coordinates?.lat ?? 0,
        lng: existingTrip.destination?.coordinates?.lng ?? 0,
      });
      // Backend returns full ISO, we need YYYY-MM-DD for TripFilterForm
      setStartDate(existingTrip.startDate?.split('T')[0] || '');
      setEndDate(existingTrip.endDate?.split('T')[0] || '');
    }
  }, [isUpdate, existingTrip]);

  const handleSubmit = useCallback(() => {
    // ── Validation ──
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter a trip title.');
      return;
    }
    if (!fromLocation.trim()) {
      Alert.alert('Missing Field', 'Please enter a starting location.');
      return;
    }
    if (!toLocation.trim()) {
      Alert.alert('Missing Field', 'Please enter a destination.');
      return;
    }
    if (!startDate) {
      Alert.alert('Missing Field', 'Please select a departure date.');
      return;
    }
    if (!endDate) {
      Alert.alert('Missing Field', 'Please select a return date.');
      return;
    }

    const payload: any = {
      title: title.trim(),
      description: description.trim() || undefined,
      startLocation: {
        type: 'city',
        coordinates: fromCoords,
        name: fromLocation.trim(),
      },
      destination: {
        type: 'city',
        coordinates: toCoords,
        name: toLocation.trim(),
      },
      startDate: new Date(startDate + 'T00:00:00').toISOString(),
      endDate: new Date(endDate + 'T00:00:00').toISOString(),
    };

    if (isUpdate) {
      updateTrip.mutate(
        { id: id!, data: payload as UpdateTripRequest },
        {
          onSuccess: () => {
            Alert.alert('Success', 'Trip updated successfully');
            router.back();
          },
          onError: (err) => {
            Alert.alert('Error', err.message || 'Failed to update trip.');
          },
        }
      );
    } else {
      createTrip.mutate(payload as CreateTripRequest, {
        onSuccess: () => {
          Alert.alert('Success', 'Trip created successfully');
          router.back();
        },
        onError: (err) => {
          Alert.alert('Error', err.message || 'Failed to create trip.');
        },
      });
    }
  }, [
    isUpdate,
    id,
    title,
    description,
    fromLocation,
    fromCoords,
    toLocation,
    toCoords,
    startDate,
    endDate,
    createTrip,
    updateTrip,
    router,
  ]);

  const isLoading = createTrip.isPending || updateTrip.isPending || (isUpdate && isLoadingTrip);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
            <Text style={styles.headerTitle}>{isUpdate ? 'Update Trip' : 'Create New Trip'}</Text>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRIP TITLE</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Weekend Getaway"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <View style={[styles.inputWrapper, { minHeight: 80 }]}>
            <TextInput
              style={[styles.textInput, { textAlignVertical: 'top' }]}
              placeholder="A fun weekend trip..."
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <TripFilterForm
          fromLocation={fromLocation}
          setFromLocation={(v) => { setFromLocation(v); if (!v) setFromCoords({ lat: 0, lng: 0 }); }}
          toLocation={toLocation}
          setToLocation={(v) => { setToLocation(v); if (!v) setToCoords({ lat: 0, lng: 0 }); }}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onDatePress={(mode) => {
            setCalendarMode(mode);
            setCalendarOpen(true);
          }}
          onFromPlaceSelected={(place) => setFromCoords({ lat: place.lat, lng: place.lng })}
          onToPlaceSelected={(place) => setToCoords({ lat: place.lat, lng: place.lng })}
        />

        <Button
          title={isLoading ? 'Saving...' : isUpdate ? 'Update Trip' : 'Create Trip'}
          onPress={handleSubmit}
          disabled={isLoading}
          loading={isLoading}
          style={styles.submitButton}
        />
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <CalendarBottomSheet
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        mode={calendarMode}
        startDate={startDate}
        endDate={endDate}
        onSelectDate={(mode, dateString) => {
          if (mode === 'start') {
            setStartDate(dateString);
            if (endDate && endDate < dateString) setEndDate('');
          } else {
            setEndDate(dateString);
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  textInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    padding: 0,
  },
  submitButton: {
    margin: 20,
    marginTop: 32,
    height: 56,
    borderRadius: 16,
  },
});
