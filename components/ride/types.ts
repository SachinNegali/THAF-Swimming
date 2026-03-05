export interface Buddy {
  id: string;
  numericId?: number;  // uint32 from binary protocol
  name: string;
  latitude: number;
  longitude: number;
  avatar: string;
  status: string;
  battery: number;
  lastSeen: string;
  speed?: number;      // km/h from tracking
  bearing?: number;    // degrees from tracking
}

export type QuickActionPriority = 'emergency' | 'medium' | 'regular';

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  priority: QuickActionPriority;
  description: string;
}

export const PRIORITY_COLORS: Record<QuickActionPriority, string> = {
  emergency: '#EA4335',
  medium: '#FF9800',
  regular: '#4285F4',
};
