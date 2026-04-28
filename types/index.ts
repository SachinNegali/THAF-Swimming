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


// Create Trip flow
export interface CreateTripDraft {
  title: string;
  from: string;
  to: string;
  startDate: string | null; // ISO 'YYYY-MM-DD'
  days: number;
  spots: number | null;     // null = open / unlimited
  description: string;
  requireApproval: boolean;
}

export type CreateTripStepId = 'route' | 'schedule' | 'review';

export interface CreateTripStep {
  id: CreateTripStepId;
  label: string;
}

export interface QuickDateOption {
  label: string;
  date: Date;
  hint?: string;
}


// Profile
export type ProfileTripRole = 'Joined' | 'Organizing' | 'Organized' | 'Draft';
export type ProfileTabId = 'upcoming' | 'completed' | 'drafts';

export interface ProfileBike {
  make: string;
  model: string;
  year: string;
  plate: string;
  odometer?: string;
  nextService?: string;
  insured?: boolean;
}

export interface ProfileEmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface ProfileStats {
  led: number;
  joined: number;
  km: string;
  days: number;
}

export interface ProfileData {
  id: string;
  name: string;
  first: string;
  last: string;
  handle: string;
  joined: string;
  base: string;
  bio: string;
  bloodGroup: string;
  emergency: ProfileEmergencyContact;
  bike: ProfileBike;
  stats: ProfileStats;
  badges: string[];
  goalKm: number;
  yearKm: number;
}

export interface ProfileTrip {
  id: string;
  title: string;
  from: string;
  to: string;
  start: string;
  dist: string;
  days: number;
  role: ProfileTripRole;
  tag: string;
}

export interface ProfileTrips {
  upcoming: ProfileTrip[];
  completed: ProfileTrip[];
  drafts: ProfileTrip[];
}

export interface ProfileSettingsRow {
  label: string;
  detail: string;
}


// Medical & Emergency
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type MedicalContactRelation = 'Family' | 'Partner' | 'Friend' | 'Doctor' | 'Other';
export type MedicalViewMode = 'view' | 'empty' | 'addContact' | 'editContact';

export interface MedicalContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  primary?: boolean;
  verified?: boolean;
  shareLive?: boolean;
  tone?: number;
}

export interface MedicalAddress {
  name: string;
  lines: string[];
}

export interface MedicalDocument {
  label: string;
  detail: string;
  expires: string;
}

export interface MedicalChecklistItem {
  label: string;
  detail: string;
  done: boolean;
}

export interface MedicalProfile {
  bloodGroup: BloodGroup;
  bloodGroupName: string;
  bloodGroupUpdated: string;
  conditions: string[];
  conditionsNote?: string;
  contacts: MedicalContact[];
  address: MedicalAddress;
  documents: MedicalDocument[];
  showOnLockScreen: boolean;
}