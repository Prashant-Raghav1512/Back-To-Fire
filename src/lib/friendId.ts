import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { apiFetch, authedFetch } from '@/lib/dataApi';

// Every signed-in visitor gets one of these, get-or-created the moment this
// is called — unlike a Membership's member_id (only granted by explicitly
// joining) or a community_profiles row (only created by saving Personal
// Details), a Friend ID needs no deliberate action first. display_name is
// refreshed on every call (ON CONFLICT DO UPDATE) rather than a one-time
// snapshot, since creation isn't a deliberate user action the way joining a
// membership is — it should just track whatever Clerk currently has.
export async function getOrCreateFriendId(displayName: string, token: string | null): Promise<string> {
  const result = await authedFetch<{ friendId: string }>(
    `/friend-id?displayName=${encodeURIComponent(displayName)}`,
    token
  );
  return result.friendId;
}

export interface FriendIdSearchResult {
  clerkUserId: string;
  displayName: string;
  friendId: string;
}

// The entry point for "add someone as a friend by their ID" — available to
// every visitor, unlike membership.ts's findMemberByMemberId which only
// finds people who've joined a paid membership.
export async function findUserByFriendId(friendId: string): Promise<FriendIdSearchResult | null> {
  const normalized = friendId.trim();
  if (!normalized) return null;
  return apiFetch<FriendIdSearchResult | null>(`/friend-id/search?friendId=${encodeURIComponent(normalized)}`);
}

// A real, live count of everyone who's ever signed in (every signed-in
// visitor gets a user_ids row, see getOrCreateFriendId above) — used on the
// Community page as honest social proof instead of a fabricated number.
// Deliberately not scoped to "has posted" or "has a friend" — this counts
// registered visitors, not activity, so it stays meaningful even on a
// freshly-launched deployment where every group's chat/posts feed is still
// empty.
export async function getTotalMemberCount(): Promise<number> {
  const result = await apiFetch<{ count: number }>('/member-count');
  return result.count;
}

export function useMemberCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTotalMemberCount()
      .then((c) => {
        if (!cancelled) setCount(c);
      })
      .catch(() => {
        // Purely decorative stat - fail silently rather than showing an error UI.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}

// Ensures the signed-in visitor has a Friend ID and returns it. Cheap
// enough (one upsert) to call from multiple mounted components at once —
// see FriendIdBootstrap.tsx, mounted app-wide so the row exists as early as
// possible, independent of ProfilePage/CommunityPage also calling this to
// display it.
export function useFriendId() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [friendId, setFriendId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !user) {
      setFriendId(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getToken()
      .then((token) => getOrCreateFriendId(user.fullName ?? user.username ?? 'Born to Fire member', token))
      .then((id) => {
        if (!cancelled) setFriendId(id);
      })
      .catch((err) => {
        console.error('Failed to load Friend ID:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user, getToken]);

  return { friendId, loading };
}
