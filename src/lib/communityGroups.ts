import { indianStates } from '@/data/indianStates';
import { ageGroups } from '@/data/paidPlans';
import { communityInterests } from '@/data/communityInterests';
import { groupEventsByStatus } from '@/lib/events';
import type { CommunityGroupType } from '@/data/types';

export interface CommunityGroupOption {
  type: CommunityGroupType;
  key: string;
  label: string;
  sublabel?: string;
  icon: string;
}

// 'india' is deliberately its own top-level option, never mixed into the
// states list below — see db/schema.sql's community_messages comment for
// why that separation now goes all the way down to the data model, not
// just the UI.
export const INDIA_GROUP: CommunityGroupOption = {
  type: 'india',
  key: 'india',
  label: 'All India',
  icon: 'Flag',
};

// A single, fixed room only ever shown in the sidebar to signed-in members
// (see MembershipPage.tsx / CommunityPage.tsx's useMembership() gate) — a
// real, enforced perk from src/data/membershipTypes.ts's "Access to the
// members-only Community group" benefit, not just a line of marketing copy.
export const MEMBERS_GROUP: CommunityGroupOption = {
  type: 'members',
  key: 'members-only',
  label: 'Members Only',
  icon: 'Crown',
};

export const STATE_GROUPS: CommunityGroupOption[] = indianStates.map((s) => ({
  type: 'state',
  key: s.name,
  label: s.name,
  icon: 'MapPin',
}));

// Reuses the same three age bands as the paid membership plans
// (src/data/paidPlans.ts) so "youth/adults/seniors" means one consistent
// thing across the whole app, rather than a second, differently-sliced age
// taxonomy just for Community.
export const AGE_GROUPS: CommunityGroupOption[] = ageGroups.map((a) => ({
  type: 'age',
  key: a.id,
  label: a.label,
  sublabel: a.ageRange,
  icon: 'Users',
}));

export const INTEREST_GROUPS: CommunityGroupOption[] = communityInterests.map((i) => ({
  type: 'interest',
  key: i.id,
  label: i.name,
  icon: i.icon,
}));

// Only ongoing/upcoming events get a discussion group — an ended event has
// no "what's next" left to coordinate, and its recap already lives on the
// Programs & Events page. Recomputed on every call (not cached at module scope) for
// the same reason src/lib/events.ts's chunk generator is: status is a
// function of *today's date*, so a stale cached list could show an event
// whose window already closed.
export function getEventGroups(): CommunityGroupOption[] {
  const { ongoing, upcoming } = groupEventsByStatus();
  return [...ongoing, ...upcoming].map((e) => ({
    type: 'event',
    key: e.id,
    label: e.title,
    sublabel: e.type,
    icon: e.icon,
  }));
}

export function findGroup(type: CommunityGroupType, key: string): CommunityGroupOption | undefined {
  if (type === 'india') return INDIA_GROUP;
  if (type === 'members') return MEMBERS_GROUP;
  if (type === 'state') return STATE_GROUPS.find((g) => g.key === key);
  if (type === 'age') return AGE_GROUPS.find((g) => g.key === key);
  if (type === 'interest') return INTEREST_GROUPS.find((g) => g.key === key);
  return getEventGroups().find((g) => g.key === key);
}
