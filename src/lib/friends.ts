import { useCallback, useEffect, useState } from 'react';
import { neon } from '@neondatabase/serverless';
import { useUser } from '@clerk/clerk-react';

// SECURITY NOTE: same browser-exposed connection as the rest of the
// Community feature (src/lib/community.ts, src/lib/communityPosts.ts) —
// see those files' SECURITY NOTE comments for why a separate role wouldn't
// add real access restriction on this project.
const connectionString = import.meta.env.VITE_NEON_CONTACT_URL;

function client() {
  if (!connectionString) {
    throw new Error('Friends are not configured (VITE_NEON_CONTACT_URL is unset).');
  }
  return neon(connectionString);
}

type RequestStatus = 'pending' | 'accepted' | 'declined';

interface FriendRequestRow {
  id: number;
  requester_clerk_user_id: string;
  requester_display_name: string;
  recipient_clerk_user_id: string;
  recipient_display_name: string;
  status: RequestStatus;
  created_at: string;
}

// One side of a friend_requests row, resolved to "the other person" from
// the current user's point of view — used for both the friends list and
// the incoming/outgoing request lists, which all need the same shape.
export interface FriendView {
  requestId: number;
  clerkUserId: string;
  displayName: string;
}

export type FriendStatus =
  | { status: 'none' }
  | { status: 'friends'; requestId: number }
  | { status: 'outgoing_pending'; requestId: number }
  | { status: 'incoming_pending'; requestId: number };

function otherParty(row: FriendRequestRow, me: string): FriendView {
  const iAmRequester = row.requester_clerk_user_id === me;
  return {
    requestId: row.id,
    clerkUserId: iAmRequester ? row.recipient_clerk_user_id : row.requester_clerk_user_id,
    displayName: iAmRequester ? row.recipient_display_name : row.requester_display_name,
  };
}

async function fetchMyFriendRows(clerkUserId: string): Promise<FriendRequestRow[]> {
  const sql = client();
  return (await sql`
    SELECT id, requester_clerk_user_id, requester_display_name, recipient_clerk_user_id, recipient_display_name, status, created_at
    FROM friend_requests
    WHERE requester_clerk_user_id = ${clerkUserId} OR recipient_clerk_user_id = ${clerkUserId}
    ORDER BY created_at DESC
  `) as FriendRequestRow[];
}

export interface SendFriendRequestParams {
  fromUserId: string;
  fromDisplayName: string;
  toUserId: string;
  toDisplayName: string;
}

// Handles every state a pair of users can already be in, rather than just
// blindly inserting — see db/schema.sql's friend_requests comment for the
// direction-independent unique index this all relies on.
export async function sendFriendRequest(params: SendFriendRequestParams): Promise<void> {
  if (params.fromUserId === params.toUserId) {
    throw new Error("You can't add yourself as a friend.");
  }
  const sql = client();
  const existing = (await sql`
    SELECT id, requester_clerk_user_id, status FROM friend_requests
    WHERE (requester_clerk_user_id = ${params.fromUserId} AND recipient_clerk_user_id = ${params.toUserId})
       OR (requester_clerk_user_id = ${params.toUserId} AND recipient_clerk_user_id = ${params.fromUserId})
    LIMIT 1
  `) as { id: number; requester_clerk_user_id: string; status: RequestStatus }[];

  const row = existing[0];
  if (!row) {
    await sql`
      INSERT INTO friend_requests (requester_clerk_user_id, requester_display_name, recipient_clerk_user_id, recipient_display_name)
      VALUES (${params.fromUserId}, ${params.fromDisplayName}, ${params.toUserId}, ${params.toDisplayName})
    `;
    return;
  }
  if (row.status === 'accepted') {
    throw new Error("You're already friends.");
  }
  if (row.status === 'pending') {
    if (row.requester_clerk_user_id === params.toUserId) {
      // They already requested you — accept instead of creating a duplicate.
      await sql`UPDATE friend_requests SET status = 'accepted', responded_at = now() WHERE id = ${row.id}`;
      return;
    }
    throw new Error('Request already sent.');
  }
  // status === 'declined' — allow re-requesting, flipping direction to this new sender.
  await sql`
    UPDATE friend_requests
    SET requester_clerk_user_id = ${params.fromUserId}, requester_display_name = ${params.fromDisplayName},
        recipient_clerk_user_id = ${params.toUserId}, recipient_display_name = ${params.toDisplayName},
        status = 'pending', created_at = now(), responded_at = null
    WHERE id = ${row.id}
  `;
}

// Scoped to the actual recipient — see the SECURITY NOTE above for why this
// is a guard against the app's own UI, not real access control.
export async function respondToFriendRequest(requestId: number, clerkUserId: string, accept: boolean): Promise<void> {
  const sql = client();
  await sql`
    UPDATE friend_requests SET status = ${accept ? 'accepted' : 'declined'}, responded_at = now()
    WHERE id = ${requestId} AND recipient_clerk_user_id = ${clerkUserId} AND status = 'pending'
  `;
}

export async function cancelFriendRequest(requestId: number, clerkUserId: string): Promise<void> {
  const sql = client();
  await sql`
    DELETE FROM friend_requests
    WHERE id = ${requestId} AND requester_clerk_user_id = ${clerkUserId} AND status = 'pending'
  `;
}

// "Unfriending" deletes the friendship row but deliberately leaves any
// direct_messages history intact — see db/schema.sql's direct_messages comment.
export async function removeFriend(requestId: number, clerkUserId: string): Promise<void> {
  const sql = client();
  await sql`
    DELETE FROM friend_requests
    WHERE id = ${requestId} AND status = 'accepted'
      AND (requester_clerk_user_id = ${clerkUserId} OR recipient_clerk_user_id = ${clerkUserId})
  `;
}

// Polls less often than the group chat (community.ts's 7s) — friend status
// changes far less frequently than messages do.
const POLL_INTERVAL_MS = 10000;

export function useFriends() {
  const { user, isSignedIn } = useUser();
  const [rows, setRows] = useState<FriendRequestRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !user) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      setRows(await fetchMyFriendRows(user.id));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const me = user?.id;
  const friends = me ? rows.filter((r) => r.status === 'accepted').map((r) => otherParty(r, me)) : [];
  const incoming = me ? rows.filter((r) => r.status === 'pending' && r.recipient_clerk_user_id === me).map((r) => otherParty(r, me)) : [];
  const outgoing = me ? rows.filter((r) => r.status === 'pending' && r.requester_clerk_user_id === me).map((r) => otherParty(r, me)) : [];

  const statusFor = useCallback(
    (otherUserId: string): FriendStatus => {
      if (!me || otherUserId === me) return { status: 'none' };
      const row = rows.find(
        (r) =>
          (r.requester_clerk_user_id === me && r.recipient_clerk_user_id === otherUserId) ||
          (r.recipient_clerk_user_id === me && r.requester_clerk_user_id === otherUserId)
      );
      if (!row || row.status === 'declined') return { status: 'none' };
      if (row.status === 'accepted') return { status: 'friends', requestId: row.id };
      return row.requester_clerk_user_id === me
        ? { status: 'outgoing_pending', requestId: row.id }
        : { status: 'incoming_pending', requestId: row.id };
    },
    [rows, me]
  );

  return { friends, incoming, outgoing, statusFor, loading, refresh };
}

export type UseFriendsResult = ReturnType<typeof useFriends>;
