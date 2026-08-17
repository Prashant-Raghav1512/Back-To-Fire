import type { Env } from '../env';
import { db } from '../db';
import { errorResponse, json, readJsonBody } from '../http';
import { isNonEmptyString } from '../validate';

const DM_LIMIT = 100;
const MESSAGE_LIMIT = 1000;

interface DmRow {
  id: number;
  sender_clerk_user_id: string;
  sender_display_name: string;
  recipient_clerk_user_id: string;
  message: string;
  created_at: string;
}

function toMessage(row: DmRow) {
  return {
    id: row.id,
    senderClerkUserId: row.sender_clerk_user_id,
    senderDisplayName: row.sender_display_name,
    recipientClerkUserId: row.recipient_clerk_user_id,
    message: row.message,
    createdAt: row.created_at,
  };
}

// The caller's own verified id is always one side of the pair — a request
// can't be pointed at two other people's conversation just by supplying
// both ids in the query string.
export async function getConversation(env: Env, userId: string, otherUserId: string, headers: HeadersInit): Promise<Response> {
  if (!otherUserId) return errorResponse('Missing "with" parameter.', headers);
  const sql = db(env);
  const rows = (await sql`
    SELECT id, sender_clerk_user_id, sender_display_name, recipient_clerk_user_id, message, created_at
    FROM direct_messages
    WHERE (sender_clerk_user_id = ${userId} AND recipient_clerk_user_id = ${otherUserId})
       OR (sender_clerk_user_id = ${otherUserId} AND recipient_clerk_user_id = ${userId})
    ORDER BY created_at DESC LIMIT ${DM_LIMIT}
  `) as DmRow[];
  return json(rows.map(toMessage).reverse(), headers);
}

interface SendDmBody {
  senderDisplayName: string;
  recipientClerkUserId: string;
  message: string;
}

function isSendDmBody(body: unknown): body is SendDmBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    isNonEmptyString(b.senderDisplayName, 200) &&
    isNonEmptyString(b.recipientClerkUserId, 200) &&
    typeof b.message === 'string' &&
    b.message.trim().length > 0 &&
    b.message.length <= MESSAGE_LIMIT
  );
}

export async function sendDirectMessage(request: Request, env: Env, userId: string, headers: HeadersInit): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isSendDmBody(body)) return errorResponse('Invalid request shape.', headers);

  const sql = db(env);
  await sql`
    INSERT INTO direct_messages (sender_clerk_user_id, sender_display_name, recipient_clerk_user_id, message)
    VALUES (${userId}, ${body.senderDisplayName}, ${body.recipientClerkUserId}, ${body.message.trim()})
  `;
  return json({ ok: true }, headers, 201);
}
