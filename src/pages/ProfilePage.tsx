import { useState } from 'react';
import { ArrowRight, Calendar, Check, Copy, Dumbbell, IdCard, Loader2, LogIn, MessageCircle, Trash2, UserRound } from 'lucide-react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { SectionHeading } from '@/components/SectionHeading';
import { EventStatusBadge } from '@/components/EventStatusBadge';
import { EventModal } from '@/components/EventModal';
import { ProfileDetailsForm } from '@/components/ProfileDetailsForm';
import { AnimatedPageBackground } from '@/components/AnimatedPageBackground';
import { CommentsModal } from '@/components/community/CommentsModal';
import { InvoiceButton } from '@/components/InvoiceButton';
import { useMyEnrollments, type Enrollment } from '@/lib/enrollments';
import { useMyPosts, deletePost } from '@/lib/communityPosts';
import { findGroup } from '@/lib/communityGroups';
import { useMembership } from '@/lib/membership';
import { useFriendId } from '@/lib/friendId';
import { membershipTypes } from '@/data/membershipTypes';
import { paidPlans } from '@/data/paidPlans';
import { events } from '@/data/events';
import { getEventStatus } from '@/lib/events';
import { timeAgo } from '@/lib/timeAgo';
import { useReveal } from '@/lib/useReveal';
import { useTilt } from '@/lib/useTilt';
import { useRouter } from '@/lib/router';
import type { CommunityPost, FitnessEvent } from '@/data/types';

function formatJoinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Free programs and paid plans (see paidPlans.ts) share the same
// `enrollments` table/itemType ('program') - only paid-plan enrollments get
// an invoice option, matched here by looking the enrollment's itemId back
// up against the static paidPlans catalog. Free programs have no price, so
// there's nothing to invoice.
function ProgramEnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const { navigate } = useRouter();
  const { user } = useUser();
  const tiltRef = useTilt<HTMLDivElement>();
  const plan = paidPlans.find((p) => p.id === enrollment.itemId);
  // itemDetail is a composed string this same codebase writes (see
  // MembershipPlans.tsx), e.g. "Rs. 3,999/mo · Adults · Premium · Pay via
  // UPI" - safe to parse back out since we control the exact format.
  const paymentMethod = enrollment.itemDetail?.match(/Pay via (.+)$/i)?.[1];

  return (
    <div ref={tiltRef} className="card card-hover tilt-glow flex flex-col p-6">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
        <Dumbbell className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-gray-900 dark:text-white">
        {enrollment.itemTitle}
      </h3>
      {enrollment.itemDetail && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{enrollment.itemDetail}</p>
      )}
      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        Enrolled {formatJoinedDate(enrollment.createdAt)}
      </p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/programs')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400"
        >
          View program <ArrowRight className="h-4 w-4" />
        </button>
        {plan && (
          <InvoiceButton
            label="Invoice"
            invoice={{
              invoiceNumber: `BTF-INV-E${enrollment.id}`,
              invoiceDate: new Date(enrollment.createdAt),
              billedToName: user?.fullName ?? user?.username ?? 'Born to Fire member',
              billedToEmail: user?.primaryEmailAddress?.emailAddress,
              items: [
                {
                  description: plan.title,
                  detail: `${plan.tier} plan · Monthly coaching membership`,
                  amount: plan.price,
                },
              ],
              paymentMethod,
            }}
          />
        )}
      </div>
    </div>
  );
}

function EventEnrollmentCard({ enrollment, onOpen }: { enrollment: Enrollment; onOpen: (event: FitnessEvent) => void }) {
  const liveEvent = events.find((e) => e.id === enrollment.itemId);
  const tiltRef = useTilt<HTMLDivElement>();
  return (
    <div ref={tiltRef} className="card card-hover tilt-glow flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
          <Calendar className="h-6 w-6" />
        </span>
        {liveEvent && <EventStatusBadge status={getEventStatus(liveEvent)} />}
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-gray-900 dark:text-white">
        {enrollment.itemTitle}
      </h3>
      {enrollment.itemDetail && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{enrollment.itemDetail}</p>
      )}
      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        Enrolled {formatJoinedDate(enrollment.createdAt)}
      </p>
      {liveEvent && (
        <button
          onClick={() => onOpen(liveEvent)}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400"
        >
          View details <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function MyPostCard({
  post,
  onOpen,
  onDelete,
}: {
  post: CommunityPost;
  onOpen: () => void;
  onDelete: () => Promise<void>;
}) {
  const tiltRef = useTilt<HTMLDivElement>();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const group = findGroup(post.groupType, post.groupKey);

  return (
    <div ref={tiltRef} className="card card-hover tilt-glow flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
          <MessageCircle className="h-6 w-6" />
        </span>
        {group && (
          <span className="badge bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
            {group.label}
          </span>
        )}
      </div>
      {post.body && (
        <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{post.body}</p>
      )}
      {post.imageUrl && <img src={post.imageUrl} alt="" className="mt-3 h-32 w-full rounded-xl object-cover" />}
      {post.videoUrl && <video src={post.videoUrl} controls className="mt-3 h-32 w-full rounded-xl bg-black" />}
      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        {timeAgo(post.createdAt)} &middot; {post.commentCount} comment{post.commentCount === 1 ? '' : 's'}
      </p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400"
        >
          View &amp; comment <ArrowRight className="h-4 w-4" />
        </button>
        {confirming ? (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={async () => {
                setDeleting(true);
                await onDelete();
                setDeleting(false);
              }}
              disabled={deleting}
              className="font-semibold text-red-500 hover:text-red-600 disabled:opacity-60"
            >
              {deleting ? 'Deleting...' : 'Confirm'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            aria-label="Delete post"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 transition hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { openSignIn } = useClerk();
  const { navigate } = useRouter();
  const ref = useReveal<HTMLDivElement>();
  const { enrollments, loading, isEnrolledIn, refresh } = useMyEnrollments();
  const { posts: myPosts, loading: postsLoading, refresh: refreshPosts } = useMyPosts();
  const { membership, loading: membershipLoading } = useMembership();
  const { friendId } = useFriendId();
  const [selectedEvent, setSelectedEvent] = useState<FitnessEvent | null>(null);
  const [activePost, setActivePost] = useState<CommunityPost | null>(null);
  const [friendIdCopied, setFriendIdCopied] = useState(false);

  const handleCopyFriendId = () => {
    if (!friendId) return;
    navigator.clipboard.writeText(friendId).then(() => {
      setFriendIdCopied(true);
      setTimeout(() => setFriendIdCopied(false), 2000);
    });
  };

  const handleDeletePost = async (postId: number) => {
    if (!user) return;
    await deletePost(postId, await getToken());
    await refreshPosts();
  };

  if (isLoaded && !isSignedIn) {
    return (
      <div className="pt-16 sm:pt-20">
        <section className="relative overflow-hidden section-pad bg-white dark:bg-gray-950">
          <AnimatedPageBackground
            blobs={[
              {
                color: 'bg-indigo-300',
                size: 'h-80 w-80',
                position: { top: '-5rem', left: '-6rem' },
                x: [0, 50, 0],
                y: [0, 35, 0],
                scale: [1, 1.15, 1],
                duration: 24,
              },
              {
                color: 'bg-blue-200',
                size: 'h-64 w-64',
                position: { bottom: '-3rem', right: '5%' },
                x: [0, -40, 0],
                y: [0, -25, 0],
                duration: 28,
              },
            ]}
          />
          <div className="relative z-10 container-x mx-auto max-w-xl text-center">
            <SectionHeading
              eyebrow="Your profile"
              title="Sign in to see your profile"
              subtitle="Track every program and event you've joined, all in one place."
            />
            <button onClick={() => openSignIn()} className="btn-primary mt-8">
              Sign in <LogIn className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    );
  }

  const programEnrollments = enrollments.filter((e) => e.itemType === 'program');
  const eventEnrollments = enrollments.filter((e) => e.itemType === 'event');

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-cyan-950 py-16 dark:bg-gray-900 sm:py-20">
        {/* Cyan in light mode, unchanged (green-tinted near-black) in dark mode. */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-cyan-900/95 to-cyan-700/50 dark:from-gray-900 dark:via-gray-900/95 dark:to-green-900/60" />
        <div className="relative container-x mx-auto px-5 sm:px-8">
          <span className="inline-block rounded-full bg-green-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-300 ring-1 ring-green-500/20">
            Your profile
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            {user?.firstName ? `Hey, ${user.firstName}` : 'Your training hub'}
          </h1>
          <p className="mt-3 text-gray-300">{user?.primaryEmailAddress?.emailAddress}</p>
          {friendId && (
            <button
              onClick={handleCopyFriendId}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/15"
              title="Copy your Friend ID"
            >
              <UserRound className="h-3.5 w-3.5 text-green-400" />
              Friend ID: <span className="font-mono font-semibold tracking-wider">{friendId}</span>
              {friendIdCopied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-gray-300" />
              )}
            </button>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden section-pad bg-white dark:bg-gray-950">
        <AnimatedPageBackground
          blobs={[
            {
              color: 'bg-indigo-300',
              size: 'h-96 w-96',
              position: { top: '-6rem', right: '-6rem' },
              x: [0, -50, 0],
              y: [0, 40, 0],
              scale: [1, 1.15, 1],
              duration: 25,
            },
            {
              color: 'bg-blue-200',
              size: 'h-72 w-72',
              position: { bottom: '5%', left: '-4rem' },
              x: [0, 45, 0],
              y: [0, -30, 0],
              duration: 29,
            },
          ]}
        />
        <div ref={ref} className="reveal relative z-10 container-x mx-auto space-y-16">
          <div>
            <SectionHeading eyebrow="About you" title="Personal Details" center={false} />
            <div className="mt-8 max-w-2xl">
              <ProfileDetailsForm />
            </div>
          </div>

          <div>
            <SectionHeading eyebrow="Perks" title="My Membership" center={false} />
            {membershipLoading ? (
              <div className="mt-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : membership ? (
              <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-orange-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <IdCard className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/60">
                      {membershipTypes.find((t) => t.id === membership.membershipType)?.label}
                    </p>
                    <p className="font-display text-xl font-extrabold tracking-wider">{membership.memberId}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/membership')}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-white/25 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:border-white/60 hover:bg-white/10 active:scale-95"
                >
                  Manage <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <EmptyState message="You're not a member yet - join to get a Member ID and exclusive perks." ctaLabel="View memberships" ctaPath="/membership" />
            )}
          </div>

          <div>
            <SectionHeading eyebrow="Training" title="My Programs" center={false} />
            {loading ? (
              <div className="mt-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : programEnrollments.length > 0 ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {programEnrollments.map((e) => (
                  <ProgramEnrollmentCard key={e.id} enrollment={e} />
                ))}
              </div>
            ) : (
              <EmptyState message="You haven't started a program yet." ctaLabel="Browse programs" ctaPath="/programs" />
            )}
          </div>

          <div>
            <SectionHeading eyebrow="Events" title="My Events" center={false} />
            {loading ? (
              <div className="mt-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : eventEnrollments.length > 0 ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {eventEnrollments.map((e) => (
                  <EventEnrollmentCard key={e.id} enrollment={e} onOpen={setSelectedEvent} />
                ))}
              </div>
            ) : (
              <EmptyState message="You haven't joined an event yet." ctaLabel="Browse events" ctaPath="/programs" />
            )}
          </div>

          <div>
            <SectionHeading eyebrow="Community" title="My Posts" center={false} />
            {postsLoading ? (
              <div className="mt-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : myPosts.length > 0 ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {myPosts.map((p) => (
                  <MyPostCard key={p.id} post={p} onOpen={() => setActivePost(p)} onDelete={() => handleDeletePost(p.id)} />
                ))}
              </div>
            ) : (
              <EmptyState message="You haven't posted in the community yet." ctaLabel="Go to Community" ctaPath="/community" />
            )}
          </div>
        </div>
      </section>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          enrolled={isEnrolledIn('event', selectedEvent.id)}
          onEnrolled={refresh}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {activePost && (
        <CommentsModal post={activePost} onClose={() => setActivePost(null)} onChanged={refreshPosts} />
      )}
    </div>
  );
}

function EmptyState({ message, ctaLabel, ctaPath }: { message: string; ctaLabel: string; ctaPath: string }) {
  const { navigate } = useRouter();
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      <button onClick={() => navigate(ctaPath)} className="btn-outline mt-5">
        {ctaLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
