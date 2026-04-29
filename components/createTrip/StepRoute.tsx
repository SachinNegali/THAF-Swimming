import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { IconPlus } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { CreateTripDraft, TripPlace } from '../../types';
import { Kicker } from '../core/Kicker';
import { PlaceInput } from './PlaceInput';
import { RouteSketch } from './RouteSketch';

interface StepRouteProps {
  data: CreateTripDraft;
  set: <K extends keyof CreateTripDraft>(key: K, value: CreateTripDraft[K]) => void;
}

export const StepRoute = React.memo(({ data, set }: StepRouteProps) => {
  const handleAddStop = () => {
    set('stops', [...data.stops, { name: '', type: 'city', coordinates: { lat: 0, lng: 0 } }]);
  };

  const handleStopChange = (index: number, place: TripPlace | null) => {
    const next = [...data.stops];
    if (place === null) {
      next[index] = { name: '', type: 'city', coordinates: { lat: 0, lng: 0 } };
    } else {
      next[index] = place;
    }
    set('stops', next);
  };

  const handleStopRemove = (index: number) => {
    set('stops', data.stops.filter((_, i) => i !== index));
  };

  const fromName = data.from?.name ?? '';
  const toName = data.to?.name ?? '';

  return (
    <View>
      <View style={styles.headerSection}>
        <Text style={styles.title}>
          Where are you{' '}
          <Text style={styles.titleItalic}>heading?</Text>
        </Text>
        <Text style={styles.subtitle}>
          Pick origin and destination. Add stops along the way.
        </Text>
      </View>

      <View style={styles.inputCard}>
        <PlaceInput
          label="FROM"
          icon={<View style={styles.dotOutline} />}
          value={data.from}
          onSelect={(p) => set('from', p)}
          placeholder="Starting city"
        />

        {data.stops.map((stop, i) => (
          <View key={`stop-${i}`}>
            <View style={styles.divider} />
            <PlaceInput
              label={`STOP ${i + 1}`}
              icon={<View style={styles.dotStop} />}
              value={stop.name ? stop : null}
              onSelect={(p) => handleStopChange(i, p)}
              onRemove={() => handleStopRemove(i)}
              placeholder="Add a waypoint"
            />
          </View>
        ))}

        <View style={styles.divider} />
        <PlaceInput
          label="TO"
          icon={<View style={styles.dotFilled} />}
          value={data.to}
          onSelect={(p) => set('to', p)}
          placeholder="Destination"
        />
      </View>

      <Pressable
        onPress={handleAddStop}
        style={({ pressed }) => [styles.addStopBtn, pressed && styles.addStopBtnPressed]}
      >
        <IconPlus size={14} color={colors.ink} />
        <Text style={styles.addStopText}>Add stop</Text>
      </Pressable>

      <TextInput
        value={data.title}
        onChangeText={(v) => set('title', v)}
        placeholder="Trip title (optional)"
        placeholderTextColor={colors.n400}
        style={styles.titleInput}
      />

      <TextInput
        value={data.description}
        onChangeText={(v) => set('description', v)}
        placeholder="Describe your trip — pace, terrain, vibe…"
        placeholderTextColor={colors.n400}
        style={styles.descriptionInput}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {fromName !== '' && toName !== '' && (
        <View style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <Kicker>Route sketch</Kicker>
            <Kicker style={styles.kickerMuted}>
              {data.stops.filter((s) => s.name).length > 0
                ? `${data.stops.filter((s) => s.name).length} stop(s)`
                : 'Direct'}
            </Kicker>
          </View>
          <RouteSketch from={fromName} to={toName} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  headerSection: {
    marginBottom: 22,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.84,
    lineHeight: 30.8,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  titleItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 32,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 14,
    color: colors.n600,
    marginTop: 6,
    lineHeight: 21,
    fontFamily: fonts.sans,
  },
  inputCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: colors.n100,
  },
  dotOutline: {
    width: 8,
    height: 8,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 4,
  },
  dotFilled: {
    width: 8,
    height: 8,
    backgroundColor: colors.ink,
    borderRadius: 4,
  },
  dotStop: {
    width: 6,
    height: 6,
    backgroundColor: colors.n400,
    borderRadius: 3,
  },
  addStopBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addStopBtnPressed: {
    backgroundColor: colors.n100,
  },
  addStopText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  titleInput: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.15,
    marginTop: 16,
  },
  descriptionInput: {
    width: '100%',
    minHeight: 96,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    letterSpacing: -0.14,
    marginTop: 10,
  },
  kickerMuted: {
    color: colors.n400,
  },
  previewSection: {
    marginTop: 22,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
});
