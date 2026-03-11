import { PublicProfileScreen } from '@/components/profile/publicProfile';
import { MOCK_USER } from '@/dummy-data/journeys';
import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { Colors, SPACING } from '../constants/theme'; // Adjust path to your theme file

// --- Types ---

interface TripDetail {
  label: string;
  value: string;
}

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

// --- Mock Data ---

const TRIP_DETAILS: TripDetail[] = [
  { label: 'From', value: 'Zurich' },
  { label: 'To', value: 'Interlaken' },
  { label: 'Departure Date', value: 'Aug 12, 2024' },
  { label: 'Arrival Date', value: 'Aug 15, 2024' },
];

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
const TripHeader = memo(() => {
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');

  return (
    <View style={styles.tripHeader}>
      <Text style={[styles.tripTitle, { color: textColor }]}>Mountain Pass Adventure</Text>
      <View style={styles.locationRow}>
        <Text style={{ color: mutedColor }}>📍</Text>
        <Text style={[styles.locationText, { color: mutedColor }]}>Swiss Alps, Switzerland</Text>
      </View>
    </View>
  );
});

// 3. Route & Timing Section
const RouteTiming = memo(() => {
  const mutedColor = useThemeColor({}, 'textMuted');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>ROUTE & TIMING</Text>
      <View style={styles.detailsGrid}>
        {TRIP_DETAILS.map((detail, index) => (
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
const Description = memo(() => {
  const mutedColor = useThemeColor({}, 'textMuted');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>DESCRIPTION</Text>
      <Text style={[styles.descriptionText, { color: textColor }]}>
        Prepare for an unforgettable journey through the heart of the Alps. This trip is designed for intermediate to experienced riders who enjoy winding switchbacks and high-altitude vistas.
      </Text>
      <Text style={[styles.descriptionText, { color: textColor, marginTop: SPACING.md }]}>
        We will cover approximately 250km per day, with planned stops at Susten Pass, Furka Pass, and Grimsel Pass. Expect varied weather conditions and breathtaking panoramas at every turn. Group size is limited to 8 riders to ensure a personalized and safe experience.
      </Text>
    </View>
  );
});

// 5. Organizer Card
const OrganizerCard = memo(({setIsOpen}: {setIsOpen: (isOpen: boolean) => void}) => {
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const primaryColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>ORGANIZER</Text>
      <Pressable style={[styles.organizerCard, { backgroundColor: surfaceColor, borderColor }]} onPress={() => setIsOpen(true)}>
        <Image 
          source={{ uri: 'https://i.pravatar.cc/150?u=marco' }} 
          style={styles.organizerAvatar} 
        />
        <View style={styles.organizerInfo}>
          <Text style={[styles.organizerName, { color: textColor }]}>Marco Valesquez</Text>
          <Text style={[styles.organizerMeta, { color: mutedColor }]}>Member since Jan 2022</Text>
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
const JoinButton = memo(() => {
  const primaryColor = useThemeColor({}, 'tint');

  return (
    <TouchableOpacity style={[styles.joinButton, { backgroundColor: primaryColor }]}>
      <Text style={styles.joinButtonText}>Join Trip</Text>
    </TouchableOpacity>
  );
});

// --- Main Screen ---

export default function TripDetailsScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');

  // Flat data array for FlashList (FlashList doesn't support sections)

  const [isOpen, setIsOpen] = useState(false);
  const data = [
    { type: 'header' },
    { type: 'tripHeader' },
    { type: 'divider' },
    { type: 'routeTiming' },
    { type: 'divider2' },
    { type: 'description' },
    { type: 'divider3' },
    { type: 'organizer' },
    { type: 'divider4' },
    { type: 'questions' },
    { type: 'joinButton' },
  ];

  const renderItem = useCallback(({ item }: { item: { type: string } }) => {
    switch (item.type) {
      case 'header':
        return <Header />;
      case 'tripHeader':
        return <TripHeader />;
      case 'divider':
      case 'divider2':
      case 'divider3':
      case 'divider4':
        return <View style={[styles.divider, { borderColor }]} />;
      case 'routeTiming':
        return <RouteTiming />;
      case 'description':
        return <Description />;
      case 'organizer':
        return <OrganizerCard setIsOpen={setIsOpen}/>;
      case 'questions':
        return <QuestionsSection />;
      case 'joinButton':
        return <JoinButton />;
      default:
        return null;
    }
  }, [borderColor]);

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
});