export type MembershipType = 'normal' | 'corporate' | 'family';
export type BillingCycle = 'monthly' | 'yearly';

export interface MembershipTypeInfo {
  id: MembershipType;
  label: string;
  tagline: string;
  icon: string;
  /** Monthly price in INR, or null for custom/negotiated pricing (corporate). */
  price: number | null;
  /**
   * Yearly price in INR — a discounted total, not `price * 12` (roughly
   * two months free), or null for custom/negotiated pricing (corporate).
   */
  yearlyPrice: number | null;
  /** Benefits specific to this type, shown in addition to sharedMemberBenefits below. */
  benefits: string[];
}

// Every member — regardless of which of the three types they join — gets
// all of these, plus whatever's listed under their specific type below.
// Static, like `benefits`/`navLinks` in content.ts - not Neon-backed.
export const sharedMemberBenefits: string[] = [
  'A digital Member ID card, unique to you',
  'Priority booking at every gym branch',
  '10% off all program and plan renewals',
  'One free 1:1 form-check call every quarter',
  'Early access to new programs and events',
  'Access to the members-only Community group',
];

export const membershipTypes: MembershipTypeInfo[] = [
  {
    id: 'normal',
    label: 'Normal Membership',
    tagline: 'For individual members training on their own.',
    icon: 'User',
    price: 499,
    yearlyPrice: 4999,
    benefits: ['One free guest pass every month', 'Personal progress dashboard'],
  },
  {
    id: 'corporate',
    label: 'Corporate Membership',
    tagline: 'For companies sponsoring their team’s fitness.',
    icon: 'Building2',
    price: null,
    yearlyPrice: null,
    benefits: [
      'Bulk-rate pricing for your whole team',
      'Company leaderboard and team challenges',
      'One consolidated monthly invoice',
    ],
  },
  {
    id: 'family',
    label: 'Family Membership',
    tagline: 'One membership, up to 4 family members covered.',
    icon: 'Users',
    price: 1299,
    yearlyPrice: 12999,
    benefits: [
      'Register up to 4 family members - no separate account needed for each',
      'Shared family workout challenges',
      'Priority invites to family-day events',
    ],
  },
];
