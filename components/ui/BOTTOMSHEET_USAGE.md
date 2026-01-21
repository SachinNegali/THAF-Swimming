# BottomSheet Usage Guide

## Overview
The app now uses `@gorhom/bottom-sheet`, a production-ready, well-tested library for bottom sheets in React Native.

## Installation
Already installed:
```bash
npm install @gorhom/bottom-sheet@^5
```

## Setup
The root layout (`app/_layout.tsx`) is already configured with required providers:
- `GestureHandlerRootView` - Required for gestures
- `BottomSheetModalProvider` - Required for bottom sheet functionality

## Basic Usage

### Import
```tsx
import { BottomSheet } from "@/components/ui";
```

### Example
```tsx
import { BottomSheet } from "@/components/ui";
import { useState } from "react";
import { View, Text, Button } from "react-native";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <Button title="Open Sheet" onPress={() => setIsOpen(true)} />
      
      <BottomSheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        snapPoints={["25%", "50%", "90%"]}
      >
        <View style={{ padding: 20 }}>
          <Text>Bottom Sheet Content</Text>
          <Button title="Close" onPress={() => setIsOpen(false)} />
        </View>
      </BottomSheet>
    </View>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | - | Controls visibility of the bottom sheet |
| `onClose` | `() => void` | - | Callback when sheet is closed |
| `children` | `React.ReactNode` | - | Content to display in the sheet |
| `snapPoints` | `string[]` | `["25%", "50%", "75%"]` | Snap points for the sheet (e.g., `["50%", "90%"]`) |
| `style` | `StyleProp<ViewStyle>` | - | Custom styles for the sheet |

## Features

✅ **Swipe to dismiss** - Drag down to close
✅ **Backdrop** - Semi-transparent overlay with tap to close
✅ **Snap points** - Multiple height positions
✅ **Smooth animations** - Native performance
✅ **Keyboard handling** - Automatically adjusts for keyboard
✅ **Accessibility** - Built-in accessibility support

## Advanced Usage

### Custom Snap Points
```tsx
<BottomSheet
  visible={isOpen}
  onClose={() => setIsOpen(false)}
  snapPoints={["30%", "60%", "95%"]}
>
  {/* Content */}
</BottomSheet>
```

### Full Height Sheet
```tsx
<BottomSheet
  visible={isOpen}
  onClose={() => setIsOpen(false)}
  snapPoints={["95%"]}
>
  {/* Content */}
</BottomSheet>
```

### With Scrollable Content
```tsx
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

<BottomSheet visible={isOpen} onClose={() => setIsOpen(false)}>
  <BottomSheetScrollView>
    {/* Long scrollable content */}
  </BottomSheetScrollView>
</BottomSheet>
```

## Library Documentation
For more advanced features, see: https://gorhom.github.io/react-native-bottom-sheet/
