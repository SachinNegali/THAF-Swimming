import type { BottomSheetModalProps } from '@gorhom/bottom-sheet';
import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme';

interface BottomSheetProps extends Omit<BottomSheetModalProps, 'ref' | 'snapPoints'> {
  visible: boolean;
  onClose: () => void;
  snapPoints: string[];
  children: React.ReactNode;
  backdropOpacity?: number;
  /** Set to true if content needs to scroll */
  scrollable?: boolean;
  /** Custom handle style */
  handleIndicatorStyle?: ViewStyle;
  /** Sheet background style */
  backgroundStyle?: ViewStyle;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  snapPoints,
  children,
  backdropOpacity = 0.5,
  scrollable = false,
  enablePanDownToClose = true,
  handleIndicatorStyle,
  backgroundStyle,
  ...rest
}) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  
  // Sync visible prop with internal sheet state
  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  // Handle dismiss events (swipe, backdrop, button)
  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={backdropOpacity}
        pressBehavior="close"
      />
    ),
    [backdropOpacity]
  );

  const Container = scrollable ? BottomSheetScrollView : BottomSheetView;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={enablePanDownToClose}
      onDismiss={handleDismiss}
      enableDynamicSizing={false}
      handleIndicatorStyle={[styles.handleIndicator, handleIndicatorStyle]}
      backgroundStyle={[styles.background, backgroundStyle]}
      {...rest}
    >
      <Container style={styles.contentContainer}>
        {children}
      </Container>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.paper,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  handleIndicator: {
    width: 36,
    height: 4,
    backgroundColor: colors.n300,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
  },
});