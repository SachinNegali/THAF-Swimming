import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useThemeColor } from '../../hooks/use-theme-color';
import { User, ViewState } from '../../types/app';
import { BottomSheet } from '../ui';

interface PublicProfileScreenProps {
  user: User;
  onNavigate: (view: ViewState) => void;
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
}

export const PublicProfileScreen: React.FC<PublicProfileScreenProps> = ({ user, onNavigate, isOpen, setIsOpen }) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  return (
    // <View style={[styles.container, { backgroundColor }]}>
        <BottomSheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        snapPoints={["75%", "90%"]}
        scrollable={true}
      >
        <View style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={{ flex: 1 }}>
        <ScreenHeader title="Public Profile" onBack={() => onNavigate('PROFILE')} />
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { borderColor: tintColor }]}>
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            <View style={[styles.verified, { backgroundColor: tintColor, borderColor: backgroundColor }]}>
              <Text style={{ color: '#fff', fontSize: 10 }}>Ic verified</Text>
            </View>
          </View>
          <Text style={[styles.name, { color: textColor }]}>{user.name}</Text>
          <Text style={[styles.username, { color: textMuted }]}>@{user.username}</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Countries" value={user.stats.countries} />
          <Stat label="Trips" value={user.stats.trips} />
          <Stat label="Followers" value={user.stats.followers} />
        </View>

        <Text style={[styles.bio, { color: textColor }]}>{user.bio}</Text>

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.mainBtn, { backgroundColor: tintColor }]}>
            <Text style={{ color: '#fff' }}>Ic person_add</Text>
            <Text style={styles.mainBtnText}>Follow</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.subBtn, { backgroundColor: surfaceColor, borderColor }]}>
            <Text style={{ color: textColor }}>Ic chat_bubble</Text>
            <Text style={[styles.subBtnText, { color: textColor }]}>Message</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tripsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Previous Trips</Text>
            <TouchableOpacity><Text style={{ color: tintColor, fontSize: 12 }}>View all</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            <MiniTrip title="Kyoto" date="Oct 2023" img="https://picsum.photos/seed/kyoto/300/400" />
            <MiniTrip title="Paris" date="Aug 2023" img="https://picsum.photos/seed/paris/300/400" />
            <MiniTrip title="Bali" date="Jan 2023" img="https://picsum.photos/seed/bali/300/400" />
          </ScrollView>
        </View>
      </ScrollView>
    <View style={{ height: 100 }} />
    </View>
    </BottomSheet>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => {
  const textColor = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: textMuted }]}>{label}</Text>
    </View>
  );
};

const MiniTrip = ({ title, date, img }: { title: string; date: string; img: string }) => {
  const textColor = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  return (
    <View style={styles.miniTrip}>
      <Image source={{ uri: img }} style={styles.miniImg} />
      <Text style={[styles.miniTitle, { color: textColor }]}>{title}</Text>
      <Text style={{ color: textMuted, fontSize: 10 }}>{date}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 32 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, padding: 4, position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 50 },
  verified: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 24, fontWeight: '800', marginTop: 16 },
  username: { fontSize: 14, fontWeight: '500' },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginVertical: 24 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  bio: { textAlign: 'center', paddingHorizontal: 40, fontSize: 14, lineHeight: 20 },
  btnRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 32 },
  mainBtn: { flex: 1, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  mainBtnText: { color: '#fff', fontWeight: '700' },
  subBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  subBtnText: { fontWeight: '700' },
  tripsSection: { marginTop: 40, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  miniTrip: { width: 140 },
  miniImg: { width: 140, height: 180, borderRadius: 16, marginBottom: 8 },
  miniTitle: { fontSize: 14, fontWeight: '700' }
});

