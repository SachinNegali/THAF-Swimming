import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { BottomSheet } from '../ui';

interface CalendarBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Which date field is being edited */
  mode: 'start' | 'end';
  startDate: string;
  endDate: string;
  onSelectDate: (mode: 'start' | 'end', dateString: string) => void;
}

const calendarTheme = {
  backgroundColor: '#ffffff',
  calendarBackground: '#ffffff',
  todayTextColor: '#0f172a',
  selectedDayBackgroundColor: '#0f172a',
  selectedDayTextColor: '#fff',
  dayTextColor: '#334155',
  textDisabledColor: '#cbd5e1',
  monthTextColor: '#0f172a',
  arrowColor: '#0f172a',
  textMonthFontWeight: '700' as const,
  textDayFontWeight: '500' as const,
  textDayHeaderFontWeight: '600' as const,
  textDayFontSize: 14,
  textMonthFontSize: 15,
  textDayHeaderFontSize: 12,
};

export default function CalendarBottomSheet({
  visible,
  onClose,
  mode,
  startDate,
  endDate,
  onSelectDate,
}: CalendarBottomSheetProps) {
  const handleDayPress = (day: DateData) => {
    onSelectDate(mode, day.dateString);
    onClose();
  };

  const markedDates: Record<string, any> = {};
  if (startDate) {
    markedDates[startDate] = {
      selected: true,
      selectedColor: mode === 'start' ? '#0f172a' : '#94a3b8',
    };
  }
  if (endDate) {
    markedDates[endDate] = {
      selected: true,
      selectedColor: mode === 'end' ? '#0f172a' : '#94a3b8',
    };
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['50%']}
    >
      <View style={styles.container}>
        <Text style={styles.title}>
          {mode === 'start' ? 'Select Departure Date' : 'Select Return Date'}
        </Text>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={markedDates}
          // minDate={mode === 'end' && startDate ? startDate : undefined}
          minDate={mode === 'start' ? new Date().toISOString() : startDate ? startDate : undefined}
          theme={calendarTheme}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
});
