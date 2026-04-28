import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
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