import type { EventAgendaItem, EventStatus, FitnessEvent } from '@/data/types';
import { events } from '@/data/events';

export function getEventStatus(event: FitnessEvent, now: Date = new Date()): EventStatus {
  const start = new Date(`${event.startDate}T00:00:00`);
  const end = new Date(`${event.endDate}T23:59:59`);
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'ongoing';
}

function fmt(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opts);
}

export function formatEventDateRange(event: FitnessEvent): string {
  if (event.startDate === event.endDate) {
    return fmt(event.startDate, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const start = new Date(`${event.startDate}T00:00:00`);
  const end = new Date(`${event.endDate}T00:00:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startStr = sameMonth
    ? fmt(event.startDate, { day: 'numeric' })
    : fmt(event.startDate, { day: 'numeric', month: 'short' });
  const endStr = fmt(event.endDate, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

// Whole-day difference, ignoring time-of-day, so "today" always reads as 0
// rather than a small negative/positive number depending on the clock.
export function daysUntil(event: FitnessEvent, now: Date = new Date()): number {
  const start = new Date(`${event.startDate}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

// "9:00 AM" / "2:30 PM" -> 24h hours/minutes. Deliberately strict (only the
// exact format used in src/data/events.ts) since it's parsing our own
// hand-written display strings, not arbitrary user input.
function parseTimeLabel(time?: string): { hours: number; minutes: number } {
  if (!time) return { hours: 0, minutes: 0 };
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!match) return { hours: 0, minutes: 0 };
  const [, hourStr, minuteStr, meridiem] = match;
  let hours = parseInt(hourStr, 10) % 12;
  if (meridiem.toUpperCase() === 'PM') hours += 12;
  return { hours, minutes: parseInt(minuteStr, 10) };
}

function agendaItemDateTime(item: EventAgendaItem): Date {
  const { hours, minutes } = parseTimeLabel(item.time);
  const date = new Date(`${item.date}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export type AgendaItemStatus = 'done' | 'upcoming';

export function getAgendaItemStatus(item: EventAgendaItem, now: Date = new Date()): AgendaItemStatus {
  return agendaItemDateTime(item) <= now ? 'done' : 'upcoming';
}

export function groupEventsByStatus(now: Date = new Date()) {
  const ongoing: FitnessEvent[] = [];
  const upcoming: FitnessEvent[] = [];
  const ended: FitnessEvent[] = [];

  for (const event of events) {
    const status = getEventStatus(event, now);
    if (status === 'ongoing') ongoing.push(event);
    else if (status === 'upcoming') upcoming.push(event);
    else ended.push(event);
  }

  ongoing.sort((a, b) => a.endDate.localeCompare(b.endDate));
  upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
  ended.sort((a, b) => b.endDate.localeCompare(a.endDate));

  return { ongoing, upcoming, ended };
}

// Unlike the hand-written chunks in knowledgeBase.ts, these are generated,
// not authored — an event's status is a function of *today's date*, so a
// hand-written "this is upcoming" sentence would silently go stale the
// moment the event started or ended. This regenerates on every module load
// (i.e. every page view), which is as fresh as a static site can be.
export function getEventKnowledgeChunks(now: Date = new Date()): { id: string; title: string; text: string }[] {
  const { ongoing, upcoming, ended } = groupEventsByStatus(now);

  const statusLabel: Record<EventStatus, string> = {
    ongoing: 'Ongoing',
    upcoming: 'Upcoming',
    ended: 'Past',
  };

  const statusSentence = (event: FitnessEvent): string => {
    const status = getEventStatus(event, now);
    if (status === 'ongoing') {
      return `It is happening right now and runs through ${fmt(event.endDate, { day: 'numeric', month: 'long', year: 'numeric' })}.`;
    }
    if (status === 'upcoming') {
      const days = daysUntil(event, now);
      return days <= 0
        ? 'It starts today.'
        : `It is upcoming, starting in ${days} day${days === 1 ? '' : 's'}.`;
    }
    return 'This event has already ended.';
  };

  // What happened / what's next, mirroring the detail modal on the Events
  // page — lets the chatbot answer "what happened at X" or "what's next in
  // Y" instead of only knowing an event exists.
  const progressSentence = (event: FitnessEvent): string => {
    const status = getEventStatus(event, now);
    if (status === 'ended') {
      return event.recap ? `What happened: ${event.recap}` : '';
    }
    if (status === 'ongoing') {
      const next = event.agenda.find((item) => getAgendaItemStatus(item, now) === 'upcoming');
      return next ? `Coming up next: ${next.title} - ${next.description}` : '';
    }
    if (event.agenda.length) {
      return `Planned agenda: ${event.agenda.map((item) => item.title).join(', ')}.`;
    }
    return '';
  };

  const eventChunks = events.map((event) => ({
    id: `event-${event.id}`,
    title: `${statusLabel[getEventStatus(event, now)]} event: ${event.title}`,
    text: `${event.title} is a ${event.type.toLowerCase()} (${event.format.toLowerCase()}) taking place ${formatEventDateRange(event)} at ${event.location}. ${event.description} ${statusSentence(event)} ${progressSentence(event)}`.trim(),
  }));

  const summaryChunk = {
    id: 'events-summary',
    title: 'Events overview: what is happening now and coming up',
    text: events.length
      ? [
          `Born to Fire currently has ${ongoing.length} event(s) happening right now and ${upcoming.length} upcoming event(s) on the calendar.`,
          ongoing.length ? `Happening now: ${ongoing.map((e) => e.title).join(', ')}.` : '',
          upcoming.length
            ? `Coming up: ${upcoming.map((e) => `${e.title} (${formatEventDateRange(e)})`).join('; ')}.`
            : 'There are no upcoming events on the calendar right now.',
          ended.length ? `Recently ended: ${ended.slice(0, 3).map((e) => e.title).join(', ')}.` : '',
          'Full details for every event, including how to join, are on the Programs & Events page.',
        ]
          .filter(Boolean)
          .join(' ')
      : 'Born to Fire has no events scheduled right now - check back soon or ask us directly.',
  };

  return [summaryChunk, ...eventChunks];
}
