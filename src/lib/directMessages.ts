import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { authedFetch } from '@/lib/dataApi';

export interface DirectMessage {
  id: number;
  senderClerkUserId: string;
  senderDisplayName: string;
  recipientClerkUserId: string;
  message: string;
  createdAt: string;
}

const MESSAGE_LIMIT = 1000;

export async function getConversation(otherUserId: string, token: string | null): Promise<DirectMessage[]> {
  return authedFetch<DirectMessage[]>(`/dm?with=${encodeURIComponent(otherUserId)}`, token);
}

export interface SendDirectMessageParams {
  senderDisplayName: string;
  recipientClerkUserId: string;
  message: string;
}

export async function sendDirectMessage(params: SendDirectMessageParams, token: string | null): Promise<void> {
  const trimmed = params.message.trim();
  if (!trimmed) throw new Error('Message cannot be empty.');
  if (trimmed.length > MESSAGE_LIMIT) throw new Error(`Keep it under ${MESSAGE_LIMIT} characters.`);
  await authedFetch('/dm', token, { method: 'POST', body: JSON.stringify({ ...params, message: trimmed }) });
}

// Polls faster than group chat (community.ts's 7s) — a 1:1 DM reads more
// like an active conversation than a room you're passively sitting in.
const POLL_INTERVAL_MS = 5000;

export function useDirectMessages(me: string | undefined, otherUserId: string | undefined) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const pairRef = useRef({ me, otherUserId });
  pairRef.current = { me, otherUserId };

  const refresh = useCallback(async () => {
    const { me, otherUserId } = pairRef.current;
    if (!me || !otherUserId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      setMessages(await getConversation(otherUserId, await getToken()));
    } catch (err) {
      console.error('Failed to load direct messages:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh, me, otherUserId]);

  return { messages, loading, refresh };
}
