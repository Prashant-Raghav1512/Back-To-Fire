import type { Difficulty, EventType } from '@/data/types';

// Shared color mapping so a Beginner/Intermediate/Advanced grid always reads
// as three visually distinct tiers, not just via a small badge — reused by
// ProgramsPage, ExercisesPage, and the Home page's featured-programs section
// rather than each defining its own copy.
export const DIFFICULTY_CARD_STYLES: Record<Difficulty, { icon: string; ring: string }> = {
  Beginner: {
    icon: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400',
    ring: 'ring-green-100 dark:ring-green-500/20',
  },
  Intermediate: {
    icon: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
    ring: 'ring-orange-100 dark:ring-orange-500/20',
  },
  Advanced: {
    icon: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    ring: 'ring-red-100 dark:ring-red-500/20',
  },
};

// Distinguishes event cards by type — reused by EventsPage and the Home
// page's events spotlight. Icon badge, card ring, and the type/format pill
// all pick up the same color so a grid of mixed event types reads as
// visually distinct groups rather than one uniform list.
export const EVENT_TYPE_STYLES: Record<EventType, { icon: string; ring: string; badge: string }> = {
  Workshop: {
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    ring: 'ring-blue-100 dark:ring-blue-500/20',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  },
  Bootcamp: {
    icon: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
    ring: 'ring-orange-100 dark:ring-orange-500/20',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  },
  Challenge: {
    icon: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    ring: 'ring-red-100 dark:ring-red-500/20',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  },
  Meetup: {
    icon: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
    ring: 'ring-purple-100 dark:ring-purple-500/20',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  },
  Webinar: {
    icon: 'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
    ring: 'ring-teal-100 dark:ring-teal-500/20',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  },
};
