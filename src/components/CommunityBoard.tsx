import { useState } from 'react';
import { Send, Search, MapPin, Pencil } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useCommunityProfile, useCommunityMessages, postMessage } from '@/lib/community';
import { indianStates } from '@/data/indianStates';
import type { CommunityMessage, CommunityScope } from '@/data/types';

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function pillClass(active: boolean) {
  return `rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 ${
    active
      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
  }`;
}

function MessageBubble({ message, showState, mine }: { message: CommunityMessage; showState: boolean; mine: boolean }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          mine ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300'
        }`}
      >
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            mine ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
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
        <p className="mt-0.5 whitespace-pre-line">{message.message}</p>
      </div>
    </div>
  );
}

// Body only — no card chrome or header of its own, same split as
// ChatBot.tsx/ChatWidget.tsx. Three states depending on auth/profile:
// signed out (read-only nationwide feed + sign-in prompt), signed in with
// no state picked yet (the state picker), and signed in with a state (the
// real board — a My State / All India tab switcher over a polling message
// feed).
export function CommunityBoard() {
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { profile, saveState } = useCommunityProfile();
  const [scope, setScope] = useState<CommunityScope>('state');
  const [pickingState, setPickingState] = useState(false);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveScope: CommunityScope = profile && !pickingState ? scope : 'india';
  const { messages, refresh } = useCommunityMessages(effectiveScope, profile?.state ?? null);

  const showPicker = isSignedIn && (!profile || pickingState);
  const filteredStates = indianStates.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user || !profile) return;
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await postMessage({
        clerkUserId: user.id,
        displayName: profile.displayName,
        state: profile.state,
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

  if (showPicker) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-100 p-4 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Which state are you training from?</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This sets your "My State" feed - you can change it any time.
          </p>
          <div className="relative mt-3">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search states..."
              autoFocus
              className="w-full rounded-full border-0 bg-gray-100 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-wrap gap-2">
            {filteredStates.map((s) => (
              <button
                key={s.id}
                onClick={async () => {
                  await saveState(s.name);
                  setPickingState(false);
                  setSearch('');
                }}
                className="rounded-full bg-gray-100 px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-orange-500 hover:text-white dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-orange-500"
              >
                {s.name}
              </button>
            ))}
            {filteredStates.length === 0 && (
              <p className="w-full py-4 text-center text-sm text-gray-400">No states match "{search}".</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 p-3 dark:border-gray-700">
        <div className="flex gap-2">
          <button onClick={() => setScope('state')} className={pillClass(!!profile && scope === 'state')} disabled={!profile}>
            {profile ? profile.state : 'My State'}
          </button>
          <button onClick={() => setScope('india')} className={pillClass(scope === 'india' || !profile)}>
            All India
          </button>
        </div>
        {isSignedIn && profile && (
          <button
            onClick={() => setPickingState(true)}
            aria-label="Change state"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-4 text-center text-sm text-gray-400 dark:text-gray-500">
            No messages yet {effectiveScope === 'state' && profile ? `in ${profile.state}` : 'across India'} - be the
            first to say hi.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            showState={effectiveScope === 'india'}
            mine={m.clerkUserId === user?.id}
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
            placeholder={`Message ${scope === 'state' ? profile.state : 'all of India'}...`}
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
