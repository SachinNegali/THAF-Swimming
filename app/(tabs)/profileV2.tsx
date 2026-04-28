import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Kicker } from '../../components/core/Kicker';
import { Badge } from '../../components/profile/Badge';
import { BikeCard } from '../../components/profile/BikeCard';
import { EmergencyCard } from '../../components/profile/EmergencyCard';
import { EmptyTrips } from '../../components/profile/EmptyTrips';
import { GoalProgress } from '../../components/profile/GoalProgress';
import { ProfileAvatar } from '../../components/profile/ProfileAvatar';
import { SectionTab, SectionTabs } from '../../components/profile/SectionTabs';
import { SettingsList } from '../../components/profile/SettingsList';
import { StatCell } from '../../components/profile/StatCell';
import { TripRow } from '../../components/profile/TripRow';
import { DEMO_PROFILE, DEMO_PROFILE_TRIPS } from '../../data/demoData';
import { IconArrowRight, IconShare, IconShield, IconSliders } from '../../icons/Icons';
import { colors, fonts } from '../../theme';
import { ProfileSettingsRow, ProfileTabId, ProfileTrip } from '../../types';

const TRIP_TABS: SectionTab<ProfileTabId>[] = [
  { id: 'upcoming', label: `Upcoming · ${DEMO_PROFILE_TRIPS.upcoming.length}` },
  { id: 'completed', label: `Completed · ${DEMO_PROFILE_TRIPS.completed.length}` },
  { id: 'drafts', label: `Drafts · ${DEMO_PROFILE_TRIPS.drafts.length}` },
];

const TAB_HEADINGS: Record<ProfileTabId, string> = {
  upcoming: 'On the calendar',
  completed: 'Logged & done',
  drafts: 'In drafts',
};

const SETTINGS_ROWS: ProfileSettingsRow[] = [
  { label: 'Privacy & visibility', detail: 'Public profile, location off-ride' },
  { label: 'Notifications', detail: 'Trip alerts, broadcasts, chat' },
  { label: 'Payments & splits', detail: '2 cards · UPI linked' },
  { label: 'Help & support', detail: 'FAQ · Contact · Report' },
];

const ProfileV2Screen = React.memo(() => {
  const router = useRouter();
  const [tab, setTab] = useState<ProfileTabId>('upcoming');

  const trips: ProfileTrip[] = DEMO_PROFILE_TRIPS[tab];
  const profile = DEMO_PROFILE;
  const goalPercent = useMemo(
    () => Math.round((profile.yearKm / profile.goalKm) * 100),
    [profile.yearKm, profile.goalKm]
  );

  const handleTripPress = useCallback(() => {
    // TODO: navigate to trip detail
  }, []);

  const handleOpenMedical = useCallback(() => {
    router.push('/medicalV2');
  }, [router]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Kicker>Profile · #{profile.id}</Kicker>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn}>
              <IconShare size={15} color={colors.ink} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <IconSliders size={16} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        {/* Identity */}
        <View style={styles.identitySection}>
          <View style={styles.identityRow}>
            <ProfileAvatar name={profile.name} size={92} />
            <View style={styles.identityCol}>
              <Kicker>Member · {profile.joined}</Kicker>
              <View style={styles.nameRow}>
                <Text style={styles.firstName}>{profile.first} </Text>
                <Text style={styles.lastName}>{profile.last}</Text>
              </View>
              <Text style={styles.handle}>
                {profile.handle} · {profile.base}
              </Text>
            </View>
          </View>

          <Text style={styles.bio}>{profile.bio}</Text>

          <View style={styles.badges}>
            {profile.badges.map((b, i) => (
              <Badge key={b} label={b} filled={i === 0} />
            ))}
          </View>

          <View style={styles.identityActions}>
            <Pressable style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}>
              <Text style={styles.editText}>Edit profile</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.sosBtn, pressed && styles.sosBtnPressed]}>
              <IconShield size={14} color={colors.white} />
              <Text style={styles.sosText}>SOS</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Kicker>Logbook · 2026</Kicker>
            <Kicker style={styles.kickerInk}>YTD</Kicker>
          </View>
          <View style={styles.statsCard}>
            <StatCell value={profile.stats.led} label="trips led" />
            <StatCell value={profile.stats.joined} label="joined" />
            <StatCell value={profile.stats.km} label="km" tight />
            <StatCell value={profile.stats.days} label="days out" last />
          </View>
          <GoalProgress
            label={`Goal · ${profile.goalKm.toLocaleString()} km`}
            current={profile.stats.km}
            total={profile.goalKm}
            percent={goalPercent}
          />
        </View>

        {/* My trips */}
        <View style={styles.section}>
          <View style={styles.tripsHeader}>
            <View>
              <Kicker>My trips</Kicker>
              <Text style={styles.tripsTitle}>{TAB_HEADINGS[tab]}</Text>
            </View>
            <Pressable style={styles.seeAll}>
              <Text style={styles.seeAllText}>See all</Text>
              <IconArrowRight size={14} color={colors.n600} />
            </Pressable>
          </View>

          <SectionTabs<ProfileTabId> tabs={TRIP_TABS} active={tab} onChange={setTab} />

          <View style={styles.tripsList}>
            {trips.length === 0 ? (
              <EmptyTrips />
            ) : (
              trips.map((t) => <TripRow key={t.id} trip={t} onPress={handleTripPress} />)
            )}
          </View>
        </View>

        {/* Medical & Emergency */}
        <View style={styles.section}>
          <Kicker style={styles.kickerSpaced}>Medical & Emergency</Kicker>
          <EmergencyCard
            bloodGroup={profile.bloodGroup}
            contact={profile.emergency}
            contactCount={2}
            verified
            onPress={handleOpenMedical}
          />
        </View>

        {/* Bike */}
        <View style={styles.section}>
          <Kicker style={styles.kickerSpaced}>Bike on file</Kicker>
          <BikeCard bike={profile.bike} />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Kicker style={styles.kickerSpaced}>Account</Kicker>
          <SettingsList rows={SETTINGS_ROWS} />

          <Pressable style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutPressed]}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>

          <Text style={styles.footer}>THaF · v2.4.1 · Build 4801</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Identity
  identitySection: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 22,
  },
  identityRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-end',
  },
  identityCol: {
    flex: 1,
    paddingBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  firstName: {
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.84,
    lineHeight: 28.5,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  lastName: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 32,
    color: colors.ink,
  },
  handle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.44,
    color: colors.n500,
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 21.7,
    color: colors.n700,
    marginTop: 16,
    maxWidth: 320,
    fontFamily: fonts.sans,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },
  identityActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnPressed: {
    backgroundColor: colors.n100,
  },
  editText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  sosBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sosBtnPressed: {
    opacity: 0.85,
  },
  sosText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
    fontFamily: fonts.sans,
  },

  // Section
  section: {
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  kickerInk: {
    color: colors.ink,
  },
  kickerSpaced: {
    marginBottom: 10,
  },
  statsCard: {
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 16,
    backgroundColor: colors.white,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  // Trips
  tripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  tripsTitle: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.4,
    color: colors.ink,
    marginTop: 4,
    fontFamily: fonts.sans,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    color: colors.n600,
    fontFamily: fonts.sans,
  },
  tripsList: {
    gap: 10,
  },

  // Account footer
  signOutBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.n200,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  signOutPressed: {
    backgroundColor: colors.n100,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.n600,
    fontFamily: fonts.sans,
  },
  footer: {
    marginTop: 18,
    textAlign: 'center',
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.62,
    textTransform: 'uppercase',
    color: colors.n400,
  },
});

export default ProfileV2Screen;
