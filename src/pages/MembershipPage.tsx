import { useState } from 'react';
import { User, Building2, Users, Check, Loader2, Search, Trash2, IdCard, XCircle } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { SectionHeading } from '@/components/SectionHeading';
import { AnimatedPageBackground } from '@/components/AnimatedPageBackground';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { paymentMethods } from '@/data/paymentMethods';
import { FriendActionButton } from '@/components/community/FriendActionButton';
import {
  useMembership,
  createMembership,
  cancelMembership,
  addFamilyMember,
  removeFamilyMember,
  findMemberByMemberId,
  type MemberSearchResult,
} from '@/lib/membership';
import { useFriends, sendFriendRequest, respondToFriendRequest } from '@/lib/friends';
import { membershipTypes, sharedMemberBenefits, type MembershipType, type MembershipTypeInfo } from '@/data/membershipTypes';

const TYPE_ICONS = { User, Building2, Users } as const;

function TypeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = TYPE_ICONS[name as keyof typeof TYPE_ICONS] ?? User;
  return <Icon className={className} />;
}

function TypePickerCard({
  type,
  selected,
  onSelect,
}: {
  type: MembershipTypeInfo;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`card card-hover flex flex-col p-6 text-left transition-all ${selected ? '!ring-2 ring-orange-400' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
          <TypeIcon name={type.icon} className="h-6 w-6" />
        </span>
        <p className="text-right">
          {type.price !== null ? (
            <>
              <span className="font-display text-xl font-extrabold text-gray-900 dark:text-white">
                &#8377;{type.price.toLocaleString('en-IN')}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">/month</span>
            </>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Custom pricing
            </span>
          )}
        </p>
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-gray-900 dark:text-white">{type.label}</h3>
      <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{type.tagline}</p>
      <ul className="mt-4 space-y-2">
        {type.benefits.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /> {b}
          </li>
        ))}
      </ul>
    </button>
  );
}

// Reached from navLinks (`/membership`) and summarized on the Profile page.
// Three states: pick a type (signed in, no membership yet), a loading
// spinner, or the full member card + family manager + find-a-member search
// once a membership exists. Normal/Family are paid (a fixed monthly price,
// gated behind picking a PaymentMethodSelector option); Corporate is
// custom/negotiated, no fixed price or payment method. None of this is a
// real charge - same "no backend to safely process a real checkout, so the
// payment method is just a recorded preference" reasoning as
// MembershipPlans.tsx's selector on /programs.
export function MembershipPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const { membership, loading, refresh } = useMembership();
  const friends = useFriends();

  const [selectedType, setSelectedType] = useState<MembershipType | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [familyName, setFamilyName] = useState('');
  const [familyRelation, setFamilyRelation] = useState('');
  const [familyAge, setFamilyAge] = useState('');
  const [addingFamily, setAddingFamily] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);

  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<MemberSearchResult | null>(null);
  const [friendBusy, setFriendBusy] = useState(false);

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const selectedTypeInfo = selectedType ? membershipTypes.find((t) => t.id === selectedType) ?? null : null;
  const selectedTypeIsPaid = selectedTypeInfo ? selectedTypeInfo.price !== null : false;

  const handleJoin = async () => {
    if (!user || !selectedType || !selectedTypeInfo || joining) return;
    if (selectedType === 'corporate' && !companyName.trim()) {
      setJoinError('Please enter your company name.');
      return;
    }
    if (selectedTypeIsPaid && !selectedMethod) {
      setJoinError('Please select a payment method.');
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      await createMembership({
        clerkUserId: user.id,
        displayName: user.fullName ?? user.username ?? 'Born to Fire member',
        membershipType: selectedType,
        companyName: selectedType === 'corporate' ? companyName.trim() : undefined,
        monthlyPrice: selectedTypeInfo.price,
        paymentMethod: selectedTypeIsPaid ? selectedMethod : undefined,
      });
      await refresh();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join, please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership || addingFamily) return;
    setAddingFamily(true);
    setFamilyError(null);
    try {
      await addFamilyMember({
        membershipId: membership.id,
        name: familyName,
        relation: familyRelation.trim() || undefined,
        age: familyAge ? Number(familyAge) : undefined,
      });
      setFamilyName('');
      setFamilyRelation('');
      setFamilyAge('');
      await refresh();
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : 'Could not add family member.');
    } finally {
      setAddingFamily(false);
    }
  };

  const handleRemoveFamilyMember = async (id: number) => {
    if (!membership) return;
    await removeFamilyMember(id, membership.id);
    await refresh();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim() || searching) return;
    setSearching(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      const result = await findMemberByMemberId(searchId);
      if (!result) {
        setSearchError('No member found with that ID.');
      } else {
        setSearchResult(result);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Could not search, please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!user || !searchResult || friendBusy) return;
    setFriendBusy(true);
    try {
      await sendFriendRequest({
        fromUserId: user.id,
        fromDisplayName: user.fullName ?? user.username ?? 'A Born to Fire member',
        toUserId: searchResult.clerkUserId,
        toDisplayName: searchResult.displayName,
      });
      await friends.refresh();
    } catch {
      // Button reflects the current state - not worth a dedicated error UI for a secondary action.
    } finally {
      setFriendBusy(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    if (!user || friendBusy) return;
    setFriendBusy(true);
    try {
      await respondToFriendRequest(requestId, user.id, true);
      await friends.refresh();
    } finally {
      setFriendBusy(false);
    }
  };

  const handleCancelMembership = async () => {
    if (!user || cancelling) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelMembership(user.id);
      await refresh();
      setConfirmCancel(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel, please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const activeTypeInfo = membership ? membershipTypes.find((t) => t.id === membership.membershipType) : null;

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900 py-16 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-amber-900/50" />
        <div className="relative container-x mx-auto px-5 sm:px-8">
          <span className="inline-block rounded-full bg-amber-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/20">
            Membership
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            Join as a member
          </h1>
          <p className="mt-3 max-w-2xl text-gray-300">
            Every member gets a unique Member ID, priority perks, and access to a members-only
            Community group - pick the membership that fits you.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden section-pad bg-white dark:bg-gray-950">
        <AnimatedPageBackground
          blobs={[
            {
              color: 'bg-amber-300',
              size: 'h-96 w-96',
              position: { top: '-6rem', right: '-8rem' },
              x: [0, -50, 0],
              y: [0, 35, 0],
              scale: [1, 1.15, 1],
              duration: 24,
            },
            {
              color: 'bg-yellow-200',
              size: 'h-72 w-72',
              position: { bottom: '5%', left: '-4rem' },
              x: [0, 45, 0],
              y: [0, -30, 0],
              duration: 28,
            },
          ]}
        />

        <div className="relative z-10 container-x mx-auto">
          {isLoaded && !isSignedIn && (
            <div className="text-center">
              <SectionHeading eyebrow="Get started" title="Sign in to choose your membership" />
              <button onClick={() => openSignIn()} className="btn-primary mt-6">
                Sign in
              </button>
            </div>
          )}

          {isSignedIn && loading && (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your membership...
            </div>
          )}

          {isSignedIn && !loading && !membership && (
            <div>
              <SectionHeading
                eyebrow="Choose a type"
                title="Which membership fits you?"
                subtitle="Every membership includes the shared benefits below, plus what's listed on each card."
              />
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {membershipTypes.map((type) => (
                  <TypePickerCard
                    key={type.id}
                    type={type}
                    selected={selectedType === type.id}
                    onSelect={() => {
                      setSelectedType(type.id);
                      setSelectedMethod(null);
                      setJoinError(null);
                    }}
                  />
                ))}
              </div>

              {selectedType && selectedTypeInfo && (
                <div className="mx-auto mt-8 max-w-md rounded-3xl bg-gray-50 p-6 dark:bg-gray-800/60">
                  {selectedType === 'corporate' && (
                    <>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Company name"
                        className="w-full rounded-full border-0 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-gray-200 transition focus:ring-orange-500 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                      />
                      <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                        Custom pricing - our team will reach out to discuss a plan for your team size.
                      </p>
                    </>
                  )}

                  {selectedTypeIsPaid && (
                    <div className={selectedType === 'corporate' ? 'mt-4' : ''}>
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-display text-2xl font-extrabold text-gray-900 dark:text-white">
                          &#8377;{selectedTypeInfo.price?.toLocaleString('en-IN')}
                        </span>{' '}
                        /month
                      </p>
                      <div className="mt-4">
                        <PaymentMethodSelector selected={selectedMethod} onSelect={setSelectedMethod} />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleJoin}
                    disabled={joining || (selectedTypeIsPaid && !selectedMethod)}
                    className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : `Join as ${selectedTypeInfo.label}`}
                  </button>
                  {selectedTypeIsPaid && !selectedMethod && !joinError && (
                    <p className="mt-2 text-center text-xs text-gray-400">Select a payment method to continue</p>
                  )}
                  {joinError && <p className="mt-3 text-center text-xs text-red-500">{joinError}</p>}
                </div>
              )}

              <div className="mx-auto mt-14 max-w-2xl">
                <h3 className="text-center font-display text-lg font-bold text-gray-900 dark:text-white">
                  Every member gets
                </h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {sharedMemberBenefits.map((b) => (
                    <div
                      key={b}
                      className="flex items-start gap-2.5 rounded-2xl bg-gray-50 p-3.5 text-sm text-gray-600 dark:bg-gray-800/60 dark:text-gray-300"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isSignedIn && membership && activeTypeInfo && (
            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-orange-900 p-7 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                      <IdCard className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      {activeTypeInfo.label}
                    </span>
                  </div>
                  <p className="mt-6 text-xs uppercase tracking-widest text-white/60">Member ID</p>
                  <p className="mt-1 font-display text-3xl font-extrabold tracking-wider">{membership.memberId}</p>
                  <p className="mt-4 text-sm text-white/80">{membership.displayName}</p>
                  {membership.companyName && <p className="text-xs text-white/60">{membership.companyName}</p>}
                  {membership.monthlyPrice !== null && (
                    <p className="mt-3 flex items-baseline gap-1.5 border-t border-white/10 pt-3 text-sm">
                      <span className="font-display text-lg font-bold">
                        &#8377;{membership.monthlyPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-white/60">/month</span>
                      {membership.paymentMethod && (
                        <span className="ml-auto text-xs text-white/60">
                          via {paymentMethods.find((m) => m.id === membership.paymentMethod)?.label ?? membership.paymentMethod}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    Your benefits
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {[...sharedMemberBenefits, ...activeTypeInfo.benefits].map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800">
                  {confirmCancel ? (
                    <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-500/10">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        Cancel your membership? You'll lose your Member ID and member benefits
                        {membership.membershipType === 'family' ? ', and your registered family members will be removed' : ''}.
                        This can't be undone.
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={handleCancelMembership}
                          disabled={cancelling}
                          className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
                        >
                          {cancelling ? 'Cancelling...' : 'Yes, cancel membership'}
                        </button>
                        <button
                          onClick={() => setConfirmCancel(false)}
                          disabled={cancelling}
                          className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Never mind
                        </button>
                      </div>
                      {cancelError && <p className="mt-2 text-xs text-red-500">{cancelError}</p>}
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                    >
                      <XCircle className="h-4 w-4" /> Cancel membership
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-10">
                {membership.membershipType === 'family' && (
                  <div>
                    <SectionHeading
                      eyebrow="Family"
                      title="Family members"
                      subtitle={`Register up to 4 people under your membership (${membership.familyMembers.length}/4 used).`}
                      center={false}
                    />
                    <div className="mt-6 space-y-3">
                      {membership.familyMembers.map((fm) => (
                        <div
                          key={fm.id}
                          className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{fm.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {[fm.relation, fm.age ? `${fm.age} yrs` : null].filter(Boolean).join(' · ') ||
                                'Family member'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFamilyMember(fm.id)}
                            aria-label="Remove family member"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {membership.familyMembers.length === 0 && (
                        <p className="text-sm text-gray-400 dark:text-gray-500">No family members added yet.</p>
                      )}
                    </div>

                    {membership.familyMembers.length < 4 && (
                      <form
                        onSubmit={handleAddFamilyMember}
                        className="mt-5 grid gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60 sm:grid-cols-3"
                      >
                        <input
                          value={familyName}
                          onChange={(e) => setFamilyName(e.target.value)}
                          placeholder="Name"
                          required
                          className="rounded-full border-0 bg-white px-4 py-2 text-sm text-gray-900 outline-none ring-1 ring-gray-200 focus:ring-orange-500 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                        />
                        <input
                          value={familyRelation}
                          onChange={(e) => setFamilyRelation(e.target.value)}
                          placeholder="Relation (optional)"
                          className="rounded-full border-0 bg-white px-4 py-2 text-sm text-gray-900 outline-none ring-1 ring-gray-200 focus:ring-orange-500 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                        />
                        <input
                          value={familyAge}
                          onChange={(e) => setFamilyAge(e.target.value)}
                          type="number"
                          min={1}
                          max={120}
                          placeholder="Age (optional)"
                          className="rounded-full border-0 bg-white px-4 py-2 text-sm text-gray-900 outline-none ring-1 ring-gray-200 focus:ring-orange-500 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                        />
                        <button
                          type="submit"
                          disabled={addingFamily}
                          className="btn-primary !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-3"
                        >
                          {addingFamily ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add family member'}
                        </button>
                        {familyError && <p className="text-xs text-red-500 sm:col-span-3">{familyError}</p>}
                      </form>
                    )}
                  </div>
                )}

                <div>
                  <SectionHeading
                    eyebrow="Connect"
                    title="Find a member"
                    subtitle="Search by their Member ID to add them as a friend."
                    center={false}
                  />
                  <form onSubmit={handleSearch} className="mt-6 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="e.g. BTF000042"
                        className="w-full rounded-full border-0 bg-gray-100 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none ring-1 ring-transparent transition focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searching || !searchId.trim()}
                      className="btn-primary shrink-0 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                    </button>
                  </form>
                  {searchError && <p className="mt-2 text-xs text-red-500">{searchError}</p>}

                  {searchResult && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3.5 dark:bg-gray-800/60">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {searchResult.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{searchResult.memberId}</p>
                      </div>
                      {searchResult.clerkUserId === user?.id ? (
                        <span className="text-xs font-medium text-gray-400">That's you</span>
                      ) : (
                        <FriendActionButton
                          friendStatus={friends.statusFor(searchResult.clerkUserId)}
                          onSend={handleSendRequest}
                          onAccept={handleAcceptRequest}
                          busy={friendBusy}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
