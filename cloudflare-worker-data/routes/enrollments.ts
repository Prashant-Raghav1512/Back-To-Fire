import type { Env } from '../env';
import { db } from '../db';
import { errorResponse, json, readJsonBody } from '../http';
import { isNonEmptyString, isOneOf, isOptionalString } from '../validate';

const ITEM_TYPES = ['program', 'event'] as const;

interface EnrollBody {
  userEmail: string;
  itemType: (typeof ITEM_TYPES)[number];
  itemId: string;
  itemTitle: string;
  itemDetail?: string;
}

function isEnrollBody(body: unknown): body is EnrollBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    isNonEmptyString(b.userEmail, 200) &&
    isOneOf(b.itemType, ITEM_TYPES) &&
    isNonEmptyString(b.itemId, 200) &&
    isNonEmptyString(b.itemTitle, 300) &&
    isOptionalString(b.itemDetail, 500)
  );
}

interface EnrollmentRow {
  id: number;
  item_type: string;
  item_id: string;
  item_title: string;
  item_detail: string | null;
  created_at: string;
}

function toEnrollment(row: EnrollmentRow) {
  return {
    id: row.id,
    itemType: row.item_type,
    itemId: row.item_id,
    itemTitle: row.item_title,
    itemDetail: row.item_detail,
    createdAt: row.created_at,
  };
}

export async function createEnrollment(
  request: Request,
  env: Env,
  userId: string,
  headers: HeadersInit
): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isEnrollBody(body)) return errorResponse('Invalid request shape.', headers);

  const sql = db(env);
  await sql`
    INSERT INTO enrollments (clerk_user_id, user_email, item_type, item_id, item_title, item_detail)
    VALUES (${userId}, ${body.userEmail}, ${body.itemType}, ${body.itemId}, ${body.itemTitle}, ${body.itemDetail ?? null})
    ON CONFLICT (clerk_user_id, item_type, item_id) DO NOTHING
  `;
  return json({ ok: true }, headers);
}

export async function listMyEnrollments(env: Env, userId: string, headers: HeadersInit): Promise<Response> {
  const sql = db(env);
  const rows = (await sql`
    SELECT id, item_type, item_id, item_title, item_detail, created_at
    FROM enrollments WHERE clerk_user_id = ${userId} ORDER BY created_at DESC
  `) as EnrollmentRow[];
  return json(rows.map(toEnrollment), headers);
}
