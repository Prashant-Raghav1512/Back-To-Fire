import { useState } from 'react';
import {
  Sprout,
  Flame,
  Zap,
  Check,
  ArrowRight,
  Clock,
  BarChart3,
  Calendar,
  MapPin,
  GraduationCap,
  Trophy,
  Users,
  Video,
  PartyPopper,
} from 'lucide-react';
import { SectionHeading } from '@/components/SectionHeading';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { EventStatusBadge } from '@/components/EventStatusBadge';
import { EventModal } from '@/components/EventModal';
import { EnrollButton } from '@/components/EnrollButton';
import { TiltCard } from '@/components/TiltCard';
import { MembershipPlans } from '@/components/MembershipPlans';
import { GymBranchLocator } from '@/components/GymBranchLocator';
import { AnimatedPageBackground } from '@/components/AnimatedPageBackground';
import { programs } from '@/data/content';
import { groupEventsByStatus, formatEventDateRange, daysUntil, getEventStatus } from '@/lib/events';
import { useMyEnrollments } from '@/lib/enrollments';
import { useReveal } from '@/lib/useReveal';
import { useTilt } from '@/lib/useTilt';
import { useParallax } from '@/lib/useParallax';
import { DIFFICULTY_CARD_STYLES, EVENT_TYPE_STYLES } from '@/lib/categoryStyles';
import type { FitnessEvent } from '@/data/types';

const programIconMap = { Sprout, Flame, Zap } as const;
const eventIconMap = { GraduationCap, Flame, Trophy, Users, Video, PartyPopper } as const;

interface EventCardProps {
  event: FitnessEvent;
  onSelect: (event: FitnessEvent) => void;
  enrolled: boolean;
  onEnrolled: () => void;
}

function EventCard({ event, onSelect, enrolled, onEnrolled }: EventCardProps) {
  const status = getEventStatus(event);
  const ended = status === 'ended';
  const Icon = eventIconMap[event.icon as keyof typeof eventIconMap];
  const days = daysUntil(event);
  const tiltRef = useTilt<HTMLDivElement>();
  const typeStyle = EVENT_TYPE_STYLES[event.type];

  return (
    <div
      ref={tiltRef}
      onClick={() => onSelect(event)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(event);
        }
      }}
      role="button"
      tabIndex={0}
      className={`card card-hover tilt-glow flex cursor-pointer flex-col p-6 text-left !ring-2 ${typeStyle.ring} ${ended ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${typeStyle.icon}`}>
          <Icon className="h-6 w-6" />
        </span>
        <EventStatusBadge status={status} />
      </div>

      <h3 className="mt-4 font-display text-lg font-bold text-gray-900 dark:text-white">
        {event.title}
      </h3>

      <div className="mt-2 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {formatEventDateRange(event)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {event.location}
        </span>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {event.description}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className={`badge ${typeStyle.badge}`}>
          {event.type} &middot; {event.format}
        </span>
        {status === 'upcoming' && (
          <span className="text-xs font-semibold text-orange-500">
            {days <= 0 ? 'Starting soon' : `In ${days} day${days === 1 ? '' : 's'}`}
          </span>
        )}
      </div>

      {ended ? (
        <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors dark:text-green-400">
          See what happened <ArrowRight className="h-4 w-4" />
        </p>
      ) : (
        <EnrollButton
          itemType="event"
          itemId={event.id}
          itemTitle={event.title}
          itemDetail={`${formatEventDateRange(event)} · ${event.location}`}
          enrolled={enrolled}
          onEnrolled={onEnrolled}
          className="btn-outline mt-5 w-full !py-2.5 text-sm"
        />
      )}
    </div>
  );
}

interface EventGridProps {
  eventList: FitnessEvent[];
  onSelect: (event: FitnessEvent) => void;
  isEnrolledIn: (itemType: 'event', itemId: string) => boolean;
  onEnrolled: () => void;
}

function EventGrid({ eventList, onSelect, isEnrolledIn, onEnrolled }: EventGridProps) {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
      {eventList.map((e) => (
        <EventCard
          key={e.id}
          event={e}
          onSelect={onSelect}
          enrolled={isEnrolledIn('event', e.id)}
          onEnrolled={onEnrolled}
        />
      ))}
    </div>
  );
}

// Merges what used to be two separate pages (/programs and /events) into
// one — both routes render this component (see App.tsx) so any existing
// links/bookmarks to either still work. Program cards and events read as
// two related "what you can do here" sections rather than two disconnected
// destinations, followed by the paid plans, gym locator, and the "how it
// works" explainer that were already on the Programs side.
export function ProgramsPage() {
  const programsRef = useReveal<HTMLDivElement>();
  const eventsRef = useReveal<HTMLDivElement>();
  const { isEnrolledIn, refresh } = useMyEnrollments();
  const heroImgRef = useParallax<HTMLImageElement>();
  const { ongoing, upcoming, ended } = groupEventsByStatus();
  const [selectedEvent, setSelectedEvent] = useState<FitnessEvent | null>(null);

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900 py-20 sm:py-28">
        <div className="absolute inset-0">
          <img
            ref={heroImgRef}
            src={`${import.meta.env.BASE_URL}hero-programs.jpg`}
            alt="Man working out at outdoor gym"
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/85 to-green-900/60" />
        </div>
        <div className="relative container-x mx-auto px-5 text-center sm:px-8">
          <span className="inline-block rounded-full bg-green-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-300 ring-1 ring-green-500/20">
            Programs & Events
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Programs to follow. Events to show up for.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">
            Three structured tiers to build real strength, plus challenges, workshops, and meetups
            happening across India - pick a program, then find your people.
          </p>
        </div>
      </section>

      {/* Program cards + Events */}
      <section className="relative overflow-hidden section-pad bg-white dark:bg-gray-950">
        <AnimatedPageBackground
          blobs={[
            {
              color: 'bg-green-300',
              size: 'h-96 w-96',
              position: { top: '-6rem', left: '-8rem' },
              x: [0, 60, 0],
              y: [0, 40, 0],
              scale: [1, 1.15, 1],
              duration: 22,
            },
            {
              color: 'bg-purple-200',
              size: 'h-72 w-72',
              position: { bottom: '-4rem', right: '-4rem' },
              x: [0, -50, 0],
              y: [0, -30, 0],
              duration: 27,
            },
            {
              color: 'bg-emerald-200',
              size: 'h-64 w-64',
              position: { top: '30%', right: '15%' },
              x: [0, 30, -20, 0],
              y: [0, -40, 20, 0],
              duration: 30,
            },
          ]}
        />
        <div className="relative z-10 container-x mx-auto">
          <div ref={programsRef} className="reveal">
            <SectionHeading
              eyebrow="Choose your tier"
              title="Three paths. One goal - mastery."
              subtitle="Each program is a complete journey with clear weekly progressions, rest days, and milestones."
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-3 stagger-children">
              {programs.map((p) => {
                const Icon = programIconMap[p.icon as keyof typeof programIconMap];
                const featured = p.difficulty === 'Intermediate';
                const style = DIFFICULTY_CARD_STYLES[p.difficulty];
                return (
                  <TiltCard
                    key={p.id}
                    className={`card card-hover relative flex flex-col p-7 !ring-2 ${
                      featured ? 'ring-orange-500 lg:scale-[1.03]' : style.ring
                    }`}
                  >
                    {featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                        Most popular
                      </span>
                    )}
                    <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${style.icon}`}>
                      <Icon className="h-8 w-8" />
                    </span>
                    <div className="mt-5 flex items-center gap-2">
                      <DifficultyBadge level={p.difficulty} />
                      <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        <Clock className="h-3 w-3" /> {p.duration}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-bold text-gray-900 dark:text-white">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {p.description}
                    </p>
                    <ul className="mt-5 flex-1 space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <EnrollButton
                      itemType="program"
                      itemId={p.id}
                      itemTitle={p.title}
                      itemDetail={`${p.difficulty} · ${p.duration}`}
                      enrolled={isEnrolledIn('program', p.id)}
                      onEnrolled={refresh}
                      label={`Start ${p.title}`}
                      className={`mt-6 w-full ${featured ? 'btn-primary' : 'btn-outline'}`}
                    />
                  </TiltCard>
                );
              })}
            </div>
          </div>

          {/* Events */}
          <div ref={eventsRef} className="reveal mt-20 space-y-16">
            <SectionHeading
              eyebrow="Events"
              title="Train together, not just alone"
              subtitle="Challenges, workshops, and in-person meetups across India - tap any event for the full details."
            />

            {ongoing.length > 0 && (
              <div>
                <SectionHeading eyebrow="Live now" title="Happening now" center={false} />
                <EventGrid eventList={ongoing} onSelect={setSelectedEvent} isEnrolledIn={isEnrolledIn} onEnrolled={refresh} />
              </div>
            )}

            <div>
              <SectionHeading eyebrow="Mark your calendar" title="Coming up" center={false} />
              {upcoming.length > 0 ? (
                <EventGrid eventList={upcoming} onSelect={setSelectedEvent} isEnrolledIn={isEnrolledIn} onEnrolled={refresh} />
              ) : (
                <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                  Nothing on the calendar right now - check back soon, or ask the chatbot below and
                  we will let you know as soon as something is scheduled.
                </p>
              )}
            </div>

            {ended.length > 0 && (
              <div>
                <SectionHeading eyebrow="Recap" title="Past events" center={false} />
                <EventGrid eventList={ended} onSelect={setSelectedEvent} isEnrolledIn={isEnrolledIn} onEnrolled={refresh} />
              </div>
            )}
          </div>

          {/* Paid membership plans */}
          <div className="mt-20">
            <MembershipPlans />
          </div>

          {/* Gym branch locator */}
          <div className="mt-20">
            <GymBranchLocator />
          </div>

          {/* How it works */}
          <div className="mt-20">
            <SectionHeading
              eyebrow="How it works"
              title="Simple, structured, sustainable"
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-3 stagger-children">
              {[
                { icon: BarChart3, step: '01', title: 'Assess your level', text: 'Take a quick self-test to find the right starting tier.' },
                { icon: Clock, step: '02', title: 'Follow the plan', text: 'Train 3-5 days a week with guided sessions and built-in rest.' },
                { icon: ArrowRight, step: '03', title: 'Progress & level up', text: 'Hit your milestones, then move to the next progression.' },
              ].map((s) => (
                <TiltCard key={s.step} className="card card-hover p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-gray-700">
                      <s.icon className="h-6 w-6" />
                    </span>
                    <span className="font-display text-3xl font-extrabold text-gray-200 dark:text-gray-700">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-gray-900 dark:text-white">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {s.text}
                  </p>
                </TiltCard>
              ))}
            </div>
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
