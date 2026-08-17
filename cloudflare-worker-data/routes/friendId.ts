import type { Env } from '../env';
import { db } from '../db';
import { errorResponse, json } from '../http';

export async function getOrCreateFriendId(
  env: Env,
  userId: string,
  displayName: string,
  headers: HeadersInit
): Promise<Response> {
  if (!displayName) return errorResponse('Missing displayName.', headers);
  const sql = db(env);
  const rows = (await sql`
    INSERT INTO user_ids (clerk_user_id, display_name)
    VALUES (${userId}, ${displayName})
    ON CONFLICT (clerk_user_id) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING friend_id
  `) as { friend_id: string }[];
  return json({ friendId: rows[0].friend_id }, headers);
}

export async function searchByFriendId(env: Env, friendId: string, headers: HeadersInit): Promise<Response> {
  const normalized = friendId.trim().toUpperCase();
  if (!normalized) return json(null, headers);

  const sql = db(env);
  const rows = (await sql`
    SELECT clerk_user_id, display_name, friend_id FROM user_ids WHERE friend_id = ${normalized}
  `) as { clerk_user_id: string; display_name: string; friend_id: string }[];
  const row = rows[0];
  if (!row) return json(null, headers);
  return json({ clerkUserId: row.clerk_user_id, displayName: row.display_name, friendId: row.friend_id }, headers);
}

export async function getTotalMemberCount(env: Env, headers: HeadersInit): Promise<Response> {
  const sql = db(env);
  const rows = (await sql`SELECT count(*)::int AS count FROM user_ids`) as { count: number }[];
  return json({ count: rows[0]?.count ?? 0 }, headers);
}
