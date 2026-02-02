// import BottomSheetLib, {
//     BottomSheetBackdrop,
//     BottomSheetView,
// } from "@gorhom/bottom-sheet";
// import React, { useCallback, useEffect, useMemo, useRef } from "react";
// import { StyleProp, ViewStyle } from "react-native";

// interface BottomSheetProps {
//   visible: boolean;
//   onClose: () => void;
//   children: React.ReactNode;
//   snapPoints?: string[];
//   style?: StyleProp<ViewStyle>;
// }

// export function BottomSheet({
//   visible,
//   onClose,
//   children,
//   snapPoints: customSnapPoints,
//   style,
// }: BottomSheetProps) {
//   const bottomSheetRef = useRef<BottomSheetLib>(null);
//   const snapPoints = useMemo(
//     () => customSnapPoints || ["25%", "50%", "75%"],
//     [customSnapPoints]
//   );

//   useEffect(() => {
//     if (visible) {
//       bottomSheetRef.current?.snapToIndex(0);
//     } else {
//       bottomSheetRef.current?.close();
//     }
//   }, [visible]);

//   const renderBackdrop = useCallback(
//     (props: any) => (
//       <BottomSheetBackdrop
//         {...props}
//         disappearsOnIndex={-1}
//         appearsOnIndex={0}
//         pressBehavior="close"
//       />
//     ),
//     []
//   );

//   const handleSheetChanges = useCallback(
//     (index: number) => {
//       if (index === -1) {
//         onClose();
//       }
//     },
//     [onClose]
//   );

//   return (
//     <BottomSheetLib
//       ref={bottomSheetRef}
//       index={-1}
//       snapPoints={snapPoints}
//       onChange={handleSheetChanges}
//       backdropComponent={renderBackdrop}
//       enablePanDownToClose
//       style={style}
//     >
//       <BottomSheetView style={{ flex: 1 }}>{children}</BottomSheetView>
//     </BottomSheetLib>
//   );
// }




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
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
  },
});