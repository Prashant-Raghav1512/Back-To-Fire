import { useRef, useState } from 'react';
import { Send, MapPin, MessageSquare, ImagePlus, X } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { postMessage, useCommunityMessages } from '@/lib/community';
import { compressImageToDataUrl } from '@/lib/imageUpload';
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
        {message.message && <p className="mt-0.5 whitespace-pre-line">{message.message}</p>}
        {message.imageUrl && (
          <img src={message.imageUrl} alt="" className="mt-1.5 max-h-52 w-full rounded-xl object-cover" />
        )}
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
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setCompressing(true);
    try {
      setImageDataUrl(await compressImageToDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process that image.');
    } finally {
      setCompressing(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    const text = input.trim();
    if ((!text && !imageDataUrl) || sending) return;
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
        imageDataUrl,
      });
      setInput('');
      setImageDataUrl(null);
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
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400">
              <MessageSquare className="h-7 w-7" />
            </span>
            <div>
              <p className="font-display text-base font-bold text-gray-900 dark:text-white">
                {groupLabel} is quiet for now
              </p>
              <p className="mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">
                Every conversation starts somewhere — be the first to say hi.
              </p>
            </div>
          </div>
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
        <form onSubmit={handlePost} className="border-t border-gray-100 p-3 dark:border-gray-700">
          {imageDataUrl && (
            <div className="relative mb-2 inline-block">
              <img src={imageDataUrl} alt="" className="h-20 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setImageDataUrl(null)}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={compressing}
              aria-label="Attach photo"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={compressing ? 'Processing photo...' : `Message ${groupLabel}...`}
              maxLength={500}
              disabled={sending}
              className="flex-1 rounded-full border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-orange-500 disabled:opacity-60 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={(!input.trim() && !imageDataUrl) || sending || compressing}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-all duration-300 hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
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
