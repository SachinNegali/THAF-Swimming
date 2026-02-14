
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColor } from '../hooks/use-theme-color';
import { ViewState } from '../types/app';

interface SettingsScreenProps {
  onNavigate: (view: ViewState) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  // Fix: Added optional children to the type definition to resolve the TS error where children were not recognized as passed
  const Section = ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: textMuted }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: surfaceColor, borderColor }]}>
        {children}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScreenHeader title="Settings" onBack={() => onNavigate('PROFILE')} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Section title="Preferences">
          <ToggleItem label="Notifications" icon="notifications" initialValue={true} />
          <ToggleItem label="Dark Mode" icon="dark_mode" initialValue={true} />
        </Section>

        <Section title="Account & Security">
          <LinkItem label="Privacy Settings" icon="lock" color="#22c55e" />
          <LinkItem label="Security" icon="security" color="#f59e0b" />
          <LinkItem label="Language" icon="language" subtitle="English (US)" color="#06b6d4" />
        </Section>

        <Section title="More">
          <TouchableOpacity style={styles.logoutBtn}>
            <Text style={{ color: '#ef4444' }}>Ic logout</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Section>
        
        <Text style={[styles.versionText, { color: textMuted }]}>App Version 2.4.0 (Build 842)</Text>
      </ScrollView>
    </View>
  );
};

const ToggleItem = ({ label, icon, initialValue }: { label: string; icon: string; initialValue: boolean }) => {
  const textColor = useThemeColor({}, 'text');
  const [val, setVal] = React.useState(initialValue);
  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={{ color: textColor }}>Ic {icon}</Text>
        <Text style={[styles.itemLabel, { color: textColor }]}>{label}</Text>
      </View>
      <Switch value={val} onValueChange={setVal} />
    </View>
  );
};

const LinkItem = ({ label, icon, subtitle, color }: { label: string; icon: string; subtitle?: string; color: string }) => {
  const textColor = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  return (
    <TouchableOpacity style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={{ color }}>Ic {icon}</Text>
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.itemLabel, { color: textColor }]}>{label}</Text>
          {subtitle && <Text style={{ color: textMuted, fontSize: 10 }}>{subtitle}</Text>}
        </View>
      </View>
      <Text style={{ color: textMuted }}>Ic chevron_right</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  sectionContent: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemLabel: { fontSize: 15, fontWeight: '600', marginLeft: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  logoutText: { color: '#ef4444', fontWeight: '700', marginLeft: 12 },
  versionText: { textAlign: 'center', fontSize: 11, marginTop: 16, marginBottom: 40 }
});


export default SettingsScreen;