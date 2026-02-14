
export type ViewState = 'PROFILE' | 'EDIT_PROFILE' | 'SETTINGS' | 'PREFERENCES' | 'HELP';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  location: string;
  level: number;
  avatarUrl: string;
  joinedDate: string;
  stats: {
    countries: number;
    trips: number;
    followers: string;
  };
}

export interface Trip {
  id: string;
  destination: string;
  dateRange: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  imageUrl: string;
  rating?: number;
}

export interface TransportOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}
