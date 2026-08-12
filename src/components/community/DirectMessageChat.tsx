import { useState } from 'react';
import { Send } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { sendDirectMessage, useDirectMessages } from '@/lib/directMessages';
import { timeAgo } from '@/lib/timeAgo';
import type { FriendView } from '@/lib/friends';
import type { CommunityProfile } from '@/data/types';

interface DirectMessageChatProps {
  friend: FriendView;
  profile: CommunityProfile | null;
}

// A private 1:1 thread with one accepted friend — visually mirrors
// GroupChat's message bubbles, but scoped to exactly two people via
// useDirectMessages rather than a group_type/group_key room. Only reachable
// once a friend_requests row exists with status 'accepted' (see
// CommunityPage.tsx's sidebar), so there's no separate "are we friends"
// check needed here.
export function DirectMessageChat({ friend, profile }: DirectMessageChatProps) {
  const { user } = useUser();
  const { messages, refresh } = useDirectMessages(user?.id, friend.clerkUserId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendDirectMessage({
        senderClerkUserId: user.id,
        senderDisplayName: profile.displayName,
        recipientClerkUserId: friend.clerkUserId,
        message: text,
      });
      setInput('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send, please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-4 text-center text-sm text-gray-400 dark:text-gray-500">
            No messages yet with {friend.displayName} - say hi!
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderClerkUserId === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  mine ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300'
                }`}
              >
                <p className={`text-xs font-semibold ${mine ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                  {m.senderDisplayName} <span className="font-normal opacity-70">&middot; {timeAgo(m.createdAt)}</span>
                </p>
                <p className="mt-0.5 whitespace-pre-line">{m.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="px-4 pb-1 text-xs text-red-500">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 p-3 dark:border-gray-700">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${friend.displayName}...`}
          maxLength={1000}
          disabled={sending || !profile}
          className="flex-1 rounded-full border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-orange-500 disabled:opacity-60 dark:bg-gray-700 dark:text-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending || !profile}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-all duration-300 hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
