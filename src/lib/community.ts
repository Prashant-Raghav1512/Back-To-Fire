import { useCallback, useEffect, useRef, useState } from 'react';
import { neon } from '@neondatabase/serverless';
import { useUser } from '@clerk/clerk-react';
import type { CommunityMessage, CommunityProfile, CommunityScope } from '@/data/types';

// SECURITY NOTE: reuses the same browser-exposed connection as the contact
// form and enrollments (src/lib/contact.ts, src/lib/enrollments.ts) rather
// than provisioning a separate role — same reasoning as enrollments.ts:
// every Neon role on this project is already neon_superuser, so a
// dedicated role would add rotation hygiene but no actual access
// restriction, and provisioning one requires the Neon dashboard/API this
// environment has no credentials for.
const connectionString = import.meta.env.VITE_NEON_CONTACT_URL;

// Best-effort only, not real moderation: this runs entirely in the visitor's
// own browser against a database every visitor can already write to
// directly (see the SECURITY NOTE above), so it stops nothing determined —
// it just keeps the common case of an accidental slip out of a public feed.
// Real moderation (reporting, blocking, deletion) would need a backend,
// which this project deliberately doesn't have.
const BLOCKED_WORDS = ['fuck', 'bitch', 'bastard', 'asshole', 'chutiya', 'madarchod', 'behenchod'];

function containsBlockedWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((w) => lower.includes(w));
}

interface ProfileRow {
  display_name: string;
  state: string;
}

interface MessageRow {
  id: number;
  clerk_user_id: string;
  display_name: string;
  state: string;
  message: string;
  created_at: string;
}

function client() {
  if (!connectionString) {
    throw new Error('Community is not configured (VITE_NEON_CONTACT_URL is unset).');
  }
  return neon(connectionString);
}

export async function getMyProfile(clerkUserId: string): Promise<CommunityProfile | null> {
  const sql = client();
  const rows = (await sql`
    SELECT display_name, state FROM community_profiles WHERE clerk_user_id = ${clerkUserId}
  `) as ProfileRow[];
  const row = rows[0];
  return row ? { displayName: row.display_name, state: row.state } : null;
}

export async function saveMyProfile(clerkUserId: string, displayName: string, state: string): Promise<void> {
  const sql = client();
  await sql`
    INSERT INTO community_profiles (clerk_user_id, display_name, state, updated_at)
    VALUES (${clerkUserId}, ${displayName}, ${state}, now())
    ON CONFLICT (clerk_user_id) DO UPDATE SET display_name = ${displayName}, state = ${state}, updated_at = now()
  `;
}

export interface PostMessageParams {
  clerkUserId: string;
  displayName: string;
  state: string;
  message: string;
}

export async function postMessage(params: PostMessageParams): Promise<void> {
  const trimmed = params.message.trim();
  if (!trimmed) throw new Error('Message cannot be empty.');
  if (trimmed.length > 500) throw new Error('Keep it under 500 characters.');
  if (containsBlockedWord(trimmed)) throw new Error('Please keep the community board respectful.');

  const sql = client();
  await sql`
    INSERT INTO community_messages (clerk_user_id, display_name, state, message)
    VALUES (${params.clerkUserId}, ${params.displayName}, ${params.state}, ${trimmed})
  `;
}

const MESSAGE_LIMIT = 50;

export async function getMessages(scope: CommunityScope, state: string): Promise<CommunityMessage[]> {
  const sql = client();
  const rows = (
    scope === 'state'
      ? await sql`
          SELECT id, clerk_user_id, display_name, state, message, created_at
          FROM community_messages
          WHERE state = ${state}
          ORDER BY created_at DESC
          LIMIT ${MESSAGE_LIMIT}
        `
      : await sql`
          SELECT id, clerk_user_id, display_name, state, message, created_at
          FROM community_messages
          ORDER BY created_at DESC
          LIMIT ${MESSAGE_LIMIT}
        `
  ) as MessageRow[];

  return rows
    .map((row) => ({
      id: row.id,
      clerkUserId: row.clerk_user_id,
      displayName: row.display_name,
      state: row.state,
      message: row.message,
      createdAt: row.created_at,
    }))
    .reverse(); // oldest first, so the feed reads top-to-bottom like a chat
}

// Fetches the signed-in user's saved state/display name once, and exposes
// `saveState` to set it (first-time picker) — mirrors useMyEnrollments's
// "fetch on mount, expose a setter" shape.
export function useCommunityProfile() {
  const { user, isSignedIn } = useUser();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !user) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      setProfile(await getMyProfile(user.id));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveState = useCallback(
    async (state: string) => {
      if (!user) return;
      const displayName = user.fullName ?? user.username ?? 'A Born to Fire member';
      await saveMyProfile(user.id, displayName, state);
      setProfile({ displayName, state });
    },
    [user]
  );

  return { profile, loading, saveState, refresh };
}

// Polls for new messages every 7s while mounted (only while the Community
// panel is actually open — the caller controls that by mounting/unmounting
// this) — there's no backend to push updates from, so a short poll is the
// closest this can get to "near real-time" without one.
const POLL_INTERVAL_MS = 7000;

export function useCommunityMessages(scope: CommunityScope, state: string | null) {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const refresh = useCallback(async () => {
    const currentState = stateRef.current;
    if (scope === 'state' && !currentState) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      setMessages(await getMessages(scope, currentState ?? ''));
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { messages, loading, refresh };
}
