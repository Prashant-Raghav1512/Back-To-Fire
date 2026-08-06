import type { AgeGroupInfo, PaidPlan } from '@/data/types';

// Static, like `benefits`/`navLinks`/`events` elsewhere in src/data — not
// Neon-backed. These are paid coaching memberships, distinct from the free
// `programs` in content.ts. Every tier includes calisthenics lessons, gym
// branch access, and a diet plan; only Premium adds a personal trainer.
export const ageGroups: AgeGroupInfo[] = [
  {
    id: 'youth',
    label: 'Youth',
    ageRange: '8–17 yrs',
    description: 'Fun, safe strength training that builds confidence, coordination, and healthy habits early.',
  },
  {
    id: 'adults',
    label: 'Adults',
    ageRange: '18–50 yrs',
    description: 'Structured strength and skill coaching built around student and working-professional schedules.',
  },
  {
    id: 'seniors',
    label: 'Seniors',
    ageRange: '51+ yrs',
    description: 'Gentle, joint-friendly training focused on mobility, balance, and staying independent.',
  },
];

export const paidPlans: PaidPlan[] = [
  // Youth ------------------------------------------------------------
  {
    id: 'youth-basic',
    ageGroup: 'youth',
    tier: 'Basic',
    title: 'Youth Basic',
    price: 999,
    description: 'A gentle, structured starting point for kids and teens new to calisthenics.',
    features: [
      '2 group calisthenics sessions/week',
      "Access to your nearest gym branch (kids' hours)",
      'Standard growing-body nutrition plan',
      'Progress report every month',
    ],
    hasPersonalTrainer: false,
  },
  {
    id: 'youth-standard',
    ageGroup: 'youth',
    tier: 'Standard',
    title: 'Youth Standard',
    price: 1799,
    description: 'More coaching time and a customized nutrition plan for consistent young athletes.',
    features: [
      '4 group calisthenics sessions/week, smaller batches',
      'Full access to your nearest gym branch',
      'Customized nutrition plan, reviewed monthly',
      'Parent progress updates every 2 weeks',
    ],
    hasPersonalTrainer: false,
  },
  {
    id: 'youth-premium',
    ageGroup: 'youth',
    tier: 'Premium',
    title: 'Youth Premium',
    price: 2999,
    description: 'One-on-one coaching for young athletes ready to progress faster, safely.',
    features: [
      'Everything in Youth Standard',
      '1-on-1 personal trainer, 2 sessions/week',
      'Fully personalized diet plan with weekly check-ins',
      'Priority access to your nearest gym branch',
    ],
    hasPersonalTrainer: true,
  },

  // Adults -------------------------------------------------------------
  {
    id: 'adults-basic',
    ageGroup: 'adults',
    tier: 'Basic',
    title: 'Adults Basic',
    price: 1499,
    description: 'Structured group coaching that fits around a busy student or work schedule.',
    features: [
      '3 group calisthenics sessions/week',
      'Off-peak access to your nearest gym branch',
      'Standard diet plan template',
      'Monthly progress check-in',
    ],
    hasPersonalTrainer: false,
  },
  {
    id: 'adults-standard',
    ageGroup: 'adults',
    tier: 'Standard',
    title: 'Adults Standard',
    price: 2499,
    description: 'Small-batch coaching and a diet plan built around your actual routine.',
    features: [
      '5 group calisthenics sessions/week, small batches',
      'Full-day access to your nearest gym branch',
      'Customized diet plan, reviewed monthly',
      'Priority booking for events & workshops',
    ],
    hasPersonalTrainer: false,
  },
  {
    id: 'adults-premium',
    ageGroup: 'adults',
    tier: 'Premium',
    title: 'Adults Premium',
    price: 3999,
    description: 'Dedicated 1-on-1 coaching for the fastest, safest path to advanced skills.',
    features: [
      'Everything in Adults Standard',
      '1-on-1 personal trainer, 3 sessions/week',
      'Fully personalized diet plan with weekly check-ins',
      'Priority access + locker at your nearest gym branch',
    ],
    hasPersonalTrainer: true,
  },

  // Seniors ------------------------------------------------------------
  {
    id: 'seniors-basic',
    ageGroup: 'seniors',
    tier: 'Basic',
    title: 'Seniors Basic',
    price: 1199,
    description: 'Low-impact group sessions focused on safe, steady movement.',
    features: [
      '2 gentle group calisthenics sessions/week',
      'Off-peak access to your nearest gym branch',
      'Standard joint-friendly diet plan',
      'Monthly mobility check-in',
    ],
    hasPersonalTrainer: false,
  },
  {
    id: 'seniors-standard',
    ageGroup: 'seniors',
    tier: 'Standard',
    title: 'Seniors Standard',
    price: 1999,
    description: 'More frequent small-batch sessions with regular health tracking.',
    features: [
      '4 gentle group sessions/week, small batches',
      'Full-day access to your nearest gym branch',
      'Customized diet plan, reviewed monthly',
      'Quarterly health & mobility assessment',
    ],
    hasPersonalTrainer: false,
  },
  {
    id: 'seniors-premium',
    ageGroup: 'seniors',
    tier: 'Premium',
    title: 'Seniors Premium',
    price: 3499,
    description: 'Dedicated 1-on-1 coaching for safe, personalized strength and balance work.',
    features: [
      'Everything in Seniors Standard',
      '1-on-1 personal trainer, 2 sessions/week',
      'Fully personalized diet plan with weekly check-ins',
      'Priority access to your nearest gym branch',
    ],
    hasPersonalTrainer: true,
  },
];
