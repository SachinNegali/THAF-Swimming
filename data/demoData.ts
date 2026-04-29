import { Buddy, ChatExpense, ChatMember, ChatMessage, ChatThread, FeaturedRide, JoinRequest, MedicalChecklistItem, MedicalProfile, Member, ProfileData, ProfileTrips, QAItem, QuickMessage, Ride, SearchRide, TripDetails } from '../types';

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

export const DEMO_CHAT_THREADS: ChatThread[] = [
  { id: 't1', title: 'Deccan Plateau Run', kind: 'group', members: 4, last: 'Ravi: Pit stop at 340 — fuel + chai', time: '2m', unread: 3, tone: 0, pinned: true, live: true },
  { id: 't2', title: 'Spiti Circuit', kind: 'group', members: 8, last: 'Priya shared an image', time: '18m', unread: 1, tone: 1 },
  { id: 't3', title: 'Arjun Mehta', kind: 'dm', last: 'Got it, see you at 6am', time: '1h', unread: 0, tone: 2 },
  { id: 't4', title: 'Konkan Weekend', kind: 'group', members: 6, last: 'Expense settled: ₹1,240', time: '3h', unread: 0, tone: 3 },
  { id: 't5', title: 'Dev Kapoor', kind: 'dm', last: 'Will carry spare clutch cable', time: '1d', unread: 0, tone: 0 },
  { id: 't6', title: 'Nilgiri Tea Country', kind: 'group', members: 5, last: 'Route updated — via Coonoor', time: '2d', unread: 0, tone: 1 },
];

export const DEMO_CHAT_MESSAGES: ChatMessage[] = [
  { kind: 'system', text: 'Trip started · Pune → Hyderabad', time: '06:00' },
  { kind: 'msg', from: 'Arjun', tone: 0, me: false, text: 'Fueled up and rolling. Meet at Lonavala toll booth by 07:30.', time: '06:12' },
  { kind: 'msg', from: 'Priya', tone: 1, me: false, text: 'Copy. Carrying the first-aid kit and rain gear for everyone.', time: '06:14' },
  { kind: 'image', from: 'Priya', tone: 1, me: false, caption: 'Weather check ahead', filename: 'IMG_4128.HEIC', time: '06:15' },
  { kind: 'msg', from: 'You', me: true, text: "I'll bring spare fuel + the SOS beacon. See you soon.", time: '06:17' },
  { kind: 'expense', from: 'Arjun', tone: 0, me: false, title: 'Fuel — Shell Lonavala', amount: '₹2,400', split: '4 ways · ₹600/ea', paidBy: 'Arjun', status: 'pending', payCta: 'Pay ₹600', time: '08:40' },
  { kind: 'msg', from: 'Dev', tone: 2, me: false, text: 'Settled my share.', time: '08:42' },
  { kind: 'location', from: 'Ravi', tone: 3, me: false, label: 'Dropping pin at pit stop', place: 'Surya Dhaba, NH-48', distance: '340 km · 58 km/h', time: '11:22' },
];

export const DEMO_CHAT_EXPENSES: ChatExpense[] = [
  { id: 'e1', title: 'Fuel — Shell Lonavala', by: 'Arjun', amount: 2400, split: 600, status: 'pending', day: 'Today' },
  { id: 'e2', title: 'Breakfast — Surya Dhaba', by: 'Priya', amount: 720, split: 180, status: 'settled', day: 'Today' },
  { id: 'e3', title: 'Tolls NH-48', by: 'You', amount: 340, split: 85, status: 'owed', day: 'Today' },
];

export const DEMO_CHAT_MEMBERS: ChatMember[] = [
  { id: 'you', name: 'You', tone: 2 },
  { id: 'arjun', name: 'Arjun', tone: 0 },
  { id: 'priya', name: 'Priya', tone: 1 },
  { id: 'dev', name: 'Dev', tone: 2 },
  { id: 'ravi', name: 'Ravi', tone: 3 },
];

export const DEMO_BUDDIES: Buddy[] = [
  { id: 'me', cs: 'BLAZE', name: 'You', tone: 0, x: 52, y: 58, head: 12, kmh: 64, bat: 78, sig: 4, role: 'leader', status: 'live', eta: '—', last: 'now' },
  { id: 'b1', cs: 'KESTREL', name: 'Anjali Negali', tone: 1, x: 47, y: 53, head: 12, kmh: 62, bat: 64, sig: 4, role: 'sweep', status: 'live', eta: '+1m', last: '3s' },
  { id: 'b2', cs: 'WIRE', name: 'Rishi Pawar', tone: 2, x: 41, y: 50, head: 12, kmh: 58, bat: 41, sig: 3, role: 'rider', status: 'live', eta: '+3m', last: '8s' },
  { id: 'b3', cs: 'GINGER', name: 'Mira K.', tone: 3, x: 35, y: 46, head: 12, kmh: 0, bat: 92, sig: 2, role: 'rider', status: 'stopped', eta: '+12m', last: '4m' },
  { id: 'b4', cs: 'NORTH', name: 'Vikram J.', tone: 0, x: 60, y: 64, head: 12, kmh: 71, bat: 33, sig: 4, role: 'scout', status: 'live', eta: '−40s', last: '1s' },
  { id: 'b5', cs: 'PAPER', name: 'Tara D.', tone: 1, x: 28, y: 41, head: 12, kmh: 0, bat: 18, sig: 1, role: 'rider', status: 'lost', eta: '?', last: '14m' },
];

export const DEMO_QUICK_MSGS: QuickMessage[] = [
  { id: 'pace', label: 'Pace ok?', icon: 'pulse' },
  { id: 'fuel', label: 'Need fuel', icon: 'fuel' },
  { id: 'photo', label: 'Photo break', icon: 'cam' },
  { id: 'stop', label: 'Stop ahead', icon: 'stop' },
  { id: 'tea', label: 'Chai stop', icon: 'tea' },
  { id: 'closeup', label: 'Close up', icon: 'close' },
];