import type { BottomSheetModalProps } from '@gorhom/bottom-sheet';
import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetFlatList,
    BottomSheetModal,
    BottomSheetModalProvider,
    BottomSheetScrollView,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useMemo,
    useRef
} from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

// Types for the ref methods exposed to parent
export interface BottomSheetRef {
  present: (data?: any) => void;
  dismiss: () => void;
  snapToIndex: (index: number) => void;
  snapToPosition: (position: string | number) => void;
  expand: () => void;
  collapse: () => void;
  close: () => void;
  forceClose: () => void;
}

// Configuration options for the HOC
export interface WithBottomSheetOptions extends Partial<BottomSheetModalProps> {
  /** Snap points (e.g., ['25%', '50%', '90%']) */
  snapPoints?: string[];
  /** Enable dynamic sizing instead of fixed snap points */
  enableDynamicSizing?: boolean;
  /** Show backdrop overlay */
  enableBackdrop?: boolean;
  /** Backdrop opacity (0-1) */
  backdropOpacity?: number;
  /** Use scroll view for content (default: true for lists) */
  scrollable?: boolean | 'flatlist' | 'scrollview' | 'view';
  /** Custom handle component */
  handleComponent?: React.FC;
  /** Background style */
  backgroundStyle?: ViewStyle;
  /** Handle indicator style */
  handleIndicatorStyle?: ViewStyle;
  /** Callback when sheet changes */
  onChange?: (index: number) => void;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Custom backdrop component */
  customBackdrop?: React.FC<BottomSheetBackdropProps>;
}

/**
 * Higher-Order Component that wraps a component in a BottomSheetModal
 * 
 * @param WrappedComponent - Component to render inside the sheet
 * @param options - Configuration options
 * 
 * @example
 * const MySheet = withBottomSheet(MyContent, { snapPoints: ['50%'] });
 * 
 * // In component:
 * const sheetRef = useRef<BottomSheetRef>(null);
 * <MySheet ref={sheetRef} customProp="value" />
 * <Button onPress={() => sheetRef.current?.present()} title="Open" />
 */
export function withBottomSheet<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithBottomSheetOptions = {}
) {
  const {
    snapPoints = ['50%', '90%'],
    enableDynamicSizing = false,
    enableBackdrop = true,
    backdropOpacity = 0.5,
    scrollable = 'view',
    handleComponent,
    backgroundStyle,
    handleIndicatorStyle,
    customBackdrop,
    onChange,
    onDismiss,
    enablePanDownToClose = true,
    ...restBottomSheetProps
  } = options;

  const Component = forwardRef<BottomSheetRef, P & { children?: React.ReactNode }>(
    (props, ref) => {
      const bottomSheetRef = useRef<BottomSheetModal>(null);

      // Expose imperative methods via ref
      useImperativeHandle(ref, () => ({
        present: (data) => bottomSheetRef.current?.present(data),
        dismiss: () => bottomSheetRef.current?.dismiss(),
        snapToIndex: (index) => bottomSheetRef.current?.snapToIndex(index),
        snapToPosition: (position) => bottomSheetRef.current?.snapToPosition(position),
        expand: () => bottomSheetRef.current?.expand(),
        collapse: () => bottomSheetRef.current?.collapse(),
        close: () => bottomSheetRef.current?.close(),
        forceClose: () => bottomSheetRef.current?.forceClose(),
      }), []);

      // Memoized snap points
      const memoizedSnapPoints = useMemo(() => snapPoints, [JSON.stringify(snapPoints)]);

      // Default backdrop
      const renderBackdrop = useCallback(
        (backdropProps: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...backdropProps}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={backdropOpacity}
            pressBehavior="close"
          />
        ),
        [backdropOpacity]
      );

      // Choose container based on scrollable option
      const Container = useMemo(() => {
        switch (scrollable) {
          case 'flatlist':
            return BottomSheetFlatList;
          case 'scrollview':
            return BottomSheetScrollView;
          case 'view':
          default:
            return BottomSheetView;
        }
      }, [scrollable]);

      return (
        <BottomSheetModal
          ref={bottomSheetRef}
          index={0}
          snapPoints={enableDynamicSizing ? undefined : memoizedSnapPoints}
          enableDynamicSizing={enableDynamicSizing}
          enablePanDownToClose={enablePanDownToClose}
          backdropComponent={enableBackdrop ? (customBackdrop || renderBackdrop) : undefined}
          backgroundStyle={[styles.background, backgroundStyle]}
          handleIndicatorStyle={[styles.handleIndicator, handleIndicatorStyle]}
          handleComponent={handleComponent}
          onChange={onChange}
          onDismiss={onDismiss}
          {...restBottomSheetProps}
        >
          <Container style={styles.contentContainer}>
            <WrappedComponent {...props} />
          </Container>
        </BottomSheetModal>
      );
    }
  );

  Component.displayName = `withBottomSheet(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return Component;
}

/**
 * Provider HOC - Wrap your app or screen with this
 * Required for bottom sheets to work
 */
export function withBottomSheetProvider<T extends object>(
  Component: React.ComponentType<T>
) {
  return function ProviderWrapper(props: T) {
    return (
      <BottomSheetModalProvider>
        <Component {...props} />
      </BottomSheetModalProvider>
    );
  };
}

const styles = StyleSheet.create({
  background: {
    borderRadius: 16,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
  },
});