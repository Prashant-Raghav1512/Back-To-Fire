import { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  MapPin,
  GraduationCap,
  Flame,
  Trophy,
  Users,
  Video,
  PartyPopper,
} from 'lucide-react';
import { SectionHeading } from '@/components/SectionHeading';
import { EventStatusBadge } from '@/components/EventStatusBadge';
import { EventModal } from '@/components/EventModal';
import { EnrollButton } from '@/components/EnrollButton';
import { AnimatedPageBackground } from '@/components/AnimatedPageBackground';
import { groupEventsByStatus, formatEventDateRange, daysUntil, getEventStatus } from '@/lib/events';
import { useMyEnrollments } from '@/lib/enrollments';
import { useReveal } from '@/lib/useReveal';
import { useTilt } from '@/lib/useTilt';
import { useParallax } from '@/lib/useParallax';
import { EVENT_TYPE_STYLES } from '@/lib/categoryStyles';
import type { FitnessEvent } from '@/data/types';

const iconMap = { GraduationCap, Flame, Trophy, Users, Video, PartyPopper } as const;

interface EventCardProps {
  event: FitnessEvent;
  onSelect: (event: FitnessEvent) => void;
  enrolled: boolean;
  onEnrolled: () => void;
}

function EventCard({ event, onSelect, enrolled, onEnrolled }: EventCardProps) {
  const status = getEventStatus(event);
  const ended = status === 'ended';
  const Icon = iconMap[event.icon as keyof typeof iconMap];
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

export function EventsPage() {
  const ref = useReveal<HTMLDivElement>();
  const { ongoing, upcoming, ended } = groupEventsByStatus();
  const [selected, setSelected] = useState<FitnessEvent | null>(null);
  const { isEnrolledIn, refresh } = useMyEnrollments();
  const heroImgRef = useParallax<HTMLImageElement>();

  return (
    <div className="pt-16 sm:pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900 py-20 sm:py-28">
        <div className="absolute inset-0">
          <img
            ref={heroImgRef}
            src={`${import.meta.env.BASE_URL}hero-contact-events.jpg`}
            alt="Group calisthenics session outdoors"
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/85 to-green-900/60" />
        </div>
        <div className="relative container-x mx-auto px-5 text-center sm:px-8">
          <span className="inline-block rounded-full bg-green-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-300 ring-1 ring-green-500/20">
            Events
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Train together, not just alone
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">
            Challenges, workshops, and in-person meetups across India - see what is happening right
            now, what is coming up, and what you missed. Tap any event for the full details.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden section-pad bg-white dark:bg-gray-950">
        <AnimatedPageBackground
          blobs={[
            {
              color: 'bg-purple-300',
              size: 'h-96 w-96',
              position: { top: '-6rem', right: '-8rem' },
              x: [0, -60, 0],
              y: [0, 40, 0],
              scale: [1, 1.15, 1],
              duration: 23,
            },
            {
              color: 'bg-violet-200',
              size: 'h-72 w-72',
              position: { bottom: '5%', left: '-4rem' },
              x: [0, 50, 0],
              y: [0, -30, 0],
              duration: 27,
            },
            {
              color: 'bg-fuchsia-200',
              size: 'h-56 w-56',
              position: { top: '45%', left: '40%' },
              x: [0, -30, 20, 0],
              y: [0, 30, -20, 0],
              duration: 32,
            },
          ]}
        />
        <div ref={ref} className="reveal relative z-10 container-x mx-auto space-y-16">
          {ongoing.length > 0 && (
            <div>
              <SectionHeading eyebrow="Live now" title="Happening now" center={false} />
              <EventGrid eventList={ongoing} onSelect={setSelected} isEnrolledIn={isEnrolledIn} onEnrolled={refresh} />
            </div>
          )}

          <div>
            <SectionHeading eyebrow="Mark your calendar" title="Coming up" center={false} />
            {upcoming.length > 0 ? (
              <EventGrid eventList={upcoming} onSelect={setSelected} isEnrolledIn={isEnrolledIn} onEnrolled={refresh} />
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
              <EventGrid eventList={ended} onSelect={setSelected} isEnrolledIn={isEnrolledIn} onEnrolled={refresh} />
            </div>
          )}
        </div>
      </section>

      {selected && (
        <EventModal
          event={selected}
          enrolled={isEnrolledIn('event', selected.id)}
          onEnrolled={refresh}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
