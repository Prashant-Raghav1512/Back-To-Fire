import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, MapPin, CheckCircle2, Circle } from 'lucide-react';
import { EventStatusBadge } from '@/components/EventStatusBadge';
import { EnrollButton } from '@/components/EnrollButton';
import { getEventStatus, getAgendaItemStatus, formatEventDateRange } from '@/lib/events';
import type { EventAgendaItem, FitnessEvent } from '@/data/types';

interface EventModalProps {
  event: FitnessEvent;
  enrolled: boolean;
  onEnrolled: () => void;
  onClose: () => void;
}

function AgendaList({ items, done }: { items: EventAgendaItem[]; done: boolean }) {
  if (items.length === 0) {
    return <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Nothing here yet — check back soon.</p>;
  }
  return (
    <ol className="mt-3 space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm">
          {done ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          ) : (
            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
          )}
          <div>
            <p className={`font-semibold ${done ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
              {item.time ? `${item.time} — ` : ''}
              {item.title}
            </p>
            <p className="text-gray-500 dark:text-gray-400">{item.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function EventModal({ event, enrolled, onEnrolled, onClose }: EventModalProps) {
  const status = getEventStatus(event);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const doneItems = event.agenda.filter((item) => getAgendaItemStatus(item) === 'done');
  const upcomingItems = event.agenda.filter((item) => getAgendaItemStatus(item) === 'upcoming');

  // Rendered via a portal straight to <body> — matches ExerciseModal, for the
  // same reason: a CSS `transform` on an ancestor (e.g. the scroll-reveal
  // animation) would otherwise hijack this modal's `position: fixed`.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 sm:p-7">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>

          <EventStatusBadge status={status} />
          <h2 className="mt-3 pr-10 font-display text-2xl font-bold text-gray-900 dark:text-white">
            {event.title}
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatEventDateRange(event)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {event.location}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{event.description}</p>

          {status === 'ended' && event.recap && (
            <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm leading-relaxed text-green-800 dark:bg-green-500/10 dark:text-green-300">
              {event.recap}
            </div>
          )}

          {status === 'ongoing' ? (
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  What's happened so far
                </p>
                <AgendaList items={doneItems} done />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  What's coming up next
                </p>
                <AgendaList items={upcomingItems} done={false} />
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {status === 'ended' ? 'What happened' : 'What to expect'}
              </p>
              <AgendaList items={event.agenda} done={status === 'ended'} />
            </div>
          )}

          {status !== 'ended' && (
            <EnrollButton
              itemType="event"
              itemId={event.id}
              itemTitle={event.title}
              itemDetail={`${formatEventDateRange(event)} · ${event.location}`}
              enrolled={enrolled}
              onEnrolled={onEnrolled}
              className="btn-primary mt-7 w-full"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
