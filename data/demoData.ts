import { FeaturedRide, JoinRequest, Member, QAItem, Ride, SearchRide, TripDetails } from '../types';

export const DEMO_FEATURED: FeaturedRide = {
  id: 'f1',
  title: 'Leh to Pangong',
  region: 'Ladakh · India',
  distance: '223 km',
  days: 3,
  difficulty: 'Technical',
  elevation: '4,350m',
  organizer: 'Arjun M.',
  organizerRole: 'Expert',
  spots: 2,
  filled: 6,
  total: 8,
  kicker: 'Featured this week',
};

export const DEMO_RIDES: Ride[] = [
  { id: 'r1', title: 'Western Ghats Monsoon Run', from: 'Pune', to: 'Goa', dist: '486 km', days: 2, level: 'Intermediate', spots: 3, total: 6, tag: 'Weekend', start: 'MAY 03', tone: 0 },
  { id: 'r2', title: 'Spiti Circuit', from: 'Shimla', to: 'Manali', dist: '620 km', days: 6, level: 'Advanced', spots: 4, total: 8, tag: 'Expedition', start: 'JUN 12', tone: 1 },
  { id: 'r3', title: 'Coastal Konkan Breakfast Ride', from: 'Mumbai', to: 'Alibaug', dist: '92 km', days: 1, level: 'Easy', spots: 5, total: 12, tag: 'Day Ride', start: 'APR 27', tone: 2 },
];



// import {  } from '../types';

export const DEMO_SEARCH_RESULTS: SearchRide[] = [
  { id: 's1', title: 'Western Ghats Monsoon Run', from: 'Pune', to: 'Goa', dist: '486 km', days: 2, level: 'Intermediate', spots: 3, total: 6, tag: 'Weekend', start: 'MAY 03', tone: 0 },
  { id: 's2', title: 'Spiti Circuit', from: 'Shimla', to: 'Manali', dist: '620 km', days: 6, level: 'Advanced', spots: 4, total: 8, tag: 'Expedition', start: 'JUN 12', tone: 1 },
  { id: 's3', title: 'Coastal Konkan Breakfast', from: 'Mumbai', to: 'Alibaug', dist: '92 km', days: 1, level: 'Easy', spots: 5, total: 12, tag: 'Day Ride', start: 'APR 27', tone: 2 },
  { id: 's4', title: 'Rann of Kutch Sunset', from: 'Ahmedabad', to: 'Bhuj', dist: '412 km', days: 3, level: 'Intermediate', spots: 2, total: 6, tag: 'Weekend', start: 'MAY 18', tone: 3 },
  { id: 's5', title: 'Nilgiri Tea Country Loop', from: 'Coimbatore', to: 'Ooty', dist: '168 km', days: 2, level: 'Easy', spots: 4, total: 8, tag: 'Weekend', start: 'MAY 24', tone: 0 },
];

export const DEMO_MEMBERS: Member[] = [
  { name: 'Arjun Mehta', handle: '@arjun.rides', role: 'Organizer', tone: 0 },
  { name: 'Priya Shah', handle: '@priya.s', tone: 1 },
  { name: 'Dev Kapoor', handle: '@devk', tone: 2 },
  { name: 'Ravi Negali', handle: '@testravi', tone: 3 },
  { name: 'Nikhil R', handle: '@nikr', tone: 0 },
  { name: 'Aisha B', handle: '@aisha', tone: 1 },
];

export const DEMO_REQUESTS: JoinRequest[] = [
  { name: 'Suresh K', handle: '@fuel.tank', tone: 2, when: '2h ago', note: 'Ridden Ladakh twice. Have all gear.' },
  { name: 'Meera T', handle: '@meerat', tone: 3, when: '5h ago', note: 'First high-altitude trip, comfortable on tarmac.' },
  { name: 'Vikram J', handle: '@vikj', tone: 1, when: '1d ago', note: '' },
];

export const DEMO_QA: QAItem[] = [
  { q: 'Is this suitable for a first-time high-altitude rider?', by: 'John D · 2d', a: "Only if you've done 3,500m+ before and are comfortable with sharp hairpins. Pace is steady." },
  { q: "What's the backup plan for weather?", by: 'Alice S · 5h', a: 'Alternative lower-altitude routes queued if passes are unsafe. Call 3h before departure.' },
];

export const DEMO_TRIP: TripDetails = {
  id: 'f1', title: 'Leh to Pangong', region: 'Ladakh · India',
  from: 'Leh', to: 'Pangong', dist: '223 km',
  days: 3, level: 'Technical', start: 'MAY 12', end: 'MAY 15',
  spots: 2, total: 8, filled: 6,
  organizer: 'Arjun Mehta',
  description: 'A measured 3-day run over high-altitude passes — Khardung La, Chang La — ending lakeside at Pangong Tso. Group capped at 8 for pace and safety. Prior high-altitude experience essential.',
};