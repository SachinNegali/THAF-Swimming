import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { DEMO_MEMBERS, DEMO_QA, DEMO_REQUESTS, DEMO_TRIP } from '../data/demoData';
import { colors, fonts } from '../theme';
import { JoinRequest, Member, TripDetails } from '../types';
// import { StatusBar } from '../components/atoms/StatusBar';
import { Avatar } from '../components/core/Avatar';
import { PrimaryButton } from '../components/core/form/PrimaryButton';
import { Hairline } from '../components/core/Hairline';
import { Kicker } from '../components/core/Kicker';
import { Metric } from '../components/core/Metric';
import {
    IconArrowRight,
    IconBack, IconBookmark,
    IconChat,
    IconCheck,
    IconFlash,
    IconShare,
    IconX,
} from '../icons/Icons';
import { BroadcastSheet } from '../components/tripDetails/BroadcastSheet';
import { RequestToJoinSheet } from '../components/tripDetails/RequestToJoinSheet';
import { notify } from '../components/tripDetails/helpers';
import {
  useAddTripParticipants,
  useRemoveTripParticipant,
  useRequestToJoinTrip,
  useTripJoinRequests,
} from '@/hooks/api/useTrips';
import { useAppSelector } from '@/store/hooks';

interface DetailsScreenProps {
  ride?: TripDetails;
  onBack?: () => void;
  onStartRide?: () => void;
}

type TabId = 'overview' | 'members' | 'requests' | 'qa';

const formatShortDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
};

const DetailsScreen = React.memo(({ ride, onBack, onStartRide }: DetailsScreenProps) => {
  const router = useRouter();
  const { trip: tripParam } = useLocalSearchParams<{ trip?: string }>();

  const trip: any = useMemo(() => {
    if (!tripParam) return null;
    try {
      return typeof tripParam === 'string' ? JSON.parse(tripParam) : tripParam;
    } catch {
      return null;
    }
  }, [tripParam]);

  const tripId = trip?._id ?? trip?.id ?? '';

  const currentUser = useAppSelector((state) => state.auth.user);
  const currentUserId = currentUser?._id ?? currentUser?.userId ?? null;

  const creatorId = typeof trip?.createdBy === 'object' && trip?.createdBy !== null
    ? trip.createdBy._id
    : (typeof trip?.creator === 'object' && trip?.creator !== null
        ? trip.creator._id
        : (trip?.createdBy ?? trip?.creator));
  const isOrganizer = !!creatorId && !!currentUserId && creatorId === currentUserId;

  const participants: any[] = Array.isArray(trip?.participants) ? trip.participants : [];
  const isParticipant = !!currentUserId && participants.some((p: any) => {
    const uid = typeof p?.user === 'object' ? p.user?._id : p?.user;
    return uid === currentUserId;
  });

  const requestToJoin = useRequestToJoinTrip();
  const addParticipants = useAddTripParticipants();
  const removeParticipant = useRemoveTripParticipant();

  const { data: joinRequestsApi = [], isLoading: isLoadingRequests } = useTripJoinRequests(
    tripId,
    isOrganizer && !!tripId,
  );

  const [tab, setTab] = useState<TabId>('overview');
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const handleBack = onBack ?? (() => router.back());

  const handleRequestSubmit = (message: string) => {
    if (!tripId) return;
    requestToJoin.mutate(
      { tripId, message },
      {
        onSuccess: () => {
          setHasRequested(true);
          setRequestSheetOpen(false);
          notify('Join request sent');
        },
        onError: (err: Error) => {
          const msg = err.message || 'Failed to send join request';
          if (msg.toLowerCase().includes('already exists')) {
            setHasRequested(true);
            setRequestSheetOpen(false);
          }
          notify(msg);
        },
      },
    );
  };

  const handleAcceptRequest = (userId: string) => {
    if (!tripId || busyUserId) return;
    setBusyUserId(userId);
    addParticipants.mutate(
      { tripId, data: { participantIds: [userId] } },
      {
        onSuccess: () => notify('Request approved'),
        onError: (err: Error) => notify(err.message || 'Failed to add participant'),
        onSettled: () => setBusyUserId(null),
      },
    );
  };

  const handleDeclineRequest = (userId: string) => {
    if (!tripId || busyUserId) return;
    setBusyUserId(userId);
    removeParticipant.mutate(
      { tripId, userId },
      {
        onSuccess: () => notify('Request declined'),
        onError: (err: Error) => notify(err.message || 'Failed to decline request'),
        onSettled: () => setBusyUserId(null),
      },
    );
  };

  // Map API trip → UI fields. Falls back to ride prop / DEMO_TRIP for legacy embed usage.
  const fallback = ride || DEMO_TRIP;
  const r = useMemo<TripDetails>(() => {
    if (!trip) return fallback;
    const filled = participants.length;
    const total = typeof trip.spots === 'number' && trip.spots > 0 ? trip.spots : filled;
    const organizerName = typeof trip.createdBy === 'object'
      ? `${trip.createdBy?.fName ?? ''} ${trip.createdBy?.lName ?? ''}`.trim() || (trip.createdBy?.email ?? '—')
      : (fallback.organizer ?? '—');
    return {
      id: trip._id ?? trip.id ?? fallback.id,
      title: trip.title ?? fallback.title,
      region: trip.startLocation?.name ?? fallback.region,
      from: trip.startLocation?.name ?? fallback.from,
      to: trip.destination?.name ?? fallback.to,
      dist: trip.distance ? `${trip.distance} km` : fallback.dist,
      days: trip.days ?? fallback.days,
      level: fallback.level, // [TODO API: difficulty/level not in payload]
      start: formatShortDate(trip.startDate) ?? fallback.start,
      end: formatShortDate(trip.endDate) ?? fallback.end,
      spots: typeof trip.spots === 'number' ? Math.max(0, total - filled) : fallback.spots,
      total,
      filled,
      organizer: organizerName,
      description: trip.description ?? fallback.description,
    };
  }, [trip, participants.length, fallback]);

  const elevationLabel = trip?.elevation ? `${trip.elevation}` : '4,350';
  const distanceValue = trip?.distance ? `${trip.distance}` : (r.dist?.replace(/[^\d]/g, '') || '—');
  const titleParts = (r.title ?? '').split(' ');
  const titleLead = titleParts.length > 1 ? `${titleParts.slice(0, -1).join(' ')} ` : r.title;
  const titleTail = titleParts.length > 1 ? titleParts[titleParts.length - 1] : '';

  // Build members list from participants (organizer + joined). [TODO API: handle/role per member not in payload]
  const members: Member[] = useMemo(() => {
    if (!trip) return DEMO_MEMBERS;
    const list: Member[] = [];
    const seen = new Set<string>();
    if (typeof trip.createdBy === 'object' && trip.createdBy?._id) {
      const u = trip.createdBy;
      list.push({
        name: `${u.fName ?? ''} ${u.lName ?? ''}`.trim() || u.email,
        handle: u.email ?? '—',
        role: 'Organizer',
        tone: 0,
      });
      seen.add(u._id);
    }
    participants.forEach((p: any, i: number) => {
      const u = typeof p?.user === 'object' ? p.user : null;
      const uid = u?._id ?? p?.user;
      if (!u || !uid || seen.has(uid)) return;
      seen.add(uid);
      list.push({
        name: `${u.fName ?? ''} ${u.lName ?? ''}`.trim() || u.email,
        handle: u.email ?? '—',
        tone: (i + 1) % 4,
      });
    });
    return list.length ? list : [];
  }, [trip, participants]);

  const TABS: { id: TabId; label: () => string }[] = useMemo(() => [
    { id: 'overview', label: () => 'Overview' },
    { id: 'members', label: () => `Members · ${members.length}/${r.total || members.length}` },
    { id: 'requests', label: () => `Requests · ${joinRequestsApi.length}` },
    { id: 'qa', label: () => 'Q&A' },
  ], [members.length, r.total, joinRequestsApi.length]);

  if (!trip) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.ink} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* <StatusBar /> */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Nav */}
        <View style={styles.headerNav}>
          <Pressable onPress={handleBack} style={styles.iconBtn}>
            <IconBack size={18} color={colors.ink} />
          </Pressable>
          <Kicker>Trip · {(r.id ?? '').slice(-6).toUpperCase() || 'TRP'}</Kicker>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn}>
              <IconBookmark size={15} color={colors.ink} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <IconShare size={15} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.heroContainer}>
          <View style={styles.heroImage}>
            <Svg width="100%" height="100%" viewBox="0 0 400 240" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="det-g" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#252523" />
                  <Stop offset="100%" stopColor="#0a0a0a" />
                </LinearGradient>
              </Defs>
              <Rect width="400" height="240" fill="url(#det-g)" />
              {[...Array(14)].map((_, i) => (
                <Path
                  key={i}
                  d={`M -20 ${10 + i * 18} Q 100 ${i * 16}, 200 ${30 + i * 18} T 420 ${i * 22}`}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="1"
                  fill="none"
                />
              ))}
              <Path d="M 40 200 Q 130 130, 200 150 T 360 50" stroke="#fff" strokeWidth="2" fill="none" />
              <Circle cx="40" cy="200" r="5" fill="#fff" />
              <Circle cx="360" cy="50" r="5" fill={colors.amber} />
            </Svg>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{r.level}</Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Kicker>{r.region?.toUpperCase() ?? '—'}</Kicker>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{titleLead}</Text>
            {!!titleTail && <Text style={styles.titleItalic}>{titleTail}</Text>}
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsCard}>
            <Metric value={distanceValue} label="km" />
            <Metric value={String(r.days ?? '—')} label="days" />
            <Metric value={elevationLabel} label="elev m" />
            <Metric value={`${r.spots ?? 0}/${r.total ?? 0}`} label="spots" />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabs}>
              {TABS.map(t => {
                const active = tab === t.id;
                if (t.id === 'requests' && !isOrganizer) return null;
                return (
                  <Pressable key={t.id} onPress={() => setTab(t.id)} style={styles.tab}>
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label()}</Text>
                    {active && <View style={styles.tabIndicator} />}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent} key={tab}>
          {tab === 'overview' && <OverviewTab r={r} />}
          {tab === 'members' && <MembersTab members={members} total={r.total} />}
          {tab === 'requests' && isOrganizer && (
            <RequestsTab
              requests={joinRequestsApi}
              isLoading={isLoadingRequests}
              busyUserId={busyUserId}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          )}
          {tab === 'qa' && <QATab />}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.ctaContainer}>
        <Pressable style={styles.chatBtn}>
          <IconChat size={18} color={colors.ink} />
        </Pressable>
        {isOrganizer ? (
          <PrimaryButton
            onPress={() => setBroadcastOpen(true)}
            icon={<IconFlash size={16} color={colors.white} />}
            style={styles.ctaBtn}
          >
            Start ride
          </PrimaryButton>
        ) : isParticipant ? (
          <PrimaryButton
            icon={<IconCheck size={16} color={colors.white} />}
            style={styles.ctaBtn}
          >
            Joined
          </PrimaryButton>
        ) : (
          <PrimaryButton
            onPress={() => !hasRequested && !requestToJoin.isPending && setRequestSheetOpen(true)}
            icon={
              requestToJoin.isPending
                ? <ActivityIndicator size="small" color={colors.white} style={{ marginLeft: 8 }} />
                : <IconArrowRight size={16} color={colors.white} />
            }
            style={styles.ctaBtn}
          >
            {hasRequested ? 'Requested' : 'Request to Join'}
          </PrimaryButton>
        )}
      </View>

      <BroadcastSheet
        visible={broadcastOpen}
        members={members.filter(m => m.role !== 'Organizer').map(m => m.name)}
        onCancel={() => setBroadcastOpen(false)}
        onConfirm={() => { setBroadcastOpen(false); onStartRide?.(); }}
      />

      <RequestToJoinSheet
        visible={requestSheetOpen}
        tripTitle={r.title}
        isSubmitting={requestToJoin.isPending}
        onCancel={() => !requestToJoin.isPending && setRequestSheetOpen(false)}
        onSubmit={handleRequestSubmit}
      />
    </SafeAreaView>
  );
});

// --- Sub-components ---

function OverviewTab({ r }: { r: TripDetails }) {
  return (
    <View style={styles.overview}>
      {/* Route Timeline */}
      <View>
        <Kicker style={styles.sectionLabel}>Route</Kicker>
        <View style={styles.timeline}>
          <View style={styles.timelineLine}>
            <View style={styles.timelineDotOutline} />
            <View style={styles.timelineConnector} />
            <View style={styles.timelineDotFilled} />
          </View>
          <View style={styles.timelineContent}>
            <View>
              <Kicker>FROM · {r.start}</Kicker>
              <Text style={styles.timelinePlace}>{r.from}</Text>
            </View>
            <View>
              <Kicker>TO · {r.end}</Kicker>
              <Text style={styles.timelinePlace}>{r.to}</Text>
            </View>
          </View>
        </View>
      </View>

      <Hairline />

      <View>
        <Kicker style={styles.sectionLabel}>Brief</Kicker>
        <Text style={styles.description}>{r.description}</Text>
      </View>

      <Hairline />

      <View>
        <Kicker style={styles.sectionLabel}>Organizer</Kicker>
        <View style={styles.organizerRow}>
          <Avatar name={r.organizer} size={44} tone={0} />
          <View style={styles.organizerInfo}>
            <Text style={styles.organizerName}>{r.organizer}</Text>
            <Text style={styles.organizerMeta}>Expert · 12 trips led</Text>
          </View>
          <Pressable style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>View</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MembersTab({ members, total }: { members: Member[]; total: number }) {
  const empty = Math.max(0, total - members.length);
  return (
    <View style={styles.membersTab}>
      <View style={styles.membersSummary}>
        <View>
          <Text style={styles.membersCount}>{members.length} confirmed</Text>
          <Text style={styles.membersRemaining}>{empty} spots remaining</Text>
        </View>
        <View style={styles.membersAvatars}>
          {members.slice(0, 4).map((m, i) => (
            <View key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
              <Avatar name={m.name} size={26} tone={m.tone} />
            </View>
          ))}
        </View>
      </View>

      <View>
        {members.map((m, i) => (
          <View key={i} style={[styles.memberRow, i < members.length - 1 && styles.memberRowBorder]}>
            <Avatar name={m.name} size={36} tone={m.tone} />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text style={styles.memberHandle}>{m.handle}</Text>
            </View>
            {m.role && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{m.role}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

interface ApiJoinRequest {
  _id: string;
  user: { _id: string; fName?: string; lName?: string; email?: string };
  requestedAt: string;
  message?: string;
}

function RequestsTab({
  requests,
  isLoading,
  busyUserId,
  onAccept,
  onDecline,
}: {
  requests: ApiJoinRequest[];
  isLoading: boolean;
  busyUserId: string | null;
  onAccept: (userId: string) => void;
  onDecline: (userId: string) => void;
}) {
  if (isLoading && requests.length === 0) {
    return (
      <View style={styles.requestsTab}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={styles.requestsTab}>
        <View style={styles.requestsHeader}>
          <View>
            <Text style={styles.requestsCount}>0 pending</Text>
            <Text style={styles.requestsSub}>Nothing to review</Text>
          </View>
          <View style={styles.liveDot} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.requestsTab}>
      <View style={styles.requestsHeader}>
        <View>
          <Text style={styles.requestsCount}>{requests.length} pending</Text>
          <Text style={styles.requestsSub}>You can approve or decline</Text>
        </View>
        <View style={styles.liveDot} />
      </View>

      <View style={styles.requestsList}>
        {requests.map((q, i) => {
          const userId = q.user?._id;
          const fullName = `${q.user?.fName ?? ''} ${q.user?.lName ?? ''}`.trim() || (q.user?.email ?? 'User');
          const isBusy = busyUserId === userId;
          return (
            <View key={q._id ?? i} style={styles.requestCard}>
              <Avatar name={fullName} size={38} tone={i % 4} />
              <View style={styles.requestContent}>
                <View style={styles.requestTop}>
                  <Text style={styles.requestName} numberOfLines={1}>{fullName}</Text>
                  <Text style={styles.requestWhen}>{relativeShort(q.requestedAt)}</Text>
                </View>
                <Text style={styles.requestHandle}>{q.user?.email ?? '—'}</Text>
                {q.message ? <Text style={styles.requestNote}>“{q.message}”</Text> : null}

                <View style={styles.requestActions}>
                  <Pressable
                    onPress={() => userId && onDecline(userId)}
                    disabled={isBusy || !userId}
                    style={[styles.declineBtn, isBusy && { opacity: 0.5 }]}
                  >
                    <IconX size={13} color={colors.ink} />
                    <Text style={styles.actionText}>Decline</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => userId && onAccept(userId)}
                    disabled={isBusy || !userId}
                    style={[styles.approveBtn, isBusy && { opacity: 0.5 }]}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <IconCheck size={13} color={colors.white} />
                    )}
                    <Text style={[styles.actionText, { color: colors.white }]}>Approve</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function relativeShort(iso?: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function QATab() {
  return (
    <View style={styles.qaTab}>
      {DEMO_QA.map((x, i) => (
        <View key={i} style={styles.qaItem}>
          <Text style={styles.qaQuestion}>{x.q}</Text>
          <Text style={styles.qaBy}>{x.by}</Text>
          <View style={styles.qaAnswer}>
            <Text style={styles.qaAnswerText}>
              <Text style={styles.qaAnswerAuthor}>Arjun · </Text>
              {x.a}
            </Text>
          </View>
        </View>
      ))}
      <Pressable style={styles.askBtn}>
        <Text style={styles.askBtnText}>Ask a question</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerNav: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  heroContainer: {
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  heroImage: {
    aspectRatio: 5 / 3,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f0f0f',
    position: 'relative',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 999,
  },
  difficultyText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.white,
  },
  titleSection: {
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 32,
    fontWeight: '500',
    letterSpacing: -0.96,
    lineHeight: 32.64,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  titleItalic: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 36,
    color: colors.ink,
  },
  metricsSection: {
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  metricsCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabsContainer: {
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.n200,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 18,
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.065,
    color: colors.n500,
    fontFamily: fonts.sans,
  },
  tabTextActive: {
    color: colors.ink,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.ink,
  },
  tabContent: {
    paddingHorizontal: 22,
    minHeight: 200,
  },
  ctaContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: colors.paper,
    flexDirection: 'row',
    gap: 10,
  },
  chatBtn: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaBtn: {
    flex: 1,
  },

  // Overview
  overview: {
    paddingVertical: 4,
    paddingBottom: 20,
    gap: 22,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  timeline: {
    flexDirection: 'row',
    gap: 14,
  },
  timelineLine: {
    alignItems: 'center',
    paddingTop: 4,
  },
  timelineDotOutline: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  timelineConnector: {
    flex: 1,
    width: 1,
    backgroundColor: colors.n300,
    minHeight: 48,
    marginVertical: 2,
  },
  timelineDotFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.ink,
  },
  timelineContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  timelinePlace: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.27,
    color: colors.ink,
    marginTop: 2,
    fontFamily: fonts.sans,
  },
  description: {
    fontSize: 15,
    lineHeight: 23.25,
    color: colors.n700,
    fontFamily: fonts.sans,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  organizerMeta: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.n500,
    letterSpacing: 0.44,
    marginTop: 2,
  },
  viewBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.n300,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },

  // Members
  membersTab: {
    paddingVertical: 4,
    paddingBottom: 20,
  },
  membersSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: colors.n100,
    borderRadius: 12,
  },
  membersCount: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  membersRemaining: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.n500,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  membersAvatars: {
    flexDirection: 'row',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  memberHandle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.n500,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  roleBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: colors.ink,
  },
  roleText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: 'uppercase',
    color: colors.white,
  },

  // Requests
  requestsTab: {
    paddingVertical: 4,
    paddingBottom: 20,
  },
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: colors.ink,
    borderRadius: 12,
  },
  requestsCount: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
    fontFamily: fonts.sans,
  },
  requestsSub: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  requestsList: {
    gap: 10,
  },
  requestCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  requestContent: {
    flex: 1,
    minWidth: 0,
  },
  requestTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.sans,
  },
  requestWhen: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.n500,
    letterSpacing: 0.4,
    flexShrink: 0,
  },
  requestHandle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.n500,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  requestNote: {
    fontSize: 13,
    lineHeight: 19.5,
    color: colors.n700,
    marginTop: 8,
    fontFamily: fonts.sans,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  declineBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.n300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  approveBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },

  // Q&A
  qaTab: {
    paddingVertical: 4,
    paddingBottom: 20,
    gap: 16,
  },
  qaItem: {},
  qaQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  qaBy: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.n500,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  qaAnswer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.n100,
    borderRadius: 10,
  },
  qaAnswerText: {
    fontSize: 13,
    lineHeight: 19.5,
    color: colors.n700,
    fontFamily: fonts.sans,
  },
  qaAnswerAuthor: {
    fontWeight: '600',
    color: colors.ink,
  },
  askBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.n300,
    alignItems: 'center',
  },
  askBtnText: {
    fontSize: 13,
    color: colors.n600,
    fontFamily: fonts.sans,
  },
});

export default DetailsScreen
