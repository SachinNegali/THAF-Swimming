import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { CreateTripDraft } from '../../types';
import { Kicker } from '../core/Kicker';
import { InputRow } from './InputRow';
import { RouteSketch } from './RouteSketch';

interface StepRouteProps {
  data: CreateTripDraft;
  set: <K extends keyof CreateTripDraft>(key: K, value: CreateTripDraft[K]) => void;
}

const SUGGESTIONS = ['Mumbai → Goa', 'Pune → Mahabaleshwar', 'Bangalore → Coorg', 'Delhi → Manali'];

export const StepRoute = React.memo(({ data, set }: StepRouteProps) => {
  const handleSuggest = (route: string) => {
    const [f, t] = route.split(' → ');
    set('from', f);
    set('to', t);
  };

  return (
    <View>
      <View style={styles.headerSection}>
        <Text style={styles.title}>
          Where are you{' '}
          <Text style={styles.titleItalic}>heading?</Text>
        </Text>
        <Text style={styles.subtitle}>
          Pick origin and destination. Add a title if you like.
        </Text>
      </View>

      <View style={styles.inputCard}>
        <InputRow
          label="FROM"
          icon={<View style={styles.dotOutline} />}
          value={data.from}
          onChange={(v) => set('from', v)}
          placeholder="Starting city"
        />
        <View style={styles.divider} />
        <InputRow
          label="TO"
          icon={<View style={styles.dotFilled} />}
          value={data.to}
          onChange={(v) => set('to', v)}
          placeholder="Destination"
        />
      </View>

      <TextInput
        value={data.title}
        onChangeText={(v) => set('title', v)}
        placeholder="Trip title (optional)"
        placeholderTextColor={colors.n400}
        style={styles.titleInput}
      />

      <View style={styles.suggestSection}>
        <Kicker style={styles.kicker}>Suggested near you</Kicker>
        <View style={styles.suggestRow}>
          {SUGGESTIONS.map((r) => (
            <Pressable key={r} onPress={() => handleSuggest(r)} style={styles.suggestBtn}>
              <Text style={styles.suggestText}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {data.from !== '' && data.to !== '' && (
        <View style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <Kicker>Route sketch</Kicker>
            <Kicker style={styles.kickerMuted}>No maps API</Kicker>
          </View>
          <RouteSketch from={data.from} to={data.to} />
          <Text style={styles.previewCaption}>
            Rendered from stored coordinates — no Maps billing. Full navigation opens on the Maps tab during the ride.
          </Text>
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
  suggestSection: {
    marginTop: 22,
  },
  kicker: {
    marginBottom: 10,
  },
  kickerMuted: {
    color: colors.n400,
  },
  suggestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: colors.white,
  },
  suggestText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
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
  previewCaption: {
    fontSize: 11,
    color: colors.n500,
    marginTop: 8,
    lineHeight: 16.5,
    fontFamily: fonts.sans,
  },
});
