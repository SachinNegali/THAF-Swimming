import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

export const IconSearch = ({ size = 18, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
    <Path d="m21 21-4.35-4.35" />
  </Svg>
);

export const IconArrowRight = ({ size = 14, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14" />
    <Path d="m12 5 7 7-7 7" />
  </Svg>
);

export const IconSignal = ({ color = colors.ink }: { color?: string }) => (
  <Svg width={18} height={11} viewBox="0 0 18 11" fill={color}>
    <Rect x="0" y="7" width="3" height="4" rx="0.5"/>
    <Rect x="5" y="5" width="3" height="6" rx="0.5"/>
    <Rect x="10" y="3" width="3" height="8" rx="0.5"/>
    <Rect x="15" y="0" width="3" height="11" rx="0.5"/>
  </Svg>
);

export const IconWifi = ({ color = colors.ink }: { color?: string }) => (
  <Svg width={16} height={11} viewBox="0 0 16 11" fill={color}>
    <Path d="M8 2c2.5 0 4.8 1 6.5 2.6l1.5-1.5C13.8 1 11 0 8 0S2.2 1 0 3.1l1.5 1.5C3.2 3 5.5 2 8 2zm0 3c-1.6 0-3.1.6-4.3 1.7l1.5 1.5C6 7.5 7 7 8 7s2 .5 2.8 1.2l1.5-1.5C11.1 5.6 9.6 5 8 5zm0 3c-.8 0-1.5.3-2 .8L8 11l2-2.2c-.5-.5-1.2-.8-2-.8z"/>
  </Svg>
);

export const IconBattery = ({ color = colors.ink }: { color?: string }) => (
  <Svg width={24} height={11} viewBox="0 0 24 11" fill="none">
    <Rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke={color} opacity="0.5"/>
    <Rect x="2" y="2" width="15" height="7" rx="1" fill={color}/>
    <Rect x="21" y="4" width="1.5" height="3" rx="0.5" fill={color} opacity="0.5"/>
  </Svg>
);

// Back arrow
export const IconBack = ({ size = 18, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5" />
    <Path d="m12 19-7-7 7-7" />
  </Svg>
);

//Search screen.....

// Bookmark
export const IconBookmark = ({ size = 16, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </Svg>
);

// X / Close
export const IconX = ({ size = 14, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6 6 18" />
    <Path d="m6 6 12 12" />
  </Svg>
);

// Download / Save to library
export const IconDownload = ({ size = 16, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Path d="m7 10 5 5 5-5" />
    <Path d="M12 15V3" />
  </Svg>
);

// Sliders / Filter
export const IconSliders = ({ size = 20, color = colors.white }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 21v-7" />
    <Path d="M4 10V3" />
    <Path d="M12 21v-9" />
    <Path d="M12 8V3" />
    <Path d="M20 21v-5" />
    <Path d="M20 12V3" />
    <Path d="M1 14h6" />
    <Path d="M9 8h6" />
    <Path d="M17 16h6" />
  </Svg>
);

// Swap
export const IconSwap = ({ size = 14, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m16 3 4 4-4 4" />
    <Path d="M20 7H4" />
    <Path d="m8 21-4-4 4-4" />
    <Path d="M4 17h16" />
  </Svg>
);

// Chat
export const IconChat = ({ size = 18, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

// Flash / Lightning
export const IconFlash = ({ size = 16, color = colors.white }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </Svg>
);

// Check
export const IconCheck = ({ size = 14, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

// Share
export const IconShare = ({ size = 15, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <Path d="m16 6-4-4-4 4" />
    <Path d="M12 2v13" />
  </Svg>
);

// Calendar
export const IconCalendar = ({ size = 18, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Path d="M16 2v4" />
    <Path d="M8 2v4" />
    <Path d="M3 10h18" />
  </Svg>
);

// Shield
export const IconShield = ({ size = 18, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
);

// Minus
export const IconMinus = ({ size = 18, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14" />
  </Svg>
);

// Plus
export const IconPlus = ({ size = 18, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 5v14" />
    <Path d="M5 12h14" />
  </Svg>
);

// Infinity
export const IconInfinity = ({ size = 18, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.739-8z" />
  </Svg>
);

// Home
export const IconHome = ({ size = 22, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </Svg>
);

// Compass
export const IconCompass = ({ size = 22, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="M15.5 8.5L13.5 13.5L8.5 15.5L10.5 10.5Z" />
  </Svg>
);

// Map
export const IconMap = ({ size = 22, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2z" />
    <Path d="M9 3v16M15 5v16" />
  </Svg>
);

// User
export const IconUser = ({ size = 22, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 21a8 8 0 0 1 16 0" />
  </Svg>
);

// Filter
export const IconFilter = ({ size = 22, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 5h18M6 12h12M10 19h4" />
  </Svg>
);

// Clock
export const IconClock = ({ size = 22, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="M12 7v5l3 2" />
  </Svg>
);

// Pin
export const IconPin = ({ size = 22, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s-7-7-7-13a7 7 0 0 1 14 0c0 6-7 13-7 13z" />
    <Circle cx="12" cy="9" r="2.5" />
  </Svg>
);

// Bike
export const IconBike = ({ size = 22, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="5.5" cy="17" r="3" />
    <Circle cx="18.5" cy="17" r="3" />
    <Path d="M5.5 17L10 8h4l3 9M10 8h6M14 8l2-3h2" />
  </Svg>
);

// Route
export const IconRoute = ({ size = 22, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="6" cy="5" r="2" />
    <Circle cx="18" cy="19" r="2" />
    <Path d="M8 5h6a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8h6" />
  </Svg>
);

// Users
export const IconUsers = ({ size = 22, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="9" cy="8" r="3.5" />
    <Path d="M3 20a6 6 0 0 1 12 0" />
    <Circle cx="17" cy="7" r="2.5" opacity="0.7" />
    <Path d="M15 14a5 5 0 0 1 6 5" opacity="0.7" />
  </Svg>
);

// More (3 dots)
export const IconMore = ({ size = 22, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx="5" cy="12" r="1.2" />
    <Circle cx="12" cy="12" r="1.2" />
    <Circle cx="19" cy="12" r="1.2" />
  </Svg>
);

// Layers
export const IconLayers = ({ size = 18, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 4l9 5-9 5-9-5z" />
    <Path d="M3 14l9 5 9-5" />
  </Svg>
);

// Locate
export const IconLocate = ({ size = 18, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </Svg>
);

// Alert (warning triangle)
export const IconAlert = ({ size = 18, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 4l10 16H2z" />
    <Path d="M12 10v4M12 17v.5" />
  </Svg>
);

// Phone
export const IconPhone = ({ size = 18, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </Svg>
);

// Pulse / heartbeat
export const IconPulse = ({ size = 14, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 12h4l2-6 4 12 2-6h6" />
  </Svg>
);

// Fuel
export const IconFuel = ({ size = 14, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="4" y="4" width="10" height="16" rx="1" />
    <Path d="M14 9h3a2 2 0 0 1 2 2v6" />
  </Svg>
);

// Camera
export const IconCamera = ({ size = 14, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="7" width="18" height="13" rx="2" />
    <Circle cx="12" cy="13.5" r="3.5" />
    <Path d="M9 7l1.5-2h3L15 7" />
  </Svg>
);

// Stop sign
export const IconStop = ({ size = 14, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 4h6l5 5v6l-5 5H9l-5-5V9z" />
  </Svg>
);

// Tea cup
export const IconTea = ({ size = 14, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 8h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
    <Path d="M17 10h2a2 2 0 0 1 0 4h-2" />
    <Path d="M8 4q1 1 0 2M12 4q1 1 0 2" />
  </Svg>
);

// CloseUp (target)
export const IconCloseUp = ({ size = 14, color = colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" />
    <Circle cx="12" cy="12" r="8" />
  </Svg>
);