import { useEffect, useState } from 'react';
import { neon } from '@neondatabase/serverless';
import { useUser } from '@clerk/clerk-react';

// SECURITY NOTE: same browser-exposed connection as the rest of the
// Community/Friends feature (src/lib/friends.ts, community.ts) — see those
// files' SECURITY NOTE comments for why a separate role wouldn't add real
// access restriction on this project.
const connectionString = import.meta.env.VITE_NEON_CONTACT_URL;

function client() {
  if (!connectionString) {
    throw new Error('Friend IDs are not configured (VITE_NEON_CONTACT_URL is unset).');
  }
  return neon(connectionString);
}

// Every signed-in visitor gets one of these, get-or-created the moment this
// is called — unlike a Membership's member_id (only granted by explicitly
// joining) or a community_profiles row (only created by saving Personal
// Details), a Friend ID needs no deliberate action first. display_name is
// refreshed on every call (ON CONFLICT DO UPDATE) rather than a one-time
// snapshot, since creation isn't a deliberate user action the way joining a
// membership is — it should just track whatever Clerk currently has.
export async function getOrCreateFriendId(clerkUserId: string, displayName: string): Promise<string> {
  const sql = client();
  const rows = (await sql`
    INSERT INTO user_ids (clerk_user_id, display_name)
    VALUES (${clerkUserId}, ${displayName})
    ON CONFLICT (clerk_user_id) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING friend_id
  `) as { friend_id: string }[];
  return rows[0].friend_id;
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
  const normalized = friendId.trim().toUpperCase();
  if (!normalized) return null;

  const sql = client();
  const rows = (await sql`
    SELECT clerk_user_id, display_name, friend_id FROM user_ids WHERE friend_id = ${normalized}
  `) as { clerk_user_id: string; display_name: string; friend_id: string }[];
  const row = rows[0];
  if (!row) return null;
  return { clerkUserId: row.clerk_user_id, displayName: row.display_name, friendId: row.friend_id };
}

// Ensures the signed-in visitor has a Friend ID and returns it. Cheap
// enough (one upsert) to call from multiple mounted components at once —
// see FriendIdBootstrap.tsx, mounted app-wide so the row exists as early as
// possible, independent of ProfilePage/CommunityPage also calling this to
// display it.
export function useFriendId() {
  const { user, isSignedIn } = useUser();
  const [friendId, setFriendId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !user) {
      setFriendId(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getOrCreateFriendId(user.id, user.fullName ?? user.username ?? 'Born to Fire member')
      .then((id) => {
        if (!cancelled) setFriendId(id);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user]);

  return { friendId, loading };
}
