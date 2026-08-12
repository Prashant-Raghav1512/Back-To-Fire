export type MembershipType = 'normal' | 'corporate' | 'family';

export interface MembershipTypeInfo {
  id: MembershipType;
  label: string;
  tagline: string;
  icon: string;
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
    benefits: ['One free guest pass every month', 'Personal progress dashboard'],
  },
  {
    id: 'corporate',
    label: 'Corporate Membership',
    tagline: 'For companies sponsoring their team’s fitness.',
    icon: 'Building2',
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
    benefits: [
      'Register up to 4 family members - no separate account needed for each',
      'Shared family workout challenges',
      'Priority invites to family-day events',
    ],
  },
];
