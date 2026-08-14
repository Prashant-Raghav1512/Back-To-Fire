import { useState } from 'react';
import { Send, MapPin } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { postMessage, useCommunityMessages } from '@/lib/community';
import { sendFriendRequest, respondToFriendRequest, type UseFriendsResult } from '@/lib/friends';
import { FriendActionButton } from '@/components/community/FriendActionButton';
import { timeAgo } from '@/lib/timeAgo';
import type { CommunityGroupType, CommunityMessage, CommunityProfile } from '@/data/types';

interface MessageBubbleProps {
  message: CommunityMessage;
  showState: boolean;
  mine: boolean;
  friends: UseFriendsResult;
  canAddFriends: boolean;
}

function MessageBubble({ message, showState, mine, friends, canAddFriends }: MessageBubbleProps) {
  const { user } = useUser();
  const [busy, setBusy] = useState(false);
  const friendStatus = friends.statusFor(message.clerkUserId);

  const handleSend = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await sendFriendRequest({
        fromUserId: user.id,
        fromDisplayName: user.fullName ?? user.username ?? 'A Born to Fire member',
        toUserId: message.clerkUserId,
        toDisplayName: message.displayName,
      });
      await friends.refresh();
    } catch {
      // Button just stays in its current state - not worth a dedicated error UI for a secondary action.
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async (requestId: number) => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await respondToFriendRequest(requestId, user.id, true);
      await friends.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          mine ? 'bg-orange-500 text-gray-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              mine ? 'text-gray-900/70' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {message.displayName}
            {showState && (
              <span className="inline-flex items-center gap-0.5 opacity-80">
                <MapPin className="h-2.5 w-2.5" /> {message.state}
              </span>
            )}
            <span className="opacity-70">&middot; {timeAgo(message.createdAt)}</span>
          </div>
          {!mine && canAddFriends && (
            <FriendActionButton friendStatus={friendStatus} onSend={handleSend} onAccept={handleAccept} busy={busy} />
          )}
        </div>
        <p className="mt-0.5 whitespace-pre-line">{message.message}</p>
      </div>
    </div>
  );
}

interface GroupChatProps {
  groupType: CommunityGroupType;
  groupKey: string;
  groupLabel: string;
  profile: CommunityProfile | null;
  friends: UseFriendsResult;
}

// Live message feed + composer for one group — generalized from the old
// CommunityBoard.tsx's second half (message list/composer) once Community
// grew past a two-scope (state/india) widget into a full directory of
// groups (see src/lib/communityGroups.ts). Anyone can read; posting needs a
// signed-in user with a saved community_profiles row (for a display name
// and home state to snapshot onto the message).
export function GroupChat({ groupType, groupKey, groupLabel, profile, friends }: GroupChatProps) {
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { messages, refresh } = useCommunityMessages(groupType, groupKey);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await postMessage({
        clerkUserId: user.id,
        displayName: profile.displayName,
        state: profile.state,
        groupType,
        groupKey,
        message: text,
      });
      setInput('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post, please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No messages yet in {groupLabel} - be the first to say hi.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            showState={groupType !== 'state'}
            mine={m.clerkUserId === user?.id}
            friends={friends}
            canAddFriends={!!isSignedIn && !!profile}
          />
        ))}
      </div>

      {error && <p className="px-4 pb-1 text-xs text-red-500">{error}</p>}

      {isSignedIn && profile ? (
        <form onSubmit={handlePost} className="flex gap-2 border-t border-gray-100 p-3 dark:border-gray-700">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${groupLabel}...`}
            maxLength={500}
            disabled={sending}
            className="flex-1 rounded-full border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-orange-500 disabled:opacity-60 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-all duration-300 hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <div className="border-t border-gray-100 p-3 dark:border-gray-700">
          <button onClick={() => openSignIn()} className="btn-primary w-full !py-2.5 text-sm">
            Sign in to join the conversation
          </button>
        </div>
      )}
    </div>
  );
}
