import { useCreateTrip } from '@/hooks/api/useTrips';
import type { CreateTripRequest } from '@/types/api';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet, Button } from '../ui';
import CalendarBottomSheet from './CalendarBottomSheet';
import TripFilterForm from './TripFilterForm';

interface CreateTripSheetProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function CreateTripBottomSheet({
  isOpen,
  setIsOpen,
}: CreateTripSheetProps) {
  // ─── Form state ───────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calendarMode, setCalendarMode] = useState<'start' | 'end'>('start');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const createTrip = useCreateTrip();

  console.log(toLocation)

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFromLocation('');
    setToLocation('');
    setStartDate('');
    setEndDate('');
  };

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

    const payload: CreateTripRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      startLocation: {
        type: 'city',
        coordinates: { lat: 0, lng: 0 }, // Placeholder — real geocoding can be added later
        name: fromLocation.trim(),
      },
      destination: {
        type: 'city',
        coordinates: { lat: 0, lng: 0 },
        name: toLocation.trim(),
      },
      stops: [],
      startDate: new Date(startDate + 'T00:00:00').toISOString(),
      endDate: new Date(endDate + 'T00:00:00').toISOString(),
    };

    console.log("Payload", payload)

    createTrip.mutate(payload, {
      onSuccess: (newTrip) => {
        console.log("New Trip........!!!!", newTrip)
        Alert.alert('Trip Created', `"${newTrip?.trip?.title}" has been created! from ${newTrip?.trip?.startLocation?.name} to ${newTrip?.trip?.destination?.name}`);
        resetForm();
        setIsOpen(false);
      },
      onError: (err) => {
        Alert.alert('Error', err.message || 'Failed to create trip.');
      },
    });
  }, [
    title,
    description,
    fromLocation,
    toLocation,
    startDate,
    endDate,
    createTrip,
    setIsOpen,
  ]);

  return (
    <>
    <BottomSheet
      visible={isOpen}
      onClose={() => setIsOpen(false)}
      // snapPoints={['85%']}
      enableDynamicSizing
      // scrollable
    >
      {/* Title */}
      <View style={formStyles.section}>
        <Text style={formStyles.sectionLabel}>TRIP TITLE</Text>
        <View style={formStyles.inputWrapper}>
          <TextInput
            style={formStyles.textInput}
            placeholder="Weekend Getaway"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />
        </View>
      </View>

      {/* Description */}
      <View style={formStyles.section}>
        <Text style={formStyles.sectionLabel}>DESCRIPTION</Text>
        <View style={[formStyles.inputWrapper, { minHeight: 60 }]}>
          <TextInput
            style={[formStyles.textInput, { textAlignVertical: 'top' }]}
            placeholder="A fun weekend trip..."
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />
        </View>
      </View>

      <TripFilterForm
        fromLocation={fromLocation}
        setFromLocation={setFromLocation}
        toLocation={toLocation}
        setToLocation={setToLocation}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onDatePress={(mode) => {
          setCalendarMode(mode);
          setCalendarOpen(true);
        }}
      />
      <Button
        title={createTrip.isPending ? 'Creating...' : 'Create Trip'}
        onPress={handleSubmit}
        disabled={createTrip.isPending}
        loading={createTrip.isPending}
        style={{ margin: 20, marginTop: 24 }}
      />
      <View style={{ height: 60 }} />
    </BottomSheet>

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
    </>
  );
}

const formStyles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginTop: 12,
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
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    padding: 0,
  },
});