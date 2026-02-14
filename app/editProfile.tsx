import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { User, ViewState } from '../types/app';
// import { Icon } from '../components/Icon';
import { useThemeColor } from '../hooks/use-theme-color';
// import { geminiService } from '../services/geminiService';
import { LabeledInput } from '@/components/ui/labeledInput';
import { ThemedText } from '../components/themed-text';

interface EditProfileScreenProps {
  user: User;
  onSave: (updates: Partial<User>) => void;
  onNavigate: (view: ViewState) => void;
}

const EditProfile: React.FC<EditProfileScreenProps> = ({ user, onSave, onNavigate }) => {
  const [formData, setFormData] = useState(user);
  const [loading, setLoading] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

//   const handleAiBio = async () => {
//     setLoading(true);
//     const newBio = await geminiService.generateBio("traveling, mountain hiking, sustainable tourism");
//     setFormData(p => ({ ...p, bio: newBio }));
//     setLoading(false);
//   };

  return (
    <View style={[styles.wrapper, { backgroundColor }]}>
      <ScreenHeader title="Edit Profile" onBack={() => onNavigate('PROFILE')} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarBtn}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: surfaceColor, borderColor }]}>
              {/* <Icon name="photo_camera" size={32} color={textMuted} /> */}
              <ThemedText>{"ic"}</ThemedText>
            </View>
            <Text style={[styles.changeText, { color: tintColor }]}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <LabeledInput label="Full Name" value={formData?.name} onChangeText={(v) => console.log("setFormData(p => ({ ...p, name: v }))")} />
        <LabeledInput label="Email" value={formData?.email} onChangeText={(v) => console.log("setFormData(p => ({ ...p, email: v }))")} />
        
        <View style={styles.bioHeader}>
          <Text style={[styles.bioLabel, { color: textMuted }]}>Bio</Text>
          {/* <TouchableOpacity onPress={() => console.log("handleAiBio")} disabled={loading} style={styles.aiBtn}>
            {loading ? <ActivityIndicator size="small" color={tintColor} /> : 
            <Icon name="auto_awesome" size={14} color={tintColor} />
            }
            <Text style={[styles.aiBtnText, { color: tintColor }]}>AI Enhance</Text>
          </TouchableOpacity> */}
        </View>
        <LabeledInput label="" value={formData?.bio} onChangeText={(v) => console.log("setFormData(p => ({ ...p, bio: v }))")} multiline />

        <LabeledInput label="Location" value={formData?.location} onChangeText={(v) => console.log("setFormData(p => ({ ...p, location: v }))")} icon="location_on" />

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.footer, { borderColor, backgroundColor }]}>
        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: tintColor }]} 
          onPress={() => { onSave(formData); onNavigate('PROFILE'); }}
        >
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarBtn: { alignItems: 'center' },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  changeText: { fontSize: 14, fontWeight: '700' },
  bioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -20, zIndex: 1 },
  bioLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aiBtnText: { fontSize: 12, fontWeight: '700' },
  footer: {
    padding: 20, 
    // marginBottom: 20
},
  saveBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});


export default EditProfile;