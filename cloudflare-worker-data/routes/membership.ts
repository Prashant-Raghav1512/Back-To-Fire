import type { Env } from '../env';
import { db } from '../db';
import { errorResponse, json, readJsonBody } from '../http';
import { isInt, isNonEmptyString, isOneOf, isOptionalString } from '../validate';

const MEMBERSHIP_TYPES = ['normal', 'corporate', 'family'] as const;
const BILLING_CYCLES = ['monthly', 'yearly'] as const;
const MAX_FAMILY_MEMBERS = 4;

interface MembershipRow {
  id: number;
  member_id: string;
  clerk_user_id: string;
  membership_type: string;
  display_name: string;
  company_name: string | null;
  monthly_price: number | null;
  billing_cycle: string | null;
  payment_method: string | null;
  created_at: string;
}

interface FamilyMemberRow {
  id: number;
  membership_id: number;
  name: string;
  relation: string | null;
  age: number | null;
}

function toFamilyMember(row: FamilyMemberRow) {
  return { id: row.id, membershipId: row.membership_id, name: row.name, relation: row.relation, age: row.age };
}

async function getFamilyMembers(env: Env, membershipId: number) {
  const sql = db(env);
  const rows = (await sql`
    SELECT id, membership_id, name, relation, age FROM family_members
    WHERE membership_id = ${membershipId} ORDER BY created_at ASC
  `) as FamilyMemberRow[];
  return rows.map(toFamilyMember);
}

async function toMembership(env: Env, row: MembershipRow) {
  const familyMembers = row.membership_type === 'family' ? await getFamilyMembers(env, row.id) : [];
  return {
    id: row.id,
    memberId: row.member_id,
    clerkUserId: row.clerk_user_id,
    membershipType: row.membership_type,
    displayName: row.display_name,
    companyName: row.company_name,
    price: row.monthly_price,
    billingCycle: row.billing_cycle,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    familyMembers,
  };
}

export async function getMyMembership(env: Env, userId: string, headers: HeadersInit): Promise<Response> {
  const sql = db(env);
  const rows = (await sql`
    SELECT id, member_id, clerk_user_id, membership_type, display_name, company_name, monthly_price, billing_cycle, payment_method, created_at
    FROM memberships WHERE clerk_user_id = ${userId}
  `) as MembershipRow[];
  const row = rows[0];
  return json(row ? await toMembership(env, row) : null, headers);
}

interface CreateMembershipBody {
  displayName: string;
  membershipType: (typeof MEMBERSHIP_TYPES)[number];
  companyName?: string;
  price?: number | null;
  billingCycle?: (typeof BILLING_CYCLES)[number] | null;
  paymentMethod?: string | null;
}

function isCreateMembershipBody(body: unknown): body is CreateMembershipBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  if (!isNonEmptyString(b.displayName, 200) || !isOneOf(b.membershipType, MEMBERSHIP_TYPES)) return false;
  if (!isOptionalString(b.companyName, 200)) return false;
  if (b.price !== undefined && b.price !== null && typeof b.price !== 'number') return false;
  if (b.billingCycle !== undefined && b.billingCycle !== null && !isOneOf(b.billingCycle, BILLING_CYCLES)) return false;
  if (!isOptionalString(b.paymentMethod, 100)) return false;
  return true;
}

export async function createMembership(
  request: Request,
  env: Env,
  userId: string,
  headers: HeadersInit
): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isCreateMembershipBody(body)) return errorResponse('Invalid request shape.', headers);

  const sql = db(env);
  const rows = (await sql`
    INSERT INTO memberships (clerk_user_id, membership_type, display_name, company_name, monthly_price, billing_cycle, payment_method)
    VALUES (${userId}, ${body.membershipType}, ${body.displayName}, ${body.companyName ?? null}, ${body.price ?? null}, ${body.billingCycle ?? null}, ${body.paymentMethod ?? null})
    RETURNING id, member_id, clerk_user_id, membership_type, display_name, company_name, monthly_price, billing_cycle, payment_method, created_at
  `) as MembershipRow[];
  return json(await toMembership(env, rows[0]), headers, 201);
}

export async function cancelMembership(env: Env, userId: string, headers: HeadersInit): Promise<Response> {
  const sql = db(env);
  await sql`DELETE FROM memberships WHERE clerk_user_id = ${userId}`;
  return json({ ok: true }, headers);
}

interface AddFamilyMemberBody {
  membershipId: number;
  name: string;
  relation?: string;
  age?: number;
}

function isAddFamilyMemberBody(body: unknown): body is AddFamilyMemberBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    isInt(b.membershipId) &&
    isNonEmptyString(b.name, 200) &&
    isOptionalString(b.relation, 100) &&
    (b.age === undefined || isInt(b.age))
  );
}

// Verifies the membership belongs to the caller before touching it — the
// original client-side version trusted whatever membershipId the browser
// sent with no ownership check at all beyond the app's own UI never
// generating a foreign id; this closes that gap for real.
export async function addFamilyMember(
  request: Request,
  env: Env,
  userId: string,
  headers: HeadersInit
): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isAddFamilyMemberBody(body)) return errorResponse('Invalid request shape.', headers);

  const sql = db(env);
  const owned = (await sql`SELECT id FROM memberships WHERE id = ${body.membershipId} AND clerk_user_id = ${userId}`) as {
    id: number;
  }[];
  if (!owned[0]) return errorResponse('Membership not found.', headers, 404);

  const existing = (await sql`SELECT COUNT(*)::int AS count FROM family_members WHERE membership_id = ${body.membershipId}`) as {
    count: number;
  }[];
  if (existing[0].count >= MAX_FAMILY_MEMBERS) {
    return errorResponse(`A family membership covers up to ${MAX_FAMILY_MEMBERS} people.`, headers);
  }

  await sql`
    INSERT INTO family_members (membership_id, name, relation, age)
    VALUES (${body.membershipId}, ${body.name.trim()}, ${body.relation ?? null}, ${body.age ?? null})
  `;
  return json({ ok: true }, headers, 201);
}

export async function removeFamilyMember(
  env: Env,
  userId: string,
  familyMemberId: number,
  headers: HeadersInit
): Promise<Response> {
  const sql = db(env);
  await sql`
    DELETE FROM family_members
    WHERE id = ${familyMemberId}
      AND membership_id IN (SELECT id FROM memberships WHERE clerk_user_id = ${userId})
  `;
  return json({ ok: true }, headers);
}

export async function searchMemberByMemberId(env: Env, memberId: string, headers: HeadersInit): Promise<Response> {
  const normalized = memberId.trim().toUpperCase();
  if (!normalized) return json(null, headers);

  const sql = db(env);
  const rows = (await sql`
    SELECT clerk_user_id, display_name, member_id, membership_type
    FROM memberships WHERE member_id = ${normalized}
  `) as { clerk_user_id: string; display_name: string; member_id: string; membership_type: string }[];
  const row = rows[0];
  if (!row) return json(null, headers);
  return json(
    { clerkUserId: row.clerk_user_id, displayName: row.display_name, memberId: row.member_id, membershipType: row.membership_type },
    headers
  );
}
