import { useCallback, useEffect, useState } from 'react';
import { neon } from '@neondatabase/serverless';
import { useUser } from '@clerk/clerk-react';

// SECURITY NOTE: reuses the same browser-exposed connection as the contact
// form (src/lib/contact.ts) rather than provisioning a separate role. Two
// reasons: (1) every Neon role on this project is already neon_superuser —
// see contact.ts's note — so a dedicated role would add rotation hygiene
// but no actual access restriction; (2) Neon roles here are only usable once
// registered through Neon's own control plane (dashboard/API), which this
// environment has no credentials for, so a new role isn't something that
// can be reliably provisioned from code. If you want enrollments on an
// independently rotatable credential, create a role via the Neon dashboard
// and point a new VITE_NEON_ENROLLMENTS_URL at it.
const connectionString = import.meta.env.VITE_NEON_CONTACT_URL;

export type EnrollmentItemType = 'program' | 'event';

export interface Enrollment {
  id: number;
  itemType: EnrollmentItemType;
  itemId: string;
  itemTitle: string;
  itemDetail: string | null;
  createdAt: string;
}

interface EnrollmentRow {
  id: number;
  item_type: EnrollmentItemType;
  item_id: string;
  item_title: string;
  item_detail: string | null;
  created_at: string;
}

function client() {
  if (!connectionString) {
    throw new Error('Enrollments are not configured (VITE_NEON_CONTACT_URL is unset).');
  }
  return neon(connectionString);
}

export interface EnrollParams {
  clerkUserId: string;
  userEmail: string;
  itemType: EnrollmentItemType;
  itemId: string;
  itemTitle: string;
  itemDetail?: string;
}

export async function enroll(params: EnrollParams): Promise<void> {
  const sql = client();
  await sql`
    INSERT INTO enrollments (clerk_user_id, user_email, item_type, item_id, item_title, item_detail)
    VALUES (${params.clerkUserId}, ${params.userEmail}, ${params.itemType}, ${params.itemId}, ${params.itemTitle}, ${params.itemDetail ?? null})
    ON CONFLICT (clerk_user_id, item_type, item_id) DO NOTHING
  `;
}

export async function getMyEnrollments(clerkUserId: string): Promise<Enrollment[]> {
  const sql = client();
  const rows = (await sql`
    SELECT id, item_type, item_id, item_title, item_detail, created_at
    FROM enrollments
    WHERE clerk_user_id = ${clerkUserId}
    ORDER BY created_at DESC
  `) as EnrollmentRow[];

  return rows.map((row) => ({
    id: row.id,
    itemType: row.item_type,
    itemId: row.item_id,
    itemTitle: row.item_title,
    itemDetail: row.item_detail,
    createdAt: row.created_at,
  }));
}

// Fetches the signed-in user's enrollments once (and again on sign-in/user
// change) and exposes a `refresh` to re-fetch after a new enrollment — pages
// call this once and pass `isEnrolledIn`/`refresh` down, rather than each
// card querying independently.
export function useMyEnrollments() {
  const { user, isSignedIn } = useUser();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !user) {
      setEnrollments([]);
      return;
    }
    setLoading(true);
    try {
      setEnrollments(await getMyEnrollments(user.id));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isEnrolledIn = useCallback(
    (itemType: EnrollmentItemType, itemId: string) =>
      enrollments.some((e) => e.itemType === itemType && e.itemId === itemId),
    [enrollments]
  );

  return { enrollments, loading, refresh, isEnrolledIn };
}
