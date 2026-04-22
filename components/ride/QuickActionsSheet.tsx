import { MaterialCommunityIcons } from '@expo/vector-icons';
// import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
// import { TouchableOpacity } from 'react-native-gesture-handler';

import { BottomSheet } from '../ui';
import { PRIORITY_COLORS, QuickAction, QuickActionPriority } from './types';

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'rider-down', label: 'Rider Down', icon: 'alert-circle', priority: 'emergency', description: 'Emergency: rider down alert' },
  { id: 'regroup', label: 'Re-Group', icon: 'account-group', priority: 'regular', description: 'Signal all riders to regroup' },
  { id: 'all-clear', label: 'All Clear', icon: 'check-circle-outline', priority: 'regular', description: 'Signal all clear to riders' },
  { id: 'fuel', label: 'Fuel Stop', icon: 'gas-station', priority: 'medium', description: 'Notify riders of fuel stop' },
  { id: 'breakfast', label: 'Breakfast', icon: 'food', priority: 'medium', description: 'Signal a food/breakfast stop' },
  { id: 'take-lead', label: 'Take Lead', icon: 'flag-checkered', priority: 'regular', description: 'Signal to take the lead' },
];

export interface QuickActionsSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSendAction?: (action: QuickAction) => void;
}

const QuickActionsSheet : React.FC<QuickActionsSheetProps> = ({ isOpen, setIsOpen, onSendAction }) => {
//   const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '75%', '100%'], []);

//   React.useImperativeHandle(ref, () => ({
//     open: () => sheetRef.current?.snapToIndex(0),
//     close: () => sheetRef.current?.close(),
//   }));

  const handleAction = useCallback((action: QuickAction) => {
    const send = () => {
      onSendAction?.(action);
      setIsOpen(false);
    };

    if (action.id === 'rider-down') {
      Alert.alert(
        'Rider Down',
        'Are you sure you want to send a Rider Down alert? This will notify all riders immediately.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Alert', style: 'destructive', onPress: send },
        ]
      );
    } else {
      send();
    }
  }, [onSendAction, setIsOpen]);

  const renderPriorityDot = (priority: QuickActionPriority) => (
    <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[priority] }]} />
  );

  // Render 2 per row
  const rows: QuickAction[][] = [];
  for (let i = 0; i < QUICK_ACTIONS.length; i += 2) {
    rows.push(QUICK_ACTIONS.slice(i, i + 2));
  }

  return (
    <BottomSheet
            visible={isOpen}
            onClose={() => setIsOpen(false)}
            snapPoints={snapPoints}
            scrollable={true}
          >
            {/* <Text style={styles.title}>Quick Actions</Text>
    //     <View style={styles.legend}>
    //       <View style={styles.legendItem}>
    //         <View style={[styles.legendDot, { backgroundColor: PRIORITY_COLORS.emergency }]} />
    //         <Text style={styles.legendText}>Emergency</Text>
    //       </View>
    //       <View style={styles.legendItem}>
    //         <View style={[styles.legendDot, { backgroundColor: PRIORITY_COLORS.medium }]} />
    //         <Text style={styles.legendText}>Medium</Text>
    //       </View>
    //       <View style={styles.legendItem}>
    //         <View style={[styles.legendDot, { backgroundColor: PRIORITY_COLORS.regular }]} />
    //         <Text style={styles.legendText}>Regular</Text>
    //       </View>
    //     </View>
    //   </View> */}
    <View style={styles.grid}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.gridRow}>
            {row.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => handleAction(action)}
                activeOpacity={0.7}
              >
                {renderPriorityDot(action.priority)}
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={28}
                  color="#424242"
                  style={styles.actionIcon}
                />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        </View>
          </BottomSheet>
  );
};

QuickActionsSheet.displayName = 'QuickActionsSheet';

export default QuickActionsSheet;

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  indicator: {
    backgroundColor: '#DADADA',
    width: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 10,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  grid: {
    paddingHorizontal: 16,
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 2,
    borderColor: '#00000066',
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  actionIcon: {
    marginBottom: 8,
    marginTop: 4,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#424242',
    textAlign: 'center',
  },
});
