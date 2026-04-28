/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// const tintColorLight = '#0a7ea4';
// const tintColorDark = '#fff';

// export const Colors = {
//   light: {
//     text: '#11181C',
//     background: '#fff',
//     tint: tintColorLight,
//     icon: '#687076',
//     tabIconDefault: '#687076',
//     tabIconSelected: tintColorLight,
//   },
//   dark: {
//     text: '#ECEDEE',
//     background: '#151718',
//     tint: tintColorDark,
//     icon: '#9BA1A6',
//     tabIconDefault: '#9BA1A6',
//     tabIconSelected: tintColorDark,
//   },
// };



const tintColorLight = '#1f1f1f';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    surface: '#f8fafc',
    surfaceLight: '#f1f5f9',
    border: '#e2e8f0',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    textMuted: '#64748b',
    textDim: '#94a3b8',
  },
  dark: {
    // text: '#ECEDEE',
    // background: '#101622',
    // tint: tintColorDark,
    // icon: '#9BA1A6',
    // tabIconDefault: '#9BA1A6',
    // tabIconSelected: tintColorDark,
    // surface: '#1e293b',
    // surfaceLight: '#2d3e5a',
    // border: '#324467',
    // success: '#22c55e',
    // danger: '#ef4444',
    // warning: '#f59e0b',
    // textMuted: '#92a4c9',
    // textDim: '#64748b',

    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    surface: '#f8fafc',
    surfaceLight: '#f1f5f9',
    border: '#e2e8f0',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    textMuted: '#64748b',
    textDim: '#94a3b8',
  },
};


export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
