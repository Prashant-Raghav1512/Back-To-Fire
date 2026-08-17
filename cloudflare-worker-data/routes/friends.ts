import type { Env } from '../env';
import { db } from '../db';
import { errorResponse, json, readJsonBody } from '../http';
import { isNonEmptyString } from '../validate';

type RequestStatus = 'pending' | 'accepted' | 'declined';

interface FriendRequestRow {
  id: number;
  requester_clerk_user_id: string;
  requester_display_name: string;
  recipient_clerk_user_id: string;
  recipient_display_name: string;
  status: RequestStatus;
  created_at: string;
}

function toRow(row: FriendRequestRow) {
  return {
    id: row.id,
    requesterClerkUserId: row.requester_clerk_user_id,
    requesterDisplayName: row.requester_display_name,
    recipientClerkUserId: row.recipient_clerk_user_id,
    recipientDisplayName: row.recipient_display_name,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listMyFriendRows(env: Env, userId: string, headers: HeadersInit): Promise<Response> {
  const sql = db(env);
  const rows = (await sql`
    SELECT id, requester_clerk_user_id, requester_display_name, recipient_clerk_user_id, recipient_display_name, status, created_at
    FROM friend_requests WHERE requester_clerk_user_id = ${userId} OR recipient_clerk_user_id = ${userId}
    ORDER BY created_at DESC
  `) as FriendRequestRow[];
  return json(rows.map(toRow), headers);
}

interface SendRequestBody {
  fromDisplayName: string;
  toUserId: string;
  toDisplayName: string;
}

function isSendRequestBody(body: unknown): body is SendRequestBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return isNonEmptyString(b.fromDisplayName, 200) && isNonEmptyString(b.toUserId, 200) && isNonEmptyString(b.toDisplayName, 200);
}

export async function sendFriendRequest(request: Request, env: Env, userId: string, headers: HeadersInit): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isSendRequestBody(body)) return errorResponse('Invalid request shape.', headers);
  if (userId === body.toUserId) return errorResponse("You can't add yourself as a friend.", headers);

  const sql = db(env);
  const existing = (await sql`
    SELECT id, requester_clerk_user_id, status FROM friend_requests
    WHERE (requester_clerk_user_id = ${userId} AND recipient_clerk_user_id = ${body.toUserId})
       OR (requester_clerk_user_id = ${body.toUserId} AND recipient_clerk_user_id = ${userId})
    LIMIT 1
  `) as { id: number; requester_clerk_user_id: string; status: RequestStatus }[];

  const row = existing[0];
  if (!row) {
    await sql`
      INSERT INTO friend_requests (requester_clerk_user_id, requester_display_name, recipient_clerk_user_id, recipient_display_name)
      VALUES (${userId}, ${body.fromDisplayName}, ${body.toUserId}, ${body.toDisplayName})
    `;
    return json({ ok: true }, headers, 201);
  }
  if (row.status === 'accepted') return errorResponse("You're already friends.", headers);
  if (row.status === 'pending') {
    if (row.requester_clerk_user_id === body.toUserId) {
      await sql`UPDATE friend_requests SET status = 'accepted', responded_at = now() WHERE id = ${row.id}`;
      return json({ ok: true }, headers);
    }
    return errorResponse('Request already sent.', headers);
  }
  await sql`
    UPDATE friend_requests
    SET requester_clerk_user_id = ${userId}, requester_display_name = ${body.fromDisplayName},
        recipient_clerk_user_id = ${body.toUserId}, recipient_display_name = ${body.toDisplayName},
        status = 'pending', created_at = now(), responded_at = null
    WHERE id = ${row.id}
  `;
  return json({ ok: true }, headers);
}

interface RespondBody {
  requestId: number;
  accept: boolean;
}

function isRespondBody(body: unknown): body is RespondBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return typeof b.requestId === 'number' && typeof b.accept === 'boolean';
}

export async function respondToFriendRequest(request: Request, env: Env, userId: string, headers: HeadersInit): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isRespondBody(body)) return errorResponse('Invalid request shape.', headers);

  const sql = db(env);
  await sql`
    UPDATE friend_requests SET status = ${body.accept ? 'accepted' : 'declined'}, responded_at = now()
    WHERE id = ${body.requestId} AND recipient_clerk_user_id = ${userId} AND status = 'pending'
  `;
  return json({ ok: true }, headers);
}

export async function cancelFriendRequest(env: Env, userId: string, requestId: number, headers: HeadersInit): Promise<Response> {
  const sql = db(env);
  await sql`DELETE FROM friend_requests WHERE id = ${requestId} AND requester_clerk_user_id = ${userId} AND status = 'pending'`;
  return json({ ok: true }, headers);
}

export async function removeFriend(env: Env, userId: string, requestId: number, headers: HeadersInit): Promise<Response> {
  const sql = db(env);
  await sql`
    DELETE FROM friend_requests
    WHERE id = ${requestId} AND status = 'accepted' AND (requester_clerk_user_id = ${userId} OR recipient_clerk_user_id = ${userId})
  `;
  return json({ ok: true }, headers);
}
