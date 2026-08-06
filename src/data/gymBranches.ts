import type { GymBranch } from '@/data/types';

// Static, like `events`/`paidPlans` — not Neon-backed. Coordinates are
// locality-level approximations (fine for "which branch is closest", not
// survey-grade), used by src/lib/gymBranches.ts's distance sort.
export const gymBranches: GymBranch[] = [
  {
    id: 'indiranagar',
    name: 'Born to Fire — Indiranagar (HQ)',
    locality: 'Indiranagar',
    address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
    phone: '+91 98765 43210',
    hours: 'Mon–Sat, 5:30 AM – 9:30 PM',
    lat: 12.9716,
    lng: 77.6412,
  },
  {
    id: 'koramangala',
    name: 'Born to Fire — Koramangala',
    locality: 'Koramangala',
    address: '5th Block, Koramangala, Bengaluru, Karnataka 560095',
    phone: '+91 98765 43211',
    hours: 'Mon–Sat, 5:30 AM – 9:30 PM',
    lat: 12.9352,
    lng: 77.6245,
  },
  {
    id: 'whitefield',
    name: 'Born to Fire — Whitefield',
    locality: 'Whitefield',
    address: 'ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066',
    phone: '+91 98765 43212',
    hours: 'Mon–Sat, 6:00 AM – 9:00 PM',
    lat: 12.9698,
    lng: 77.75,
  },
  {
    id: 'hsr-layout',
    name: 'Born to Fire — HSR Layout',
    locality: 'HSR Layout',
    address: '27th Main, HSR Layout, Bengaluru, Karnataka 560102',
    phone: '+91 98765 43213',
    hours: 'Mon–Sat, 5:30 AM – 9:30 PM',
    lat: 12.9121,
    lng: 77.6446,
  },
  {
    id: 'jayanagar',
    name: 'Born to Fire — Jayanagar',
    locality: 'Jayanagar',
    address: '4th Block, Jayanagar, Bengaluru, Karnataka 560011',
    phone: '+91 98765 43214',
    hours: 'Mon–Sat, 6:00 AM – 9:00 PM',
    lat: 12.925,
    lng: 77.5938,
  },
];
