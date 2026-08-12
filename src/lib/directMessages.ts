import { useCallback, useEffect, useRef, useState } from 'react';
import { neon } from '@neondatabase/serverless';

// SECURITY NOTE: same browser-exposed connection as the rest of the
// Community feature — see src/lib/friends.ts's SECURITY NOTE for why a
// separate role wouldn't add real access restriction on this project.
const connectionString = import.meta.env.VITE_NEON_CONTACT_URL;

function client() {
  if (!connectionString) {
    throw new Error('Direct messages are not configured (VITE_NEON_CONTACT_URL is unset).');
  }
  return neon(connectionString);
}

export interface DirectMessage {
  id: number;
  senderClerkUserId: string;
  senderDisplayName: string;
  recipientClerkUserId: string;
  message: string;
  createdAt: string;
}

interface DmRow {
  id: number;
  sender_clerk_user_id: string;
  sender_display_name: string;
  recipient_clerk_user_id: string;
  message: string;
  created_at: string;
}

function rowToMessage(row: DmRow): DirectMessage {
  return {
    id: row.id,
    senderClerkUserId: row.sender_clerk_user_id,
    senderDisplayName: row.sender_display_name,
    recipientClerkUserId: row.recipient_clerk_user_id,
    message: row.message,
    createdAt: row.created_at,
  };
}

const DM_LIMIT = 100;

export async function getConversation(userA: string, userB: string): Promise<DirectMessage[]> {
  const sql = client();
  const rows = (await sql`
    SELECT id, sender_clerk_user_id, sender_display_name, recipient_clerk_user_id, message, created_at
    FROM direct_messages
    WHERE (sender_clerk_user_id = ${userA} AND recipient_clerk_user_id = ${userB})
       OR (sender_clerk_user_id = ${userB} AND recipient_clerk_user_id = ${userA})
    ORDER BY created_at DESC
    LIMIT ${DM_LIMIT}
  `) as DmRow[];
  return rows.map(rowToMessage).reverse(); // oldest first, same as community chat
}

export interface SendDirectMessageParams {
  senderClerkUserId: string;
  senderDisplayName: string;
  recipientClerkUserId: string;
  message: string;
}

export async function sendDirectMessage(params: SendDirectMessageParams): Promise<void> {
  const trimmed = params.message.trim();
  if (!trimmed) throw new Error('Message cannot be empty.');
  if (trimmed.length > 1000) throw new Error('Keep it under 1000 characters.');

  const sql = client();
  await sql`
    INSERT INTO direct_messages (sender_clerk_user_id, sender_display_name, recipient_clerk_user_id, message)
    VALUES (${params.senderClerkUserId}, ${params.senderDisplayName}, ${params.recipientClerkUserId}, ${trimmed})
  `;
}

// Polls faster than group chat (community.ts's 7s) — a 1:1 DM reads more
// like an active conversation than a room you're passively sitting in.
const POLL_INTERVAL_MS = 5000;

export function useDirectMessages(me: string | undefined, otherUserId: string | undefined) {
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
      setMessages(await getConversation(me, otherUserId));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh, me, otherUserId]);

  return { messages, loading, refresh };
}
