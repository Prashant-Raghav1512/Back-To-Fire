import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import type { CommunityGroupType, CommunityMessage, CommunityProfile } from '@/data/types';
import { apiFetch, authedFetch } from '@/lib/dataApi';

export async function getMyProfile(token: string | null): Promise<CommunityProfile | null> {
  return authedFetch<CommunityProfile | null>('/community/profile', token);
}

// Always writes every column — callers merge with the currently-loaded
// profile first (see useCommunityProfile below) rather than this function
// trying to support partial updates, which keeps the upsert itself simple.
async function saveMyProfile(fields: CommunityProfile, token: string | null): Promise<void> {
  await authedFetch('/community/profile', token, { method: 'POST', body: JSON.stringify(fields) });
}

export interface PostMessageParams {
  displayName: string;
  state: string;
  groupType: CommunityGroupType;
  groupKey: string;
  message: string;
  /** Base64 data URI from compressImageToDataUrl, or omitted for a text-only message. */
  imageDataUrl?: string | null;
}

export async function postMessage(params: PostMessageParams, token: string | null): Promise<void> {
  await authedFetch('/community/messages', token, { method: 'POST', body: JSON.stringify(params) });
}

export async function getMessages(groupType: CommunityGroupType, groupKey: string): Promise<CommunityMessage[]> {
  return apiFetch<CommunityMessage[]>(
    `/community/messages?groupType=${encodeURIComponent(groupType)}&groupKey=${encodeURIComponent(groupKey)}`
  );
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
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !user) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      setProfile(await getMyProfile(await getToken()));
    } catch (err) {
      console.error('Failed to load Community profile:', err);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user, getToken]);

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
      await saveMyProfile(fields, await getToken());
      setProfile(fields);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, getToken]
  );

  const saveDetails = useCallback(
    async (details: Pick<CommunityProfile, 'state' | 'age' | 'heightCm' | 'weightKg' | 'gender'>) => {
      if (!user) return;
      const fields: CommunityProfile = { displayName: displayName(), ...details };
      await saveMyProfile(fields, await getToken());
      setProfile(fields);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, getToken]
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
    } catch (err) {
      console.error('Failed to load Community messages:', err);
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
