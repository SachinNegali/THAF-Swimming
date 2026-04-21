import type { Trip } from '@/types/api';

export type RideMode =
  | { type: 'none' }
  | { type: 'quick'; groupId: string }
  | { type: 'trip'; trip: Trip };

export type RouteMode = 'motorcycle' | 'driving' | 'bicycling' | 'walking';

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: { main_text: string; secondary_text: string };
}

export interface TrafficSegment {
  coordinates: { latitude: number; longitude: number }[];
  color: string;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export const GOOGLE_MAPS_API_KEY = 'AIzaSyBIaPQX7NEd3CBNIbRw93kKG890LPyXcWs';
export const TRACKING_WS_URL = 'wss://api.tankhalfull.com/tracking';
export const BUDDY_API_BASE = 'https://api.tankhalfull.com/v1';

export const TRAFFIC_COLORS = {
  NORMAL: '#34A853',
  SLOW: '#FBBC04',
  TRAFFIC_JAM: '#EA4335',
} as const;

export const ROUTE_MODE_COLORS: Record<RouteMode, string> = {
  motorcycle: '#FF6D00',
  driving: '#4285F4',
  bicycling: '#34A853',
  walking: '#FBBC04',
};
