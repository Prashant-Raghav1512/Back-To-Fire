import { useCallback, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { authedFetch } from '@/lib/dataApi';

export type EnrollmentItemType = 'program' | 'event';

export interface Enrollment {
  id: number;
  itemType: EnrollmentItemType;
  itemId: string;
  itemTitle: string;
  itemDetail: string | null;
  createdAt: string;
}

export interface EnrollParams {
  userEmail: string;
  itemType: EnrollmentItemType;
  itemId: string;
  itemTitle: string;
  itemDetail?: string;
}

export async function enroll(params: EnrollParams, token: string | null): Promise<void> {
  await authedFetch('/enrollments', token, { method: 'POST', body: JSON.stringify(params) });
}

export async function getMyEnrollments(token: string | null): Promise<Enrollment[]> {
  return authedFetch<Enrollment[]>('/enrollments', token);
}

// Fetches the signed-in user's enrollments once (and again on sign-in/user
// change) and exposes a `refresh` to re-fetch after a new enrollment — pages
// call this once and pass `isEnrolledIn`/`refresh` down, rather than each
// card querying independently.
export function useMyEnrollments() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !user) {
      setEnrollments([]);
      return;
    }
    setLoading(true);
    try {
      setEnrollments(await getMyEnrollments(await getToken()));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user, getToken]);

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
