import { FeaturedRide, JoinRequest, MedicalChecklistItem, MedicalProfile, Member, ProfileData, ProfileTrips, QAItem, Ride, SearchRide, TripDetails } from '../types';

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

export const DEMO_PROFILE: ProfileData = {
  id: '00481',
  name: 'Ravi Negali',
  first: 'Ravi',
  last: 'Negali',
  handle: '@testravi',
  joined: 'Jan 2025',
  base: 'Pune, IN',
  bio: 'Long-distance, weekends only. Likes ghats, hates traffic. Currently chasing 10,000 km this year.',
  bloodGroup: 'O+',
  emergency: { name: 'Anjali Negali', relation: 'Sister', phone: '+91 98•• ••42' },
  bike: { make: 'Royal Enfield', model: 'Himalayan 450', year: '2024', plate: 'MH 12 ZR 4801', odometer: '48,210', nextService: 'MAR 26', insured: true },
  stats: { led: 4, joined: 23, km: '7,842', days: 96 },
  badges: ['Expert Rider', 'High-altitude · 4500m+', 'First-aid certified'],
  goalKm: 10000,
  yearKm: 7842,
};

export const DEMO_PROFILE_TRIPS: ProfileTrips = {
  upcoming: [
    { id: 'pt1', title: 'Leh to Pangong', from: 'Leh', to: 'Pangong', start: 'MAY 12', dist: '223 km', days: 3, role: 'Joined', tag: 'Expedition' },
    { id: 'pt2', title: 'Coastal Konkan Breakfast', from: 'Mumbai', to: 'Alibaug', start: 'APR 27', dist: '92 km', days: 1, role: 'Organizing', tag: 'Day Ride' },
  ],
  completed: [
    { id: 'pt3', title: 'Western Ghats Monsoon Run', from: 'Pune', to: 'Goa', start: 'JUL 12 · 25', dist: '486 km', days: 2, role: 'Joined', tag: 'Weekend' },
    { id: 'pt4', title: 'Spiti Circuit', from: 'Shimla', to: 'Manali', start: 'JUN 02 · 25', dist: '620 km', days: 6, role: 'Organized', tag: 'Expedition' },
    { id: 'pt5', title: 'Deccan Plateau Run', from: 'Pune', to: 'Hyderabad', start: 'MAR 14 · 25', dist: '560 km', days: 2, role: 'Joined', tag: 'Long-haul' },
  ],
  drafts: [
    { id: 'pt6', title: 'Untitled · Goa loop', from: 'Goa', to: 'Goa', start: 'DRAFT', dist: '— km', days: 2, role: 'Draft', tag: 'Weekend' },
  ],
};

export const DEMO_MEDICAL: MedicalProfile = {
  bloodGroup: 'O+',
  bloodGroupName: 'O Positive',
  bloodGroupUpdated: 'Updated 14 Apr 2026',
  conditions: ['No allergies', 'Mild asthma', 'Wears contacts'],
  conditionsNote: 'Carries inhaler in tank bag · responds to standard altitude meds · no known drug allergies.',
  contacts: [
    { id: 'mc1', name: 'Anjali Negali', relation: 'Sister', phone: '+91 98•• ••42', primary: true, verified: true, tone: 1 },
    { id: 'mc2', name: 'Dr. R. Pawar', relation: 'Family doctor', phone: '+91 99•• ••11', tone: 2 },
  ],
  address: {
    name: 'Ravi Negali',
    lines: ['14, Karve Nagar Co-op', 'Kothrud, Pune', 'Maharashtra · 411038', 'India'],
  },
  documents: [
    { label: 'Health insurance', detail: 'Star Health · POL 8841·· ··21', expires: 'EXP MAR 27' },
    { label: 'Bike insurance', detail: 'ICICI Lombard · BIK 2210·· ··49', expires: 'EXP DEC 26' },
    { label: 'Driving licence', detail: 'MH 14 2020 ·· ··73', expires: 'EXP JAN 38' },
  ],
  showOnLockScreen: true,
};

export const DEMO_MEDICAL_CHECKLIST: MedicalChecklistItem[] = [
  { label: 'Blood group', detail: 'Pick from A+, A-, B+, B-, AB+, AB-, O+, O-', done: false },
  { label: 'Emergency contact', detail: 'At least one — verified by SMS', done: false },
  { label: 'Allergies & conditions', detail: 'Optional, helps responders', done: false },
  { label: 'Home address', detail: 'Optional, used for insurance claims', done: false },
];