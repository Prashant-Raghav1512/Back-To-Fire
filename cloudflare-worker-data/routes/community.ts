import type { Env } from '../env';
import { db } from '../db';
import { errorResponse, json, readJsonBody } from '../http';
import { containsBlockedWord, isInt, isNonEmptyString, isOneOf, MAX_IMAGE_DATA_URL_CHARS } from '../validate';

const GROUP_TYPES = ['india', 'state', 'age', 'interest', 'event', 'members'] as const;
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;
const MESSAGE_LIMIT = 500;
const FETCH_LIMIT = 50;

interface ProfileRow {
  display_name: string;
  state: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: string | null;
  gender: string | null;
}

export async function getMyProfile(env: Env, userId: string, headers: HeadersInit): Promise<Response> {
  const sql = db(env);
  const rows = (await sql`
    SELECT display_name, state, age, height_cm, weight_kg, gender
    FROM community_profiles WHERE clerk_user_id = ${userId}
  `) as ProfileRow[];
  const row = rows[0];
  if (!row) return json(null, headers);
  return json(
    {
      displayName: row.display_name,
      state: row.state,
      age: row.age,
      heightCm: row.height_cm,
      weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
      gender: row.gender,
    },
    headers
  );
}

interface SaveProfileBody {
  displayName: string;
  state: string;
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  gender?: (typeof GENDERS)[number] | null;
}

function isSaveProfileBody(body: unknown): body is SaveProfileBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  if (!isNonEmptyString(b.displayName, 200) || !isNonEmptyString(b.state, 100)) return false;
  if (b.age !== undefined && b.age !== null && !isInt(b.age)) return false;
  if (b.heightCm !== undefined && b.heightCm !== null && !isInt(b.heightCm)) return false;
  if (b.weightKg !== undefined && b.weightKg !== null && typeof b.weightKg !== 'number') return false;
  if (b.gender !== undefined && b.gender !== null && !isOneOf(b.gender, GENDERS)) return false;
  return true;
}

export async function saveMyProfile(request: Request, env: Env, userId: string, headers: HeadersInit): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isSaveProfileBody(body)) return errorResponse('Invalid request shape.', headers);

  const sql = db(env);
  await sql`
    INSERT INTO community_profiles (clerk_user_id, display_name, state, age, height_cm, weight_kg, gender, updated_at)
    VALUES (${userId}, ${body.displayName}, ${body.state}, ${body.age ?? null}, ${body.heightCm ?? null}, ${body.weightKg ?? null}, ${body.gender ?? null}, now())
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      display_name = ${body.displayName}, state = ${body.state}, age = ${body.age ?? null},
      height_cm = ${body.heightCm ?? null}, weight_kg = ${body.weightKg ?? null}, gender = ${body.gender ?? null}, updated_at = now()
  `;
  return json({ ok: true }, headers);
}

interface MessageRow {
  id: number;
  clerk_user_id: string;
  display_name: string;
  state: string;
  group_type: string;
  group_key: string;
  message: string;
  image_url: string | null;
  created_at: string;
}

function toMessage(row: MessageRow) {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    state: row.state,
    groupType: row.group_type,
    groupKey: row.group_key,
    message: row.message,
    imageUrl: row.image_url,
    createdAt: row.created_at,
  };
}

export async function getMessages(env: Env, groupType: string, groupKey: string, headers: HeadersInit): Promise<Response> {
  if (!isOneOf(groupType, GROUP_TYPES) || !groupKey) return errorResponse('Invalid group.', headers);

  const sql = db(env);
  const rows = (await sql`
    SELECT id, clerk_user_id, display_name, state, group_type, group_key, message, image_url, created_at
    FROM community_messages WHERE group_type = ${groupType} AND group_key = ${groupKey}
    ORDER BY created_at DESC LIMIT ${FETCH_LIMIT}
  `) as MessageRow[];
  return json(rows.map(toMessage).reverse(), headers);
}

interface PostMessageBody {
  displayName: string;
  state: string;
  groupType: (typeof GROUP_TYPES)[number];
  groupKey: string;
  message: string;
  imageDataUrl?: string | null;
}

function isPostMessageBody(body: unknown): body is PostMessageBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    isNonEmptyString(b.displayName, 200) &&
    isNonEmptyString(b.state, 100) &&
    isOneOf(b.groupType, GROUP_TYPES) &&
    isNonEmptyString(b.groupKey, 100) &&
    typeof b.message === 'string' &&
    b.message.length <= MESSAGE_LIMIT &&
    (b.imageDataUrl === undefined || b.imageDataUrl === null || (typeof b.imageDataUrl === 'string' && b.imageDataUrl.length <= MAX_IMAGE_DATA_URL_CHARS))
  );
}

export async function postMessage(request: Request, env: Env, userId: string, headers: HeadersInit): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isPostMessageBody(body)) return errorResponse('Invalid request shape.', headers);

  const trimmed = body.message.trim();
  if (!trimmed && !body.imageDataUrl) return errorResponse('Write something or attach a photo before sending.', headers);
  if (containsBlockedWord(trimmed)) return errorResponse('Please keep the community board respectful.', headers);

  const sql = db(env);
  await sql`
    INSERT INTO community_messages (clerk_user_id, display_name, state, group_type, group_key, message, image_url)
    VALUES (${userId}, ${body.displayName}, ${body.state}, ${body.groupType}, ${body.groupKey}, ${trimmed}, ${body.imageDataUrl ?? null})
  `;
  return json({ ok: true }, headers, 201);
}
