import { useCallback, useEffect, useRef, useState } from 'react';
import { neon } from '@neondatabase/serverless';
import { useUser } from '@clerk/clerk-react';
import type { CommunityGroupType, CommunityMessage, CommunityProfile, Gender } from '@/data/types';

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
  age: number | null;
  height_cm: number | null;
  weight_kg: string | null; // numeric columns come back as strings from the driver
  gender: Gender | null;
}

interface MessageRow {
  id: number;
  clerk_user_id: string;
  display_name: string;
  state: string;
  group_type: CommunityGroupType;
  group_key: string;
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
    SELECT display_name, state, age, height_cm, weight_kg, gender
    FROM community_profiles WHERE clerk_user_id = ${clerkUserId}
  `) as ProfileRow[];
  const row = rows[0];
  if (!row) return null;
  return {
    displayName: row.display_name,
    state: row.state,
    age: row.age,
    heightCm: row.height_cm,
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    gender: row.gender,
  };
}

// Always writes every column — callers merge with the currently-loaded
// profile first (see useCommunityProfile below) rather than this function
// trying to support partial updates, which keeps the upsert itself simple.
async function saveMyProfile(clerkUserId: string, fields: CommunityProfile): Promise<void> {
  const sql = client();
  await sql`
    INSERT INTO community_profiles (clerk_user_id, display_name, state, age, height_cm, weight_kg, gender, updated_at)
    VALUES (${clerkUserId}, ${fields.displayName}, ${fields.state}, ${fields.age}, ${fields.heightCm}, ${fields.weightKg}, ${fields.gender}, now())
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      display_name = ${fields.displayName},
      state = ${fields.state},
      age = ${fields.age},
      height_cm = ${fields.heightCm},
      weight_kg = ${fields.weightKg},
      gender = ${fields.gender},
      updated_at = now()
  `;
}

export interface PostMessageParams {
  clerkUserId: string;
  displayName: string;
  state: string;
  groupType: CommunityGroupType;
  groupKey: string;
  message: string;
}

export async function postMessage(params: PostMessageParams): Promise<void> {
  const trimmed = params.message.trim();
  if (!trimmed) throw new Error('Message cannot be empty.');
  if (trimmed.length > 500) throw new Error('Keep it under 500 characters.');
  if (containsBlockedWord(trimmed)) throw new Error('Please keep the community board respectful.');

  const sql = client();
  await sql`
    INSERT INTO community_messages (clerk_user_id, display_name, state, group_type, group_key, message)
    VALUES (${params.clerkUserId}, ${params.displayName}, ${params.state}, ${params.groupType}, ${params.groupKey}, ${trimmed})
  `;
}

const MESSAGE_LIMIT = 50;

export async function getMessages(groupType: CommunityGroupType, groupKey: string): Promise<CommunityMessage[]> {
  const sql = client();
  const rows = (await sql`
    SELECT id, clerk_user_id, display_name, state, group_type, group_key, message, created_at
    FROM community_messages
    WHERE group_type = ${groupType} AND group_key = ${groupKey}
    ORDER BY created_at DESC
    LIMIT ${MESSAGE_LIMIT}
  `) as MessageRow[];

  return rows
    .map((row) => ({
      id: row.id,
      clerkUserId: row.clerk_user_id,
      displayName: row.display_name,
      state: row.state,
      groupType: row.group_type,
      groupKey: row.group_key,
      message: row.message,
      createdAt: row.created_at,
    }))
    .reverse(); // oldest first, so the feed reads top-to-bottom like a chat
}

const EMPTY_DETAILS = { age: null, heightCm: null, weightKg: null, gender: null } as const;

// Fetches the signed-in user's saved profile once, and exposes two setters
// over the same underlying row: `saveState` (used by the Community tab's
// first-time state picker — only changes state, preserving whatever
// personal details are already saved) and `saveDetails` (used by the
// Profile page's "Personal Details" form — saves everything at once, since
// that form is pre-filled from `profile` so unedited fields just
// round-trip their current value). Mirrors useMyEnrollments's "fetch on
// mount, expose setters" shape.
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

  const displayName = () => user?.fullName ?? user?.username ?? 'A Born to Fire member';

  const saveState = useCallback(
    async (state: string) => {
      if (!user) return;
      const fields: CommunityProfile = {
        displayName: displayName(),
        state,
        ...(profile ?? EMPTY_DETAILS),
      };
      await saveMyProfile(user.id, fields);
      setProfile(fields);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile]
  );

  const saveDetails = useCallback(
    async (details: Pick<CommunityProfile, 'state' | 'age' | 'heightCm' | 'weightKg' | 'gender'>) => {
      if (!user) return;
      const fields: CommunityProfile = { displayName: displayName(), ...details };
      await saveMyProfile(user.id, fields);
      setProfile(fields);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user]
  );

  return { profile, loading, saveState, saveDetails, refresh };
}

// Polls for new messages every 7s while mounted (only while a group's chat
// is actually open — the caller controls that by mounting/unmounting this)
// — there's no backend to push updates from, so a short poll is the
// closest this can get to "near real-time" without one.
const POLL_INTERVAL_MS = 7000;

export function useCommunityMessages(groupType: CommunityGroupType, groupKey: string) {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const keyRef = useRef(groupKey);
  keyRef.current = groupKey;

  const refresh = useCallback(async () => {
    if (!keyRef.current) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      setMessages(await getMessages(groupType, keyRef.current));
    } finally {
      setLoading(false);
    }
  }, [groupType]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh, groupKey]);

  return { messages, loading, refresh };
}
