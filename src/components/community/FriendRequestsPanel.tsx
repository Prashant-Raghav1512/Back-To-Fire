import { useState } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { cancelFriendRequest, respondToFriendRequest, type UseFriendsResult } from '@/lib/friends';

export function FriendRequestsPanel({ friends }: { friends: UseFriendsResult }) {
  const { user } = useUser();
  const [busyId, setBusyId] = useState<number | null>(null);

  const handleRespond = async (requestId: number, accept: boolean) => {
    if (!user || busyId !== null) return;
    setBusyId(requestId);
    try {
      await respondToFriendRequest(requestId, user.id, accept);
      await friends.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (requestId: number) => {
    if (!user || busyId !== null) return;
    setBusyId(requestId);
    try {
      await cancelFriendRequest(requestId, user.id);
      await friends.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Incoming ({friends.incoming.length})
        </p>
        {friends.incoming.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">No pending requests.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {friends.incoming.map((r) => (
              <div
                key={r.requestId}
                className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-2.5 dark:bg-gray-700/40"
              >
                <p className="min-w-0 truncate text-sm font-medium text-gray-900 dark:text-white">{r.displayName}</p>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => handleRespond(r.requestId, true)}
                    disabled={busyId === r.requestId}
                    aria-label="Accept"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-600 transition hover:bg-green-200 disabled:opacity-60 dark:bg-green-500/15 dark:text-green-400"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRespond(r.requestId, false)}
                    disabled={busyId === r.requestId}
                    aria-label="Decline"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-500 transition hover:bg-red-200 disabled:opacity-60 dark:bg-red-500/15 dark:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Sent ({friends.outgoing.length})
        </p>
        {friends.outgoing.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">You haven't sent any requests.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {friends.outgoing.map((r) => (
              <div
                key={r.requestId}
                className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-2.5 dark:bg-gray-700/40"
              >
                <p className="min-w-0 truncate text-sm font-medium text-gray-900 dark:text-white">{r.displayName}</p>
                <button
                  onClick={() => handleCancel(r.requestId)}
                  disabled={busyId === r.requestId}
                  className="flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 disabled:opacity-60 dark:text-gray-500"
                >
                  <Clock className="h-3 w-3" /> Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
