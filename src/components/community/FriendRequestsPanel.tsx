import { useState } from 'react';
import { Check, X, Clock, Search, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { cancelFriendRequest, respondToFriendRequest, sendFriendRequest, type UseFriendsResult } from '@/lib/friends';
import { findUserByFriendId, type FriendIdSearchResult } from '@/lib/friendId';
import { FriendActionButton } from '@/components/community/FriendActionButton';

export function FriendRequestsPanel({ friends }: { friends: UseFriendsResult }) {
  const { user } = useUser();
  const [busyId, setBusyId] = useState<number | null>(null);

  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<FriendIdSearchResult | null>(null);
  const [searchFriendBusy, setSearchFriendBusy] = useState(false);

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim() || searching) return;
    setSearching(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      const result = await findUserByFriendId(searchId);
      if (!result) {
        setSearchError('No one found with that Friend ID.');
      } else {
        setSearchResult(result);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Could not search, please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!user || !searchResult || searchFriendBusy) return;
    setSearchFriendBusy(true);
    try {
      await sendFriendRequest({
        fromUserId: user.id,
        fromDisplayName: user.fullName ?? user.username ?? 'A Born to Fire member',
        toUserId: searchResult.clerkUserId,
        toDisplayName: searchResult.displayName,
      });
      await friends.refresh();
    } catch {
      // Button reflects the current state - not worth a dedicated error UI for a secondary action.
    } finally {
      setSearchFriendBusy(false);
    }
  };

  const handleAcceptFromSearch = async (requestId: number) => {
    if (!user || searchFriendBusy) return;
    setSearchFriendBusy(true);
    try {
      await respondToFriendRequest(requestId, user.id, true);
      await friends.refresh();
    } finally {
      setSearchFriendBusy(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Add by Friend ID
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Every member has a unique Friend ID — find yours at the top of your Profile page.
        </p>
        <form onSubmit={handleSearch} className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. BTF-U000123"
              className="w-full rounded-full border-0 bg-gray-100 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !searchId.trim()}
            className="btn-primary shrink-0 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </button>
        </form>
        {searchError && <p className="mt-2 text-xs text-red-500">{searchError}</p>}
        {searchResult && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-2.5 dark:bg-gray-700/40">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {searchResult.displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{searchResult.friendId}</p>
            </div>
            {searchResult.clerkUserId === user?.id ? (
              <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">That's you</span>
            ) : (
              <FriendActionButton
                friendStatus={friends.statusFor(searchResult.clerkUserId)}
                onSend={handleSendRequest}
                onAccept={handleAcceptFromSearch}
                busy={searchFriendBusy}
              />
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-6 dark:border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Incoming ({friends.incoming.length})
        </p>
        {friends.incoming.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No pending requests.</p>
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
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">You haven't sent any requests.</p>
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
                  className="flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-500 disabled:opacity-60 dark:text-gray-400"
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
