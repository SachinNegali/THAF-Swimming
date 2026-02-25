import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface ChatListHeaderProps {
  onTabChange?: (tab: string) => void;
}

const TABS = ['All', 'DMs', 'Trips'];

export default function ChatListHeader({ onTabChange }: ChatListHeaderProps) {
  const isDark = useColorScheme() === 'dark';
  const [activeTab, setActiveTab] = useState('All');

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoSection}>
          <Text style={styles.logoIcon}>🧭</Text>
          <Text style={[styles.title, isDark && styles.textLight]}>Messages</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.iconButton, isDark && styles.iconButtonDark]}>
            <Text>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.composeButton}>
            <Text style={{ color: 'white' }}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Control */}
      <View style={[styles.tabContainer, isDark && styles.tabContainerDark]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleTabPress(tab)}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
              activeTab === tab && isDark && styles.tabButtonActiveDark,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab ? styles.tabTextActive : styles.tabTextInactive,
                isDark && activeTab !== tab && styles.tabTextInactiveDark,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#f6f6f8',
  },
  containerDark: {
    backgroundColor: '#101622',
  },
  textLight: {
    color: '#ffffff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 24,
    color: '#2b6cee',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0d121b',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(43, 108, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonDark: {
    backgroundColor: 'rgba(43, 108, 238, 0.2)',
  },
  composeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2b6cee',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2b6cee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tabContainerDark: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonActiveDark: {
    backgroundColor: '#374151',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#2b6cee',
  },
  tabTextInactive: {
    color: '#6b7280',
  },
  tabTextInactiveDark: {
    color: '#9ca3af',
  },
});
