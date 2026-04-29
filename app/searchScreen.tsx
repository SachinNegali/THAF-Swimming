import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DEMO_SEARCH_RESULTS } from '../data/demoData';
import { colors, fonts } from '../theme';
import { FilterState, SearchRide } from '../types';
// import { StatusBar } from '../components/core/StatusBar';
import { Kicker } from '../components/core/Kicker';
import { Pill } from '../components/core/Pill';
import { FilterSheet } from '../components/search/FilterSheet';
import { SearchResult } from '../components/search/SearchResult';
import { IconBack, IconBookmark, IconSearch, IconSliders, IconX } from '../icons/Icons';

interface SearchScreenProps {
  onOpenRide: (ride: SearchRide) => void;
  onBack: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  from: 'Mumbai', to: 'Anywhere', dates: 'Anytime',
  distance: 'Any', level: 'Any', days: '1-7',
};

const SearchScreen = React.memo(({ onOpenRide, onBack }: SearchScreenProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const activeFilterCount = useMemo(() => 
    Object.values(filters).filter(v => v !== 'Any' && v !== 'Anywhere' && v !== 'Anytime').length,
  [filters]);

  const filteredResults = useMemo(() => {
    let results = [...DEMO_SEARCH_RESULTS];
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(r => 
        r.title.toLowerCase().includes(q) ||
        r.from.toLowerCase().includes(q) ||
        r.to.toLowerCase().includes(q)
      );
    }
    return results;
  }, [query]);

  const handleRidePress = useCallback((ride: SearchRide) => () => onOpenRide(ride), [onOpenRide]);

  return (
    <SafeAreaView style={styles.screen}>
      {/* <StatusBar /> */}
      
      {/* Sticky Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={onBack} style={styles.iconBtn}>
            <IconBack size={18} color={colors.ink} />
          </Pressable>
          <Kicker>Search</Kicker>
          <Pressable style={styles.iconBtn}>
            <IconBookmark size={16} color={colors.ink} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <IconSearch size={16} color={colors.n500} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search rides, routes, riders…"
            placeholderTextColor={colors.n500}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <IconX size={14} color={colors.n500} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      {activeFilterCount > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips} contentContainerStyle={styles.filterChipsContent}>
          {filters.from !== 'Anywhere' && (
            <Pill tone="muted">
              {filters.from} <Text style={styles.chipArrow}>→</Text> {filters.to}
            </Pill>
          )}
          {filters.dates !== 'Anytime' && <Pill tone="muted">{filters.dates}</Pill>}
          {filters.level !== 'Any' && <Pill tone="muted">{filters.level}</Pill>}
        </ScrollView>
      )}

      {/* Results */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredResults.length} <Text style={styles.resultsLabel}>RESULTS</Text>
          </Text>
          <Pressable style={styles.sortBtn}>
            <Text style={styles.sortText}>Sort: Departure ↓</Text>
          </Pressable>
        </View>

        <View style={styles.resultsList}>
          {filteredResults.map((r, i) => (
            <SearchResult key={r.id} r={r} onPress={handleRidePress(r)} index={i} />
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable onPress={() => setSheetOpen(true)} style={styles.fab}>
        <IconSliders size={20} color={colors.white} />
        {activeFilterCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </Pressable>

      {/* Filter Sheet */}
      <FilterSheet
        visible={sheetOpen}
        filters={filters}
        onApply={(f) => { setFilters(f); setSheetOpen(false); }}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.n200,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.07,
    padding: 0,
  },
  filterChips: {
    maxHeight: 48,
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  filterChipsContent: {
    gap: 8,
    paddingRight: 22,
  },
  chipArrow: {
    color: colors.n500,
    marginHorizontal: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 140,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 8,
    paddingBottom: 14,
  },
  resultsCount: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.44,
    color: colors.ink,
  },
  resultsLabel: {
    color: colors.n500,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.n600,
    textTransform: 'uppercase',
  },
  resultsList: {
    gap: 10,
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 108,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
    zIndex: 5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.paper,
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    color: colors.ink,
  },
});

export default SearchScreen