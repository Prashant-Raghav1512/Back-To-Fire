import { useState } from 'react';
import { ArrowRight, Calendar, Dumbbell, Loader2, LogIn } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { SectionHeading } from '@/components/SectionHeading';
import { EventStatusBadge } from '@/components/EventStatusBadge';
import { EventModal } from '@/components/EventModal';
import { useMyEnrollments, type Enrollment } from '@/lib/enrollments';
import { events } from '@/data/events';
import { getEventStatus } from '@/lib/events';
import { useReveal } from '@/lib/useReveal';
import { useRouter } from '@/lib/router';
import type { FitnessEvent } from '@/data/types';

function formatJoinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ProgramEnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const { navigate } = useRouter();
  return (
    <div className="card flex flex-col p-6">
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
      <button
        onClick={() => navigate('/programs')}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400"
      >
        View program <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function EventEnrollmentCard({ enrollment, onOpen }: { enrollment: Enrollment; onOpen: (event: FitnessEvent) => void }) {
  const liveEvent = events.find((e) => e.id === enrollment.itemId);
  return (
    <div className="card flex flex-col p-6">
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

export function ProfilePage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const ref = useReveal<HTMLDivElement>();
  const { enrollments, loading, isEnrolledIn, refresh } = useMyEnrollments();
  const [selectedEvent, setSelectedEvent] = useState<FitnessEvent | null>(null);

  if (isLoaded && !isSignedIn) {
    return (
      <div className="pt-16 sm:pt-20">
        <section className="section-pad bg-gray-50 dark:bg-gray-950">
          <div className="container-x mx-auto max-w-xl text-center">
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
      <section className="relative overflow-hidden bg-gray-900 py-16 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-green-900/60" />
        <div className="relative container-x mx-auto px-5 sm:px-8">
          <span className="inline-block rounded-full bg-green-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-300 ring-1 ring-green-500/20">
            Your profile
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            {user?.firstName ? `Hey, ${user.firstName}` : 'Your training hub'}
          </h1>
          <p className="mt-3 text-gray-300">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
      </section>

      <section className="section-pad bg-gray-50 dark:bg-gray-950">
        <div ref={ref} className="reveal container-x mx-auto space-y-16">
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
            <SectionHeading eyebrow="Community" title="My Events" center={false} />
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
              <EmptyState message="You haven't joined an event yet." ctaLabel="Browse events" ctaPath="/events" />
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
