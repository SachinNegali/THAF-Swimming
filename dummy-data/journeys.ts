// import { Journey } from "@/types/trips";

// export const JOURNEYS: Journey[] = [
//   {
//     id: '1',
//     title: 'Pacific Coast Expedition',
//     isFeatured: true,
//     createdDate: 'Oct 12',
//     from: 'San Francisco',
//     to: 'Los Angeles',
//     startDate: 'Oct 20, 08:30',
//     endDate: 'Oct 25, 18:15',
//     duration: '5d',
//     description: 'A curated scenic journey through the central coast. Includes scheduled stops at Big Sur, Monterey Bay, and Santa Barbara.',
//   },
//   {
//     id: '2',
//     title: 'Sierra Nevada Weekend',
//     createdDate: 'Oct 10',
//     from: 'SF',
//     to: 'YOSEMITE',
//     startDate: 'Oct 22',
//     endDate: 'Oct 24',
//     duration: '2d',
//   },
//   {
//     id: '3',
//     title: 'Tahoe Winter Retreat',
//     createdDate: 'Oct 14',
//     from: 'SF',
//     to: 'TAHOE',
//     startDate: 'Nov 01',
//     endDate: 'Nov 05',
//     duration: '4d',
//   },
//   {
//     id: '4',
//     title: 'Napa Valley Wine Tour',
//     createdDate: 'Oct 15',
//     from: 'SF',
//     to: 'NAPA',
//     startDate: 'Oct 30',
//     endDate: 'Oct 31',
//     duration: '1d',
//   },
//   {
//     id: '5',
//     title: 'Desert Solitude',
//     createdDate: 'Oct 16',
//     from: 'LA',
//     to: 'JOSHUA TREE',
//     startDate: 'Nov 10',
//     endDate: 'Nov 12',
//     duration: '2d',
//   },
//   {
//     id: '6',
//     title: 'Lake Shasta Escape',
//     createdDate: 'Oct 17',
//     from: 'SF',
//     to: 'SHASTA',
//     startDate: 'Nov 15',
//     endDate: 'Nov 18',
//     duration: '3d',
//   },
//   {
//     id: '7',
//     title: 'Big Sur Road Trip',
//     createdDate: 'Oct 18',
//     from: 'SF',
//     to: 'BIG SUR',
//     startDate: 'Nov 20',
//     endDate: 'Nov 21',
//     duration: '1d',
//   },
//   {
//     id: '8',
//     title: 'Mendocino Coast',
//     createdDate: 'Oct 19',
//     from: 'SF',
//     to: 'MENDOCINO',
//     startDate: 'Dec 01',
//     endDate: 'Dec 03',
//     duration: '2d',
//   },
// ];




// import { Journey, DateOption } from './types';

export const DATE_OPTIONS = [
  { id: '1', label: 'Anytime', isActive: true },
  { id: '2', label: 'Oct 20' },
  { id: '3', label: 'Oct 21' },
  { id: '4', label: 'Oct 22' },
  { id: '5', label: 'Oct 23' },
  { id: '6', label: 'Oct 24' },
];

export const JOURNEYS = [
  {
    id: 'j1',
    title: 'Pacific Coast Expedition',
    isRecommended: true,
    createdDate: 'Oct 12',
    departure: {
      dateTime: 'Oct 20, 08:30',
      location: 'San Francisco',
      code: 'SF',
    },
    arrival: {
      dateTime: 'Oct 25, 18:15',
      location: 'Los Angeles',
      code: 'LA',
    },
    duration: '5d',
    description: 'A curated scenic journey through the central coast. Includes scheduled stops at Big Sur, Monterey Bay, and Santa Barbara with local insights on coastal landmarks and hidden gems.',
    featured: true,
  },
  {
    id: 'j2',
    title: 'Sierra Nevada Weekend',
    createdDate: 'Oct 10',
    departure: {
      dateTime: 'Oct 22',
      location: 'San Francisco',
      code: 'SF',
    },
    arrival: {
      dateTime: 'Oct 24',
      location: 'Yosemite',
      code: 'YOSEMITE',
    },
    duration: '2d',
  },
  {
    id: 'j3',
    title: 'Tahoe Winter Retreat',
    createdDate: 'Oct 14',
    departure: {
      dateTime: 'Nov 01',
      location: 'San Francisco',
      code: 'SF',
    },
    arrival: {
      dateTime: 'Nov 05',
      location: 'Tahoe',
      code: 'TAHOE',
    },
    duration: '4d',
  },
  {
    id: 'j4',
    title: 'Napa Valley Wine Tour',
    createdDate: 'Oct 15',
    departure: {
      dateTime: 'Oct 30',
      location: 'San Francisco',
      code: 'SF',
    },
    arrival: {
      dateTime: 'Oct 31',
      location: 'Napa',
      code: 'NAPA',
    },
    duration: '1d',
  },
  {
    id: 'j5',
    title: 'Central Valley Express',
    createdDate: 'Oct 16',
    departure: {
      dateTime: 'Nov 10',
      location: 'San Francisco',
      code: 'SF',
    },
    arrival: {
      dateTime: 'Nov 10',
      location: 'Fresno',
      code: 'FRE',
    },
    duration: '4h',
  },
];




export const MOCK_USER = {
  id: "test string",
  name: "test string",
  username: "test string",
  email: "test string",
  bio: "test string",
  location: "test string",
  level: 2,
  avatarUrl: "test string",
  joinedDate: "test string",
  stats: {
    countries: 2,
    trips: 2,
    followers: "test string",
  }
}