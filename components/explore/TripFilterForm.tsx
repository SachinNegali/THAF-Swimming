import { DATE_OPTIONS } from '@/dummy-data/journeys';
import React from 'react';
import {
    // ScrollView,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    View
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

// ─── Props ─────────────────────────────────────────────
export interface TripFilterFormProps {
  fromLocation: string;
  setFromLocation: (v: string) => void;
  toLocation: string;
  setToLocation: (v: string) => void;
  startDate: string; // ISO date string (YYYY-MM-DD)
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  /** Called when a date field is tapped — parent should open CalendarBottomSheet */
  onDatePress: (mode: 'start' | 'end') => void;
}

const formatDate = (iso: string): string => {
  if (!iso) return 'Select date';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function TripFilterForm({
  fromLocation,
  setFromLocation,
  toLocation,
  setToLocation,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onDatePress,
}: TripFilterFormProps) {

  return (
    <View>
      {/* FROM / TO */}
      <View style={styles.section}>
        <View style={styles.inputGroup}>
          <View style={styles.locationWrapper}>
            <Text style={styles.inputLabel}>FROM</Text>
            <View style={styles.inputInner}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Starting city"
                placeholderTextColor="#94a3b8"
                value={fromLocation}
                onChangeText={setFromLocation}
              />
            </View>
          </View>

          <View style={styles.swapButtonWrapper}>
            <TouchableOpacity
              style={styles.swapButton}
              onPress={() => {
                const tmp = fromLocation;
                setFromLocation(toLocation);
                setToLocation(tmp);
              }}
            >
              <Text style={styles.swapIcon}>⇅</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.locationWrapper}>
            <Text style={styles.inputLabel}>TO</Text>
            <View style={styles.inputInner}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Destination city"
                placeholderTextColor="#94a3b8"
                value={toLocation}
                onChangeText={setToLocation}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.section}>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => onDatePress('start')}
          >
            <Text style={styles.labelMicro}>DEPARTURE</Text>
            <View style={styles.dateValueRow}>
              <Text
                style={[
                  styles.dateValue,
                  !startDate && styles.datePlaceholder,
                ]}
              >
                {formatDate(startDate)}
              </Text>
              <Text style={styles.inputIconSmall}>📅</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => startDate ? onDatePress('end') : ToastAndroid.show("Please select departure date first", ToastAndroid.SHORT)}
          >
            <Text style={styles.labelMicro}>RETURN</Text>
            <View style={styles.dateValueRow}>
              <Text
                style={[
                  styles.dateValue,
                  !endDate && styles.datePlaceholder,
                ]}
              >
                {formatDate(endDate)}
              </Text>
              <Text style={styles.inputIconSmall}>📅</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.pillsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
            {DATE_OPTIONS.map((opt) => (
              <TouchableOpacity 
                key={opt.id} 
                style={[styles.pill, opt.isActive && styles.pillActive]}
              >
                {opt.id === '1' && <Text style={[styles.pillText, opt.isActive && styles.pillTextActive, {marginRight: 4}]}>IC</Text>}
                <Text style={[styles.pillText, opt.isActive && styles.pillTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
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
  inputGroup: {
    gap: 8,
    position: 'relative',
  },
  locationWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  inputWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  inputLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 4,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputIcon: {
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    padding: 0,
  },
  swapButtonWrapper: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -20,
    zIndex: 10,
  },
  swapButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  swapIcon: {
    fontSize: 14,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  dateValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  datePlaceholder: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  inputIconSmall: {
    fontSize: 14,
  },
  labelMicro: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  pillsContainer: {
    marginTop: 16,
    paddingBottom: 4,
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  pillTextActive: {
    color: '#fff',
  },
});
