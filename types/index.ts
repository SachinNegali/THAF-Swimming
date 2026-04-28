export interface Ride {
  id: string;
  title: string;
  from: string;
  to: string;
  dist: string;
  days: number;
  level: string;
  spots: number;
  total: number;
  tag: string;
  start: string;
  tone: number;
}

export interface FeaturedRide {
  id: string;
  title: string;
  region: string;
  distance: string;
  days: number;
  difficulty: string;
  elevation: string;
  organizer: string;
  organizerRole: string;
  spots: number;
  filled: number;
  total: number;
  kicker: string;
}


//Search n Details flow
export interface SearchRide extends Ride {
  tag: string;
}

export interface FilterState {
  from: string;
  to: string;
  dates: string;
  distance: string;
  level: string;
  days: string;
}

export interface Member {
  name: string;
  handle: string;
  role?: string;
  tone: number;
}

export interface JoinRequest {
  name: string;
  handle: string;
  tone: number;
  when: string;
  note: string;
}

export interface QAItem {
  q: string;
  by: string;
  a: string;
}

export interface TripDetails {
  id: string;
  title: string;
  region: string;
  from: string;
  to: string;
  dist: string;
  days: number;
  level: string;
  start: string;
  end: string;
  spots: number;
  total: number;
  filled: number;
  organizer: string;
  description: string;
}