export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Program {
  id: string;
  title: string;
  duration: string;
  difficulty: Difficulty;
  description: string;
  features: string[];
  icon: string;
}

export interface Exercise {
  id: string;
  name: string;
  difficulty: Difficulty;
  muscleGroup: string;
  description: string;
  image: string;
  steps: string[];
}

// Not stored — always derived from `startDate`/`endDate` vs. the current
// date (see src/lib/events.ts's getEventStatus), so it's never possible for
// the displayed status to drift out of sync with reality.
export type EventStatus = 'upcoming' | 'ongoing' | 'ended';

export type EventType = 'Workshop' | 'Bootcamp' | 'Challenge' | 'Meetup' | 'Webinar';

// An ordered step of an event's plan. `date` carries the real day it falls
// on (so multi-week events like a challenge can mix past and future items);
// `time` is just a display label for same-day items, e.g. a single
// afternoon's schedule — see src/lib/events.ts's getAgendaItemStatus for how
// the two combine to decide "already happened" vs "still to come".
export interface EventAgendaItem {
  /** ISO date (YYYY-MM-DD) this item falls on. */
  date: string;
  /** Display time, e.g. "9:00 AM". Omit for whole-day/week items. */
  time?: string;
  title: string;
  description: string;
}

export interface FitnessEvent {
  id: string;
  title: string;
  type: EventType;
  format: 'Online' | 'In-person';
  description: string;
  /** ISO date (YYYY-MM-DD). */
  startDate: string;
  /** ISO date (YYYY-MM-DD), inclusive — same as startDate for single-day events. */
  endDate: string;
  location: string;
  icon: string;
  /** Ordered plan for the event — what happens/happened, step by step. */
  agenda: EventAgendaItem[];
  /** A short outcome summary, shown once the event has ended. */
  recap?: string;
}

export type AgeGroupId = 'youth' | 'adults' | 'seniors';

export interface AgeGroupInfo {
  id: AgeGroupId;
  label: string;
  ageRange: string;
  description: string;
}

export type PlanTier = 'Basic' | 'Standard' | 'Premium';

// A paid coaching membership — distinct from the free `Program` tiers above.
// Every tier includes calisthenics lessons, gym branch access, and a diet
// plan; only `tier === 'Premium'` additionally includes a personal trainer
// (see PaidPlansSection.hasPersonalTrainer usage) — that split is a
// deliberate product decision, not an oversight, so don't add a trainer to
// Basic/Standard without checking with product intent first.
export interface PaidPlan {
  id: string;
  ageGroup: AgeGroupId;
  tier: PlanTier;
  title: string;
  /** Monthly price in INR. */
  price: number;
  description: string;
  features: string[];
  hasPersonalTrainer: boolean;
}

export type ArticleCategory = 'Motivation' | 'Training' | 'Nutrition';

export interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  /** One-line teaser shown on the card. */
  summary: string;
  readTime: string;
  icon: string;
  /** Path relative to public/, e.g. "articles/some-slug.jpg" — resolved against BASE_URL where rendered, same pattern as exercises.json's image field. */
  image: string;
  /** Ordered paragraphs making up the full article, shown in ArticleModal. */
  content: string[];
}

export interface GymBranch {
  id: string;
  name: string;
  locality: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
}

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

// A user's profile row — the state/displayName pair powers the Community
// tab, the rest powers the Profile page's "Personal Details" section. Name
// and profile photo are deliberately not here: Clerk already owns those.
export interface CommunityProfile {
  displayName: string;
  state: string;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  gender: Gender | null;
}

export type CommunityScope = 'state' | 'india';

export interface CommunityMessage {
  id: number;
  clerkUserId: string;
  /** Snapshot of the poster's display name/state at post time — see db/schema.sql. */
  displayName: string;
  state: string;
  message: string;
  createdAt: string;
}
