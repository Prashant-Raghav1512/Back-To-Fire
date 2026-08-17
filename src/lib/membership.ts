import { useCallback, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import type { BillingCycle, MembershipType } from '@/data/membershipTypes';
import { apiFetch, authedFetch } from '@/lib/dataApi';

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
  /** Snapshot of the type's price at join time for whichever billingCycle was chosen (INR) — null for corporate's custom pricing. */
  price: number | null;
  /** Null only for corporate, which has no fixed recurring cycle. */
  billingCycle: BillingCycle | null;
  paymentMethod: string | null;
  createdAt: string;
  familyMembers: FamilyMember[];
}

export async function getMyMembership(token: string | null): Promise<Membership | null> {
  return authedFetch<Membership | null>('/membership', token);
}

export interface CreateMembershipParams {
  displayName: string;
  membershipType: MembershipType;
  companyName?: string;
  /** INR, the price for whichever billingCycle was chosen — omit or pass null for corporate's custom pricing. */
  price?: number | null;
  /** Omit or pass null for corporate, which has no fixed recurring cycle. */
  billingCycle?: BillingCycle | null;
  paymentMethod?: string | null;
}

export async function createMembership(params: CreateMembershipParams, token: string | null): Promise<Membership> {
  return authedFetch<Membership>('/membership', token, { method: 'POST', body: JSON.stringify(params) });
}

export async function cancelMembership(token: string | null): Promise<void> {
  await authedFetch('/membership', token, { method: 'DELETE' });
}

export interface AddFamilyMemberParams {
  membershipId: number;
  name: string;
  relation?: string;
  age?: number;
}

export async function addFamilyMember(params: AddFamilyMemberParams, token: string | null): Promise<void> {
  await authedFetch('/membership/family', token, { method: 'POST', body: JSON.stringify(params) });
}

export async function removeFamilyMember(id: number, token: string | null): Promise<void> {
  await authedFetch(`/membership/family/${id}`, token, { method: 'DELETE' });
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
  return apiFetch<MemberSearchResult | null>(`/membership/search?memberId=${encodeURIComponent(memberId)}`);
}

export function useMembership() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !user) {
      setMembership(null);
      return;
    }
    setLoading(true);
    try {
      setMembership(await getMyMembership(await getToken()));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, user, getToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { membership, loading, refresh };
}

export type UseMembershipResult = ReturnType<typeof useMembership>;
