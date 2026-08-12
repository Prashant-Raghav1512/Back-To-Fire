export interface CommunityInterest {
  id: string;
  name: string;
  icon: string;
}

// Static, like `indianStates`/`benefits`/`navLinks` elsewhere in src/data —
// not Neon-backed. Used by the Community page's "Interests" group list
// (src/lib/communityGroups.ts) to give members a way to find each other by
// what they're training, not just where they live.
export const communityInterests: CommunityInterest[] = [
  { id: 'beginners', name: 'Beginners Corner', icon: 'Sparkles' },
  { id: 'handstands', name: 'Handstands & Balance', icon: 'Move' },
  { id: 'bar-work', name: 'Pull-ups & Bar Work', icon: 'Dumbbell' },
  { id: 'strength', name: 'Strength Building', icon: 'Flame' },
  { id: 'flexibility', name: 'Flexibility & Mobility', icon: 'Wind' },
  { id: 'weight-loss', name: 'Weight Loss', icon: 'TrendingDown' },
  { id: 'nutrition', name: 'Nutrition & Diet', icon: 'Apple' },
  { id: 'motivation', name: 'Motivation & Mindset', icon: 'Star' },
];
