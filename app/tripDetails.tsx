import { PublicProfileScreen } from '@/components/profile/publicProfile';
import {
  Description,
  Header,
  JoinButton,
  JoinRequestsSection,
  notify,
  OrganizerCard,
  QuestionsSection,
  RouteTiming,
  TripHeaderSection,
} from '@/components/tripDetails';
import { MOCK_USER } from '@/dummy-data/journeys';
import {
  useAddTripParticipants,
  useRemoveTripParticipant,
  useRequestToJoinTrip,
  useTrip,
  useTripJoinRequests,
} from '@/hooks/api/useTrips';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAppSelector } from '@/store/hooks';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SPACING } from '../constants/theme';

export default function TripDetailsScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const { id } = useLocalSearchParams<{ id?: string }>();
  const tripId = id ?? '';
  const router = useRouter();

  const currentUser = useAppSelector((state) => state.auth.user);
  const currentUserId = currentUser?._id ?? currentUser?.userId ?? null;

  const { data: trip } = useTrip(tripId, !!tripId);

  const creatorId = typeof trip?.creator === 'object' && trip?.creator !== null
    ? (trip.creator as any)._id
    : trip?.creator;
  const isCreator = !!creatorId && !!currentUserId && creatorId === currentUserId;
  const isParticipant = !!currentUserId && Array.isArray(trip?.participants)
    && trip!.participants!.includes(currentUserId);

  const requestToJoin = useRequestToJoinTrip();
  const addParticipants = useAddTripParticipants();
  const removeParticipant = useRemoveTripParticipant();

  const [hasRequested, setHasRequested] = useState(false);

  const { data: joinRequests = [], isLoading: isLoadingRequests } = useTripJoinRequests(
    tripId,
    isCreator,
  );

  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const handleRequestToJoin = useCallback(() => {
    if (!tripId || hasRequested || requestToJoin.isPending) return;
    requestToJoin.mutate(tripId, {
      onSuccess: () => {
        setHasRequested(true);
        notify('Join request sent');
      },
      onError: (err: Error) => {
        const msg = err.message || 'Failed to send join request';
        if (msg.toLowerCase().includes('already exists')) {
          setHasRequested(true);
        }
        notify(msg);
      },
    });
  }, [tripId, hasRequested, requestToJoin]);

  const handleAccept = useCallback(
    (userId: string) => {
      if (!tripId || busyUserId) return;
      setBusyUserId(userId);
      const name =
        joinRequests.find((r) => r.user._id === userId)?.user.fName ?? 'user';
      addParticipants.mutate(
        { tripId, data: { participantIds: [userId] } },
        {
          onSuccess: () => notify(`Added ${name}`),
          onError: (err: Error) => notify(err.message || 'Failed to add participant'),
          onSettled: () => setBusyUserId(null),
        },
      );
    },
    [tripId, busyUserId, joinRequests, addParticipants],
  );

  const handleDecline = useCallback(
    (userId: string) => {
      if (!tripId || busyUserId) return;
      setBusyUserId(userId);
      removeParticipant.mutate(
        { tripId, userId },
        {
          onSuccess: () => notify('Request declined'),
          onError: (err: Error) => {
            notify(err.message || 'Request hidden locally — backend may not have removed it');
          },
          onSettled: () => setBusyUserId(null),
        },
      );
    },
    [tripId, busyUserId, removeParticipant],
  );

  const [isOpen, setIsOpen] = useState(false);
  const showJoinAction = !!tripId && !isCreator && !isParticipant;
  const showJoinRequests = trip?.trip?.joinRequests.length > 0;

  const data = useMemo(() => {
    const items: { type: string }[] = [
      { type: 'header' },
      { type: 'tripHeader' },
      { type: 'divider' },
      { type: 'routeTiming' },
      { type: 'divider2' },
      { type: 'description' },
      { type: 'startTripButton' },
      { type: 'divider3' },
      { type: 'organizer' },
      { type: 'divider4' },
      { type: 'questions' },
    ];
    if (showJoinRequests) items.push({ type: 'joinRequests' });
    if (showJoinAction) items.push({ type: 'joinButton' });
    return items;
  }, [showJoinRequests, showJoinAction]);

  const renderItem = useCallback(({ item }: { item: { type: string } }) => {
    switch (item.type) {
      case 'header':
        return <Header />;
      case 'tripHeader':
        return <TripHeaderSection trip={trip} />;
      case 'divider':
      case 'divider2':
      case 'divider3':
      case 'divider4':
        return <View style={[styles.divider, { borderColor }]} />;
      case 'routeTiming':
        return <RouteTiming trip={trip?.trip} />;
      case 'description':
        return <Description description={trip?.trip?.description} />;
      case 'startTripButton':
        return (
          <TouchableOpacity
            style={styles.startTripButton}
            activeOpacity={0.85}
            onPress={() => router.push(`/(tabs)/explore?tripId=${id ?? ''}&startRide=1` as any)}
          >
            <Text style={styles.startTripButtonText}>Start Trip...</Text>
          </TouchableOpacity>
        );
      case 'organizer':
        return <OrganizerCard setIsOpen={setIsOpen} trip={trip?.trip} />;
      case 'questions':
        return <QuestionsSection />;
      case 'joinRequests':
        return (
          <JoinRequestsSection
            requests={trip?.trip?.joinRequests}
            isLoading={isLoadingRequests}
            onAccept={handleAccept}
            onDecline={handleDecline}
            busyUserId={busyUserId}
          />
        );
      case 'joinButton':
        return (
          <JoinButton
            requested={hasRequested}
            isPending={requestToJoin.isPending}
            onPress={handleRequestToJoin}
          />
        );
      default:
        return null;
    }
  }, [
    borderColor, id, router, trip, joinRequests, isLoadingRequests,
    handleAccept, handleDecline, busyUserId, hasRequested,
    requestToJoin.isPending, handleRequestToJoin,
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.type}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 100 }}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
      />
      <PublicProfileScreen
        user={MOCK_USER}
        isOpen={isOpen}
        setIsOpen={() => setIsOpen(false)}
        onNavigate={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: SPACING.lg,
  },
  startTripButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
    backgroundColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  startTripButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
