import { useCallback, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { authedFetch } from '@/lib/dataApi';

type RequestStatus = 'pending' | 'accepted' | 'declined';

interface FriendRequestRow {
  id: number;
  requesterClerkUserId: string;
  requesterDisplayName: string;
  recipientClerkUserId: string;
  recipientDisplayName: string;
  status: RequestStatus;
  createdAt: string;
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
  const iAmRequester = row.requesterClerkUserId === me;
  return {
    requestId: row.id,
    clerkUserId: iAmRequester ? row.recipientClerkUserId : row.requesterClerkUserId,
    displayName: iAmRequester ? row.recipientDisplayName : row.requesterDisplayName,
  };
}

async function fetchMyFriendRows(token: string | null): Promise<FriendRequestRow[]> {
  return authedFetch<FriendRequestRow[]>('/friends', token);
}

export interface SendFriendRequestParams {
  fromDisplayName: string;
  toUserId: string;
  toDisplayName: string;
}

// Handles every state a pair of users can already be in, rather than just
// blindly inserting — see db/schema.sql's friend_requests comment for the
// direction-independent unique index this all relies on. (Server-enforced
// now — see cloudflare-worker-data/routes/friends.ts.)
export async function sendFriendRequest(params: SendFriendRequestParams, token: string | null): Promise<void> {
  await authedFetch('/friends/request', token, { method: 'POST', body: JSON.stringify(params) });
}

export async function respondToFriendRequest(requestId: number, accept: boolean, token: string | null): Promise<void> {
  await authedFetch('/friends/respond', token, { method: 'POST', body: JSON.stringify({ requestId, accept }) });
}

export async function cancelFriendRequest(requestId: number, token: string | null): Promise<void> {
  await authedFetch(`/friends/${requestId}/cancel`, token, { method: 'DELETE' });
}

// "Unfriending" deletes the friendship row but deliberately leaves any
// direct_messages history intact — see db/schema.sql's direct_messages comment.
export async function removeFriend(requestId: number, token: string | null): Promise<void> {
  await authedFetch(`/friends/${requestId}`, token, { method: 'DELETE' });
}

// Polls less often than the group chat (community.ts's 7s) — friend status
// changes far less frequently than messages do.
const POLL_INTERVAL_MS = 10000;

export function useFriends() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [rows, setRows] = useState<FriendRequestRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !user) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      setRows(await fetchMyFriendRows(await getToken()));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user, getToken]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const me = user?.id;
  const friends = me ? rows.filter((r) => r.status === 'accepted').map((r) => otherParty(r, me)) : [];
  const incoming = me ? rows.filter((r) => r.status === 'pending' && r.recipientClerkUserId === me).map((r) => otherParty(r, me)) : [];
  const outgoing = me ? rows.filter((r) => r.status === 'pending' && r.requesterClerkUserId === me).map((r) => otherParty(r, me)) : [];

  const statusFor = useCallback(
    (otherUserId: string): FriendStatus => {
      if (!me || otherUserId === me) return { status: 'none' };
      const row = rows.find(
        (r) =>
          (r.requesterClerkUserId === me && r.recipientClerkUserId === otherUserId) ||
          (r.recipientClerkUserId === me && r.requesterClerkUserId === otherUserId)
      );
      if (!row || row.status === 'declined') return { status: 'none' };
      if (row.status === 'accepted') return { status: 'friends', requestId: row.id };
      return row.requesterClerkUserId === me
        ? { status: 'outgoing_pending', requestId: row.id }
        : { status: 'incoming_pending', requestId: row.id };
    },
    [rows, me]
  );

  return { friends, incoming, outgoing, statusFor, loading, refresh };
}

export type UseFriendsResult = ReturnType<typeof useFriends>;
