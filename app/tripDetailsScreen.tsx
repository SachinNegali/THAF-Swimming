import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
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
// import { BroadcastSheet } from '../components/organisms/BroadcastSheet';

interface DetailsScreenProps {
  ride?: TripDetails;
  onBack: () => void;
  onStartRide?: () => void;
}

type TabId = 'overview' | 'members' | 'requests' | 'qa';

const TABS: { id: TabId; label: (r: TripDetails) => string }[] = [
  { id: 'overview', label: () => 'Overview' },
  { id: 'members', label: (r) => `Members · ${r.filled}/${r.total}` },
  { id: 'requests', label: () => `Requests · ${DEMO_REQUESTS.length}` },
  { id: 'qa', label: () => 'Q&A' },
];

const DetailsScreen = React.memo(({ ride, onBack, onStartRide }: DetailsScreenProps) => {
  const [tab, setTab] = useState<TabId>('overview');
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const isOrganizer = true;

  const r = ride || DEMO_TRIP;

  return (
    <SafeAreaView style={styles.screen}>
      {/* <StatusBar /> */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Nav */}
        <View style={styles.headerNav}>
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <IconBack size={18} color={colors.ink} />
          </Pressable>
          <Kicker>Trip · TRP-2451</Kicker>
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
              <Text style={styles.difficultyText}>Technical</Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Kicker>LADAKH · INDIA · 34.15°N 77.57°E</Kicker>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Leh to </Text>
            <Text style={styles.titleItalic}>Pangong Tso</Text>
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsCard}>
            <Metric value="223" label="km" />
            <Metric value="3" label="days" />
            <Metric value="4,350" label="elev m" />
            <Metric value="2/8" label="spots" />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabs}>
              {TABS.map(t => {
                const active = tab === t.id;
                return (
                  <Pressable key={t.id} onPress={() => setTab(t.id)} style={styles.tab}>
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label(r)}</Text>
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
          {tab === 'members' && <MembersTab members={DEMO_MEMBERS} total={r.total} />}
          {tab === 'requests' && <RequestsTab requests={DEMO_REQUESTS} isOrganizer={isOrganizer} />}
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
        ) : (
          <PrimaryButton
            icon={<IconArrowRight size={16} color={colors.white} />}
            style={styles.ctaBtn}
          >
            Request to join
          </PrimaryButton>
        )}
      </View>

      {/* <BroadcastSheet
        visible={broadcastOpen}
        members={DEMO_MEMBERS.filter(m => m.role !== 'Organizer').map(m => m.name)}
        onCancel={() => setBroadcastOpen(false)}
        onConfirm={() => { setBroadcastOpen(false); onStartRide?.(); }}
      /> */}
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

function RequestsTab({ requests, isOrganizer }: { requests: JoinRequest[]; isOrganizer: boolean }) {
  const [processed, setProcessed] = useState<Record<number, 'approved' | 'declined'>>({});

  return (
    <View style={styles.requestsTab}>
      <View style={styles.requestsHeader}>
        <View>
          <Text style={styles.requestsCount}>{requests.length} pending</Text>
          <Text style={styles.requestsSub}>
            {isOrganizer ? 'You can approve or decline' : 'Organizer reviews requests'}
          </Text>
        </View>
        <View style={styles.liveDot} />
      </View>

      <View style={styles.requestsList}>
        {requests.map((q, i) => {
          const state = processed[i];
          return (
            <View key={i} style={[styles.requestCard, state && styles.requestCardProcessed]}>
              <Avatar name={q.name} size={38} tone={q.tone} />
              <View style={styles.requestContent}>
                <View style={styles.requestTop}>
                  <Text style={styles.requestName} numberOfLines={1}>{q.name}</Text>
                  <Text style={styles.requestWhen}>{q.when}</Text>
                </View>
                <Text style={styles.requestHandle}>{q.handle}</Text>
                {q.note && <Text style={styles.requestNote}>“{q.note}”</Text>}
                
                {isOrganizer && !state && (
                  <View style={styles.requestActions}>
                    <Pressable onPress={() => setProcessed(p => ({ ...p, [i]: 'declined' }))} style={styles.declineBtn}>
                      <IconX size={13} color={colors.ink} />
                      <Text style={styles.actionText}>Decline</Text>
                    </Pressable>
                    <Pressable onPress={() => setProcessed(p => ({ ...p, [i]: 'approved' }))} style={styles.approveBtn}>
                      <IconCheck size={13} color={colors.white} />
                      <Text style={[styles.actionText, { color: colors.white }]}>Approve</Text>
                    </Pressable>
                  </View>
                )}
                
                {state && (
                  <Text style={[styles.stateText, state === 'approved' ? styles.stateApproved : styles.stateDeclined]}>
                    {state === 'approved' ? '✓ Approved · Added to roster' : '× Declined'}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
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
  requestCardProcessed: {
    backgroundColor: colors.n100,
    opacity: 0.6,
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
  stateText: {
    marginTop: 10,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  stateApproved: {
    color: colors.ink,
  },
  stateDeclined: {
    color: colors.n500,
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