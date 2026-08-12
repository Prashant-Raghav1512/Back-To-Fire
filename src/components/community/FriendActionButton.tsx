import { UserPlus, Check, Clock } from 'lucide-react';
import type { FriendStatus } from '@/lib/friends';

interface FriendActionButtonProps {
  friendStatus: FriendStatus;
  onSend: () => void;
  onAccept: (requestId: number) => void;
  busy: boolean;
}

// Contextual per-author action shown next to a chat message or post that
// isn't the current user's own — the entry point into the friend graph.
// Deliberately doesn't render for 'none' after a decline (statusFor()
// already maps declined back to 'none', see friends.ts), so a declined
// request just looks like "Add friend" again rather than showing rejection.
export function FriendActionButton({ friendStatus, onSend, onAccept, busy }: FriendActionButtonProps) {
  if (friendStatus.status === 'friends') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-green-600 dark:text-green-400">
        <Check className="h-3 w-3" /> Friends
      </span>
    );
  }
  if (friendStatus.status === 'outgoing_pending') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">
        <Clock className="h-3 w-3" /> Request sent
      </span>
    );
  }
  if (friendStatus.status === 'incoming_pending') {
    return (
      <button
        onClick={() => onAccept(friendStatus.requestId)}
        disabled={busy}
        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-orange-500 hover:text-orange-600 disabled:opacity-60 dark:text-orange-400"
      >
        <UserPlus className="h-3 w-3" /> Accept request
      </button>
    );
  }
  return (
    <button
      onClick={onSend}
      disabled={busy}
      className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-gray-400 transition-colors hover:text-orange-500 disabled:opacity-60 dark:text-gray-500 dark:hover:text-orange-400"
    >
      <UserPlus className="h-3 w-3" /> Add friend
    </button>
  );
}
