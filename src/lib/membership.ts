import { useCallback, useEffect, useState } from 'react';
import { neon } from '@neondatabase/serverless';
import { useUser } from '@clerk/clerk-react';
import type { MembershipType } from '@/data/membershipTypes';

// SECURITY NOTE: same browser-exposed connection as every other
// Community/contact feature (src/lib/community.ts, contact.ts) — see
// those files' SECURITY NOTE comments for why a separate role wouldn't add
// real access restriction on this project.
const connectionString = import.meta.env.VITE_NEON_CONTACT_URL;

function client() {
  if (!connectionString) {
    throw new Error('Membership is not configured (VITE_NEON_CONTACT_URL is unset).');
  }
  return neon(connectionString);
}

export interface FamilyMember {
  id: number;
  membershipId: number;
  name: string;
  relation: string | null;
  age: number | null;
}

export interface Membership {
  id: number;
  memberId: string;
  clerkUserId: string;
  membershipType: MembershipType;
  displayName: string;
  companyName: string | null;
  /** Snapshot of the type's price (INR/month) at join time — null for corporate's custom pricing. */
  monthlyPrice: number | null;
  paymentMethod: string | null;
  createdAt: string;
  familyMembers: FamilyMember[];
}

interface MembershipRow {
  id: number;
  member_id: string;
  clerk_user_id: string;
  membership_type: MembershipType;
  display_name: string;
  company_name: string | null;
  monthly_price: number | null;
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

function rowToFamilyMember(row: FamilyMemberRow): FamilyMember {
  return {
    id: Number(row.id),
    membershipId: Number(row.membership_id),
    name: row.name,
    relation: row.relation,
    age: row.age,
  };
}

async function getFamilyMembers(membershipId: number): Promise<FamilyMember[]> {
  const sql = client();
  const rows = (await sql`
    SELECT id, membership_id, name, relation, age
    FROM family_members WHERE membership_id = ${membershipId}
    ORDER BY created_at ASC
  `) as FamilyMemberRow[];
  return rows.map(rowToFamilyMember);
}

async function rowToMembership(row: MembershipRow): Promise<Membership> {
  const familyMembers = row.membership_type === 'family' ? await getFamilyMembers(Number(row.id)) : [];
  return {
    id: Number(row.id),
    memberId: row.member_id,
    clerkUserId: row.clerk_user_id,
    membershipType: row.membership_type,
    displayName: row.display_name,
    companyName: row.company_name,
    monthlyPrice: row.monthly_price,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    familyMembers,
  };
}

export async function getMyMembership(clerkUserId: string): Promise<Membership | null> {
  const sql = client();
  const rows = (await sql`
    SELECT id, member_id, clerk_user_id, membership_type, display_name, company_name, monthly_price, payment_method, created_at
    FROM memberships WHERE clerk_user_id = ${clerkUserId}
  `) as MembershipRow[];
  const row = rows[0];
  return row ? rowToMembership(row) : null;
}

export interface CreateMembershipParams {
  clerkUserId: string;
  displayName: string;
  membershipType: MembershipType;
  companyName?: string;
  /** INR/month, omit or pass null for corporate's custom pricing. */
  monthlyPrice?: number | null;
  paymentMethod?: string | null;
}

export async function createMembership(params: CreateMembershipParams): Promise<Membership> {
  const sql = client();
  const rows = (await sql`
    INSERT INTO memberships (clerk_user_id, membership_type, display_name, company_name, monthly_price, payment_method)
    VALUES (
      ${params.clerkUserId},
      ${params.membershipType},
      ${params.displayName},
      ${params.companyName ?? null},
      ${params.monthlyPrice ?? null},
      ${params.paymentMethod ?? null}
    )
    RETURNING id, member_id, clerk_user_id, membership_type, display_name, company_name, monthly_price, payment_method, created_at
  `) as MembershipRow[];
  return rowToMembership(rows[0]);
}

// Scoped to the owner (WHERE ... AND clerk_user_id = ...) even though every
// visitor's browser already has full write access to this table directly
// (see the SECURITY NOTE above) — this isn't real access control, just a
// guard against the app's own UI deleting the wrong row, same pattern as
// deletePost/deleteComment in communityPosts.ts. `family_members` rows
// cascade-delete automatically (see db/schema.sql's ON DELETE CASCADE) —
// canceling a family membership also clears its registered family members.
// The freed-up member_id is never reused (it's derived from the row's own
// bigserial id, which keeps incrementing), so re-joining later always gets
// a brand new one.
export async function cancelMembership(clerkUserId: string): Promise<void> {
  const sql = client();
  await sql`DELETE FROM memberships WHERE clerk_user_id = ${clerkUserId}`;
}

const MAX_FAMILY_MEMBERS = 4;

export interface AddFamilyMemberParams {
  membershipId: number;
  name: string;
  relation?: string;
  age?: number;
}

export async function addFamilyMember(params: AddFamilyMemberParams): Promise<void> {
  const name = params.name.trim();
  if (!name) throw new Error('Please enter a name.');

  const sql = client();
  const existing = (await sql`SELECT COUNT(*)::int AS count FROM family_members WHERE membership_id = ${params.membershipId}`) as {
    count: number;
  }[];
  if (existing[0].count >= MAX_FAMILY_MEMBERS) {
    throw new Error(`A family membership covers up to ${MAX_FAMILY_MEMBERS} people.`);
  }

  await sql`
    INSERT INTO family_members (membership_id, name, relation, age)
    VALUES (${params.membershipId}, ${name}, ${params.relation ?? null}, ${params.age ?? null})
  `;
}

export async function removeFamilyMember(id: number, membershipId: number): Promise<void> {
  const sql = client();
  await sql`DELETE FROM family_members WHERE id = ${id} AND membership_id = ${membershipId}`;
}

export interface MemberSearchResult {
  clerkUserId: string;
  displayName: string;
  memberId: string;
  membershipType: MembershipType;
}

// Looks a member up by their Member ID (e.g. "BTF000042") — the entry
// point for "add someone as a friend by their ID" rather than only ever
// meeting people through a Community group's chat/posts.
export async function findMemberByMemberId(memberId: string): Promise<MemberSearchResult | null> {
  const normalized = memberId.trim().toUpperCase();
  if (!normalized) return null;

  const sql = client();
  const rows = (await sql`
    SELECT clerk_user_id, display_name, member_id, membership_type
    FROM memberships WHERE member_id = ${normalized}
  `) as { clerk_user_id: string; display_name: string; member_id: string; membership_type: MembershipType }[];
  const row = rows[0];
  if (!row) return null;
  return {
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    memberId: row.member_id,
    membershipType: row.membership_type,
  };
}

export function useMembership() {
  const { user, isSignedIn } = useUser();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !user) {
      setMembership(null);
      return;
    }
    setLoading(true);
    try {
      setMembership(await getMyMembership(user.id));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { membership, loading, refresh };
}

export type UseMembershipResult = ReturnType<typeof useMembership>;
