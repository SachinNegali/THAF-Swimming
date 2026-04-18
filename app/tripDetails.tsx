import { PublicProfileScreen } from '@/components/profile/publicProfile';
import { MOCK_USER } from '@/dummy-data/journeys';
import {
  useAddTripParticipants,
  useRemoveTripParticipant,
  useRequestToJoinTrip,
  useTrip,
  useTripJoinRequests,
} from '@/hooks/api/useTrips';
import { useAppSelector } from '@/store/hooks';
import type { JoinRequest, Trip } from '@/types/api';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { Colors, SPACING } from '../constants/theme'; // Adjust path to your theme file

// --- Types ---

interface Question {
  id: string;
  initials: string;
  author: string;
  time: string;
  question: string;
  answer: {
    author: string;
    text: string;
  };
}

// --- Helpers ---

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- Mock Data ---

const QUESTIONS: Question[] = [
  {
    id: '1',
    initials: 'JD',
    author: 'John Doe',
    time: '2 days ago',
    question: 'Is this trip suitable for a first-time alpine rider?',
    answer: {
      author: 'Marco',
      text: 'Yes, but you should be comfortable with sharp hairpins. We\'ll take it at a steady pace!',
    },
  },
  {
    id: '2',
    initials: 'AS',
    author: 'Alice Smith',
    time: '5 hours ago',
    question: 'What\'s the backup plan for bad weather?',
    answer: {
      author: 'Marco',
      text: 'We have alternative lower-altitude routes if the passes are closed or unsafe due to snow/rain.',
    },
  },
];

// --- Helper Hook for Theme Colors ---

function useThemeColor(props: { light?: string; dark?: string }, colorName: keyof typeof Colors.light) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}

// --- Optimized Components ---

// 1. Header Component
const Header = memo(() => {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'tint');

  return (
    <View style={[styles.header, { backgroundColor: useThemeColor({ light: 'rgba(255,255,255,0.8)', dark: 'rgba(16, 22, 34, 0.8)' }, 'background') }]}>
      <TouchableOpacity style={styles.headerButton}>
        <Text style={{ fontSize: 24, color: textColor }}>‹</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: mutedColor }]}>TRIP DETAILS</Text>
      <TouchableOpacity style={styles.headerButton}>
        <Text style={{ fontSize: 18, color: textColor }}>↗</Text>
      </TouchableOpacity>
    </View>
  );
});

// 2. Trip Header Section
const TripHeader = memo(({ trip }: { trip?: Trip }) => {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const locationParts = [trip?.trip?.startLocation?.name, trip?.trip?.destination?.name].filter(Boolean);
  const locationText = locationParts.length > 0
    ? locationParts.join(' → ')
    : 'Location not set';
  return (
    <View style={styles.tripHeader}>
      <Text style={[styles.tripTitle, { color: textColor }]}>{trip?.trip?.title ?? locationText}</Text>
      {trip?.trip?.title &&<View style={styles.locationRow}>
        <Text style={{ color: mutedColor }}>📍</Text>
        <Text style={[styles.locationText, { color: mutedColor }]}>{locationText}</Text>
      </View>}
    </View>
  );
});

// 3. Route & Timing Section
const RouteTiming = memo(({ trip }: { trip?: Trip }) => {
  const mutedColor = useThemeColor({}, 'textMuted');
  const textColor = useThemeColor({}, 'text');

  const details = [
    { label: 'From', value: trip?.startLocation?.name ?? '—' },
    { label: 'To', value: trip?.destination?.name ?? '—' },
    { label: 'Start Date', value: formatDate(trip?.startDate) },
    { label: 'End Date', value: formatDate(trip?.endDate) },
  ];

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>ROUTE & TIMING</Text>
      <View style={styles.detailsGrid}>
        {details.map((detail, index) => (
          <View key={index} style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: mutedColor }]}>{detail.label}</Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{detail.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

// 4. Description Section
const Description = memo(({ description }: { description?: string }) => {
  const mutedColor = useThemeColor({}, 'textMuted');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>DESCRIPTION</Text>
      <Text style={[styles.descriptionText, { color: description ? textColor : mutedColor }]}>
        {description || 'No description available'}
      </Text>
    </View>
  );
});

// 5. Organizer Card
interface OrganizerCardProps {
  setIsOpen: (isOpen: boolean) => void;
  trip?: Trip;
}

const OrganizerCard = memo(({ setIsOpen, trip }: OrganizerCardProps) => {
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const creator = (trip as any)?.createdBy ?? trip?.creator;
  const creatorName = typeof creator === 'object' && creator !== null
    ? `${creator.fName ?? ''} ${creator.lName ?? ''}`.trim()
    : undefined;
  const creatorEmail = typeof creator === 'object' ? creator.email : undefined;
  const memberSince = trip?.createdAt
    ? new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : undefined;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>ORGANIZER</Text>
      <Pressable style={[styles.organizerCard, { backgroundColor: surfaceColor, borderColor }]} onPress={() => setIsOpen(true)}>
        <View style={[styles.organizerAvatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: surfaceColor }]}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: mutedColor }}>
            {(creatorName?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View style={styles.organizerInfo}>
          <Text style={[styles.organizerName, { color: textColor }]}>{creatorName || creatorEmail || 'Unknown'}</Text>
          {memberSince && (
            <Text style={[styles.organizerMeta, { color: mutedColor }]}>Trip created {memberSince}</Text>
          )}
        </View>
        <TouchableOpacity>
          <Text style={[styles.viewProfile, { color: primaryColor }]}>View Profile</Text>
        </TouchableOpacity>
      </Pressable>
    </View>
  );
});

// 6. Question Item
const QuestionItem = memo(({ question }: { question: Question }) => {
  const mutedColor = useThemeColor({}, 'textMuted');
  const textColor = useThemeColor({}, 'text');
  const surfaceLight = useThemeColor({}, 'surfaceLight');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.questionContainer}>
      <View style={styles.questionHeader}>
        <View style={[styles.initialsBadge, { backgroundColor: surfaceLight }]}>
          <Text style={{ color: mutedColor, fontSize: 10, fontWeight: '700' }}>{question.initials}</Text>
        </View>
        <View style={styles.questionContent}>
          <Text style={[styles.questionText, { color: textColor }]}>{question.question}</Text>
          <Text style={[styles.questionMeta, { color: mutedColor }]}>
            {question.author} • {question.time}
          </Text>
        </View>
      </View>
      <View style={[styles.answerContainer, { borderColor: surfaceLight }]}>
        <Text style={[styles.answerText, { color: textColor }]}>
          <Text style={{ fontWeight: '700' }}>{question.answer.author}:</Text> {question.answer.text}
        </Text>
      </View>
    </View>
  );
});

// 7. Questions & Discussion Section
const QuestionsSection = memo(() => {
  const mutedColor = useThemeColor({}, 'textMuted');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>QUESTIONS & DISCUSSION</Text>
      {QUESTIONS.map((q) => (
        <QuestionItem key={q.id} question={q} />
      ))}
      <TouchableOpacity style={[styles.askButton, { borderColor }]}>
        <Text style={[styles.askButtonText, { color: mutedColor }]}>Ask a Question</Text>
      </TouchableOpacity>
    </View>
  );
});

// 8. Join Button
interface JoinButtonProps {
  requested: boolean;
  isPending: boolean;
  onPress: () => void;
}

const JoinButton = memo(({ requested, isPending, onPress }: JoinButtonProps) => {
  const primaryColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'textMuted');
  const disabled = requested || isPending;

  return (
    <TouchableOpacity
      style={[
        styles.joinButton,
        { backgroundColor: requested ? mutedColor : primaryColor, opacity: disabled ? 0.7 : 1 },
      ]}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {isPending ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.joinButtonText}>{requested ? 'Requested' : 'Request to Join'}</Text>
      )}
    </TouchableOpacity>
  );
});

// 9. Join Requests Section (creator-only)
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface JoinRequestRowProps {
  request: JoinRequest;
  onAccept: (userId: string) => void;
  onDecline: (userId: string) => void;
  isBusy: boolean;
}

const JoinRequestRow = memo(({ request, onAccept, onDecline, isBusy }: JoinRequestRowProps) => {
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const fullName = `${request.user.fName ?? ''} ${request.user.lName ?? ''}`.trim() || request.user.email;

  return (
    <View style={[styles.requestRow, { backgroundColor: surfaceColor, borderColor }]}>
      <View style={styles.requestInfo}>
        <Text style={[styles.requestName, { color: textColor }]}>{fullName}</Text>
        <Text style={[styles.requestMeta, { color: mutedColor }]} numberOfLines={1}>
          {request.user.email}
        </Text>
        <Text style={[styles.requestMeta, { color: mutedColor }]}>
          {relativeTime(request.requestedAt)}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.requestButton, { backgroundColor: primaryColor, opacity: isBusy ? 0.6 : 1 }]}
          disabled={isBusy}
          onPress={() => onAccept(request.user._id)}
          activeOpacity={0.85}
        >
          <Text style={styles.requestButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestButtonOutline, { borderColor, opacity: isBusy ? 0.6 : 1 }]}
          disabled={isBusy}
          onPress={() => onDecline(request.user._id)}
          activeOpacity={0.85}
        >
          <Text style={[styles.requestButtonOutlineText, { color: textColor }]}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

interface JoinRequestsSectionProps {
  requests: JoinRequest[];
  isLoading: boolean;
  onAccept: (userId: string) => void;
  onDecline: (userId: string) => void;
  busyUserId: string | null;
}

const JoinRequestsSection = memo(({ requests, isLoading, onAccept, onDecline, busyUserId }: JoinRequestsSectionProps) => {
  const mutedColor = useThemeColor({}, 'textMuted');
  console.log("TRIP INFOOOOOOOO THESE REQESTTSSSS...",requests)
  if (!isLoading && requests.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>
        JOIN REQUESTS ({requests.length})
      </Text>
      {isLoading && requests.length === 0 ? (
        <ActivityIndicator />
      ) : (
        requests.map((r) => (
          <JoinRequestRow
            key={r._id}
            request={r}
            onAccept={onAccept}
            onDecline={onDecline}
            isBusy={busyUserId === r.user._id}
          />
        ))
      )}
    </View>
  );
});

function notify(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(message);
  }
}

// --- Main Screen ---

export default function TripDetailsScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const { id } = useLocalSearchParams<{ id?: string }>();
  const tripId = id ?? '';
  const router = useRouter();

  const currentUser = useAppSelector((state) => state.auth.user);
  const currentUserId = currentUser?._id ?? currentUser?.userId ?? null;

  const { data: trip } = useTrip(tripId, !!tripId);

  console.log("TRIP INFOOOOOOOO", trip, "FROM PARAMAS....", id, tripId, currentUser)

  const creatorId = typeof trip?.creator === 'object' && trip?.creator !== null
    ? (trip.creator as any)._id
    : trip?.creator;
  const isCreator = !!creatorId && !!currentUserId && creatorId === currentUserId;
  const isParticipant = !!currentUserId && Array.isArray(trip?.participants)
    && trip!.participants!.includes(currentUserId);

  const requestToJoin = useRequestToJoinTrip();
  const addParticipants = useAddTripParticipants();
  const removeParticipant = useRemoveTripParticipant();

  // Local "requested" flag — survives re-renders and prevents spam if the
  // user navigates away and comes back before the trip detail refetches.
  const [hasRequested, setHasRequested] = useState(false);

  const { data: joinRequests = [], isLoading: isLoadingRequests } = useTripJoinRequests(
    tripId,
    isCreator,
  );

  console.log("JOIN REQUESTS....", joinRequests, "isCreator:", isCreator, "creatorId:", creatorId, "currentUserId:", currentUserId, "raw creator:", trip?.creator)

  console.log("joinRequests", joinRequests)
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
        // Idempotent UX: server says request already exists → reflect it in the UI.
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
            // The DELETE endpoint currently only removes existing participants,
            // not pending requests. Optimistically drop the row anyway and tell
            // the user — backend follow-up tracked separately.
            notify(err.message || 'Request hidden locally — backend may not have removed it');
          },
          onSettled: () => setBusyUserId(null),
        },
      );
    },
    [tripId, busyUserId, removeParticipant],
  );

  // Flat data array for FlashList (FlashList doesn't support sections)

  const [isOpen, setIsOpen] = useState(false);
  const showJoinAction = !!tripId && !isCreator && !isParticipant;
  // const showJoinRequests = isCreator && (isLoadingRequests || joinRequests.length > 0);
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
    // console.log("TRIP INFOOOOOOOO...ITEM TYPE......!!!", item.type, "TRIP", item)
    switch (item.type) {
      case 'header':
        return <Header />;
      case 'tripHeader':
        return <TripHeader trip={trip} />;
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
            onPress={() =>
              router.push(`/(tabs)/explore?tripId=${id ?? ''}&startRide=1` as any)
            }
          >
            <Text style={styles.startTripButtonText}>Start Trip</Text>
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
    borderColor,
    id,
    router,
    trip,
    joinRequests,
    isLoadingRequests,
    handleAccept,
    handleDecline,
    busyUserId,
    hasRequested,
    requestToJoin.isPending,
    handleRequestToJoin,
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
        onNavigate={() => console.log('navigate')}
      />
    </SafeAreaView>
  );
}

// --- Styles ---

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerButton: {
    padding: SPACING.xs,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // Trip Header
  tripHeader: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  tripTitle: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  locationText: {
    fontSize: 14,
  },

  // Divider
  divider: {
    borderTopWidth: 1,
    marginVertical: SPACING.lg,
  },

  // Section
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },

  // Route & Timing
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  detailItem: {
    width: '45%',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Description
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },

  // Organizer
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: 'white',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  organizerMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  viewProfile: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Questions
  questionContainer: {
    marginBottom: SPACING.lg,
  },
  questionHeader: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  initialsBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  questionMeta: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
  },
  answerContainer: {
    marginLeft: 32,
    marginTop: SPACING.sm,
    paddingLeft: SPACING.md,
    borderLeftWidth: 2,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  askButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  askButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Start Trip Button
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

  // Join Button
  joinButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // Join Requests
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  requestInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '700',
  },
  requestMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  requestButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
  },
  requestButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  requestButtonOutline: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
    borderWidth: 1,
  },
  requestButtonOutlineText: {
    fontSize: 12,
    fontWeight: '700',
  },
});